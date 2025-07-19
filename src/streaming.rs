use anyhow::Result;
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};
use tracing::{debug, error, info, warn};
use webrtc::api::interceptor_registry::register_default_interceptors;
use webrtc::api::media_engine::{MediaEngine, MIME_TYPE_H264, MIME_TYPE_OPUS};
use webrtc::api::APIBuilder;
use webrtc::data_channel::data_channel_message::DataChannelMessage;
use webrtc::data_channel::RTCDataChannel;
use webrtc::ice_transport::ice_server::RTCIceServer;
use webrtc::peer_connection::configuration::RTCConfiguration;
use webrtc::peer_connection::peer_connection_state::RTCPeerConnectionState;
use webrtc::peer_connection::RTCPeerConnection;
use webrtc::rtp_transceiver::rtp_codec::RTCRtpCodecCapability;
use webrtc::track::track_local::track_local_static_rtp::TrackLocalStaticRTP;
use webrtc::track::track_local::TrackLocal;

use crate::config::Config;
use crate::encoding::EncodedFrame;
use crate::error::GameShareError;
use crate::input::{GameInputEvent, InputHandler};

pub struct WebRTCStreamer {
    config: Arc<Config>,
    peer_connection: Arc<RTCPeerConnection>,
    video_track: Arc<TrackLocalStaticRTP>,
    audio_track: Option<Arc<TrackLocalStaticRTP>>,
    data_channel: Arc<RTCDataChannel>,
    input_handler: Arc<RwLock<InputHandler>>,
    frame_sender: mpsc::Sender<EncodedFrame>,
}

impl WebRTCStreamer {
    pub async fn new(config: &Config, input_handler: InputHandler) -> Result<Self> {
        let config = Arc::new(config.clone());
        
        // Create media engine
        let mut media_engine = MediaEngine::default();
        
        // Register H.264 codec for video
        media_engine.register_codec(
            RTCRtpCodecCapability {
                mime_type: MIME_TYPE_H264.to_owned(),
                clock_rate: 90000,
                channels: 0,
                sdp_fmtp_line: "level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f".to_owned(),
                rtcp_feedback: vec![],
            },
            webrtc::rtp_transceiver::rtp_codec::RTPCodecType::Video,
        )?;

        // Register Opus codec for audio (if audio is enabled)
        if config.capture.capture_audio {
            media_engine.register_codec(
                RTCRtpCodecCapability {
                    mime_type: MIME_TYPE_OPUS.to_owned(),
                    clock_rate: 48000,
                    channels: 2,
                    sdp_fmtp_line: "minptime=10;useinbandfec=1".to_owned(),
                    rtcp_feedback: vec![],
                },
                webrtc::rtp_transceiver::rtp_codec::RTPCodecType::Audio,
            )?;
        }

        // Create API
        let mut interceptor_registry = register_default_interceptors(
            webrtc::api::interceptor_registry::InterceptorRegistry::new(),
            &media_engine,
        )?;

        let api = APIBuilder::new()
            .with_media_engine(media_engine)
            .with_interceptor_registry(interceptor_registry)
            .build();

        // Create ICE servers from config
        let ice_servers: Vec<RTCIceServer> = config.webrtc.ice_servers
            .iter()
            .map(|server| RTCIceServer {
                urls: server.urls.clone(),
                username: server.username.clone().unwrap_or_default(),
                credential: server.credential.clone().unwrap_or_default(),
                credential_type: webrtc::ice_transport::ice_credential_type::RTCIceCredentialType::Password,
            })
            .collect();

        // Create peer connection configuration
        let rtc_config = RTCConfiguration {
            ice_servers,
            ..Default::default()
        };

        // Create peer connection
        let peer_connection = Arc::new(api.new_peer_connection(rtc_config).await?);

        // Create video track
        let video_track = Arc::new(TrackLocalStaticRTP::new(
            RTCRtpCodecCapability {
                mime_type: MIME_TYPE_H264.to_owned(),
                clock_rate: 90000,
                channels: 0,
                sdp_fmtp_line: "level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f".to_owned(),
                rtcp_feedback: vec![],
            },
            "video".to_owned(),
            "gameshare-video".to_owned(),
        ));

        // Add video track to peer connection
        peer_connection.add_track(video_track.clone()).await?;

        // Create audio track if enabled
        let audio_track = if config.capture.capture_audio {
            let track = Arc::new(TrackLocalStaticRTP::new(
                RTCRtpCodecCapability {
                    mime_type: MIME_TYPE_OPUS.to_owned(),
                    clock_rate: 48000,
                    channels: 2,
                    sdp_fmtp_line: "minptime=10;useinbandfec=1".to_owned(),
                    rtcp_feedback: vec![],
                },
                "audio".to_owned(),
                "gameshare-audio".to_owned(),
            ));
            
            peer_connection.add_track(track.clone()).await?;
            Some(track)
        } else {
            None
        };

        // Create data channel for input
        let data_channel = peer_connection.create_data_channel(
            "input",
            Some(webrtc::data_channel::data_channel_init::RTCDataChannelInit {
                ordered: Some(config.webrtc.data_channel_ordered),
                ..Default::default()
            }),
        ).await?;

        let input_handler = Arc::new(RwLock::new(input_handler));
        let (frame_sender, mut frame_receiver) = mpsc::channel(100);

        // Setup data channel event handlers
        let input_handler_clone = input_handler.clone();
        data_channel.on_open(Box::new(move || {
            info!("Data channel opened for input");
            Box::pin(async {})
        }));

        let input_handler_clone = input_handler.clone();
        data_channel.on_message(Box::new(move |msg: DataChannelMessage| {
            let input_handler = input_handler_clone.clone();
            Box::pin(async move {
                if let Err(e) = handle_input_message(msg, input_handler).await {
                    error!("Error handling input message: {}", e);
                }
            })
        }));

        // Setup connection state change handler
        let pc_clone = peer_connection.clone();
        peer_connection.on_peer_connection_state_change(Box::new(move |state: RTCPeerConnectionState| {
            let pc = pc_clone.clone();
            Box::pin(async move {
                info!("Peer connection state changed: {:?}", state);
                
                match state {
                    RTCPeerConnectionState::Connected => {
                        info!("WebRTC peer connected successfully");
                    }
                    RTCPeerConnectionState::Disconnected | RTCPeerConnectionState::Failed => {
                        warn!("Peer connection lost");
                    }
                    RTCPeerConnectionState::Closed => {
                        info!("Peer connection closed");
                    }
                    _ => {}
                }
            })
        }));

        // Spawn frame sending task
        let video_track_clone = video_track.clone();
        tokio::spawn(async move {
            let mut pts = 0u64;
            while let Some(frame) = frame_receiver.recv().await {
                if let Err(e) = send_video_frame(&video_track_clone, frame, pts).await {
                    error!("Error sending video frame: {}", e);
                }
                pts += 1;
            }
        });

        let streamer = Self {
            config,
            peer_connection,
            video_track,
            audio_track,
            data_channel,
            input_handler,
            frame_sender,
        };

        info!("WebRTC streamer initialized successfully");
        Ok(streamer)
    }

    pub async fn send_frame(&self, frame: EncodedFrame) -> Result<()> {
        self.frame_sender.send(frame).await
            .map_err(|e| GameShareError::webrtc(format!("Failed to send frame: {}", e)))?;
        Ok(())
    }

    pub async fn create_offer(&self) -> Result<String> {
        let offer = self.peer_connection.create_offer(None).await?;
        self.peer_connection.set_local_description(offer.clone()).await?;
        Ok(offer.sdp)
    }

    pub async fn create_answer(&self, offer_sdp: &str) -> Result<String> {
        let offer = webrtc::peer_connection::sdp::session_description::RTCSessionDescription {
            sdp_type: webrtc::peer_connection::sdp::sdp_type::RTCSdpType::Offer,
            sdp: offer_sdp.to_string(),
        };

        self.peer_connection.set_remote_description(offer).await?;
        let answer = self.peer_connection.create_answer(None).await?;
        self.peer_connection.set_local_description(answer.clone()).await?;
        
        Ok(answer.sdp)
    }

    pub async fn set_remote_description(&self, sdp: &str, sdp_type: &str) -> Result<()> {
        let session_desc = webrtc::peer_connection::sdp::session_description::RTCSessionDescription {
            sdp_type: match sdp_type {
                "offer" => webrtc::peer_connection::sdp::sdp_type::RTCSdpType::Offer,
                "answer" => webrtc::peer_connection::sdp::sdp_type::RTCSdpType::Answer,
                _ => return Err(GameShareError::webrtc("Invalid SDP type").into()),
            },
            sdp: sdp.to_string(),
        };

        self.peer_connection.set_remote_description(session_desc).await?;
        Ok(())
    }

    pub async fn add_ice_candidate(&self, candidate: &str, sdp_mid: Option<&str>, sdp_mline_index: Option<u16>) -> Result<()> {
        let ice_candidate = webrtc::ice_transport::ice_candidate::RTCIceCandidateInit {
            candidate: candidate.to_string(),
            sdp_mid: sdp_mid.map(|s| s.to_string()),
            sdp_mline_index,
            username_fragment: None,
        };

        self.peer_connection.add_ice_candidate(ice_candidate).await?;
        Ok(())
    }

    pub fn get_connection_state(&self) -> RTCPeerConnectionState {
        self.peer_connection.connection_state()
    }
}

async fn handle_input_message(
    msg: DataChannelMessage,
    input_handler: Arc<RwLock<InputHandler>>,
) -> Result<()> {
    let data = String::from_utf8(msg.data.to_vec())
        .map_err(|e| GameShareError::input(format!("Invalid UTF-8 in input message: {}", e)))?;

    let input_event: GameInputEvent = serde_json::from_str(&data)
        .map_err(|e| GameShareError::input(format!("Failed to parse input event: {}", e)))?;

    debug!("Received input event: {:?}", input_event);

    let mut handler = input_handler.write().await;
    handler.handle_input_event(input_event).await?;

    Ok(())
}

async fn send_video_frame(
    track: &Arc<TrackLocalStaticRTP>,
    frame: EncodedFrame,
    pts: u64,
) -> Result<()> {
    // Calculate timestamp (90kHz clock for H.264)
    let timestamp = pts * 90000 / 30; // Assuming 30 FPS

    // Send the frame
    track.write_rtp(&webrtc::rtp::packet::Packet {
        header: webrtc::rtp::header::Header {
            version: 2,
            padding: false,
            extension: false,
            marker: frame.is_keyframe,
            payload_type: 96, // H.264 payload type
            sequence_number: (pts % 65536) as u16,
            timestamp: timestamp as u32,
            ssrc: 0, // Will be set by WebRTC
            csrc: vec![],
            extension_profile: 0,
            extensions: vec![],
        },
        payload: frame.data.into(),
    }).await?;

    Ok(())
}

impl Drop for WebRTCStreamer {
    fn drop(&mut self) {
        // Close peer connection
        tokio::spawn({
            let pc = self.peer_connection.clone();
            async move {
                let _ = pc.close().await;
            }
        });
    }
} 