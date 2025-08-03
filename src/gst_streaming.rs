use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, error, info};
use webrtc::api::interceptor_registry::register_default_interceptors;
use webrtc::api::media_engine::{MediaEngine, MIME_TYPE_H264};
use webrtc::api::APIBuilder;
use webrtc::data_channel::RTCDataChannel;
use webrtc::ice_transport::ice_server::RTCIceServer;
use webrtc::peer_connection::configuration::RTCConfiguration;
use webrtc::peer_connection::RTCPeerConnection;
use webrtc::rtp_transceiver::rtp_codec::{RTCRtpCodecCapability, RTPCodecType};
use webrtc::track::track_local::track_local_static_sample::TrackLocalStaticSample;
use webrtc::media::Sample;
use bytes::Bytes;
use std::time::Duration;

use crate::config::Config;
use crate::encoding::EncodedFrame;
use crate::error::GameShareError;
use crate::input::InputHandler;

/// Simplified WebRTC streamer that expects pre-encoded H.264 NAL units
pub struct GstWebRTCStreamer {
    config: Arc<Config>,
    peer_connection: Arc<RTCPeerConnection>,
    video_track: Arc<TrackLocalStaticSample>,
    data_channel: Arc<RTCDataChannel>,
    input_handler: Arc<RwLock<InputHandler>>,
}

impl GstWebRTCStreamer {
    pub async fn new(config: &Config, input_handler: InputHandler) -> Result<Self> {
        let config = Arc::new(config.clone());
        
        // Create media engine with H.264 support
        let mut media_engine = MediaEngine::default();
        
        // Register H.264 codec
        media_engine.register_codec(
            RTCRtpCodecCapability {
                mime_type: MIME_TYPE_H264.to_owned(),
                clock_rate: 90000,
                channels: 0,
                sdp_fmtp_line: "level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f".to_owned(),
                rtcp_feedback: vec![],
            },
            RTPCodecType::Video,
        )?;

        // Create API
        let interceptor_registry = webrtc::interceptor::registry::Registry::new();
        let interceptor_registry = register_default_interceptors(interceptor_registry, &mut media_engine)?;

        let api = APIBuilder::new()
            .with_media_engine(media_engine)
            .with_interceptor_registry(interceptor_registry)
            .build();

        // Create ICE servers
        let ice_servers: Vec<RTCIceServer> = config.webrtc.ice_servers
            .iter()
            .map(|server| RTCIceServer {
                urls: server.urls.clone(),
                username: server.username.clone().unwrap_or_default(),
                credential: server.credential.clone().unwrap_or_default(),
                credential_type: webrtc::ice_transport::ice_credential_type::RTCIceCredentialType::Password,
            })
            .collect();

        // Create peer connection
        let rtc_config = RTCConfiguration {
            ice_servers,
            ..Default::default()
        };

        let peer_connection = Arc::new(api.new_peer_connection(rtc_config).await?);

        // Create video track
        let video_track = Arc::new(TrackLocalStaticSample::new(
            RTCRtpCodecCapability {
                mime_type: MIME_TYPE_H264.to_owned(),
                clock_rate: 90000,
                channels: 0,
                sdp_fmtp_line: "level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f".to_owned(),
                rtcp_feedback: vec![],
            },
            "video".to_owned(),
            "gameshare-video".to_owned(),
        ));

        // Add video track
        let _rtp_sender = peer_connection.add_track(video_track.clone()).await?;
        info!("Added H.264 video track to peer connection");

        // Create data channel
        let data_channel = peer_connection.create_data_channel(
            "input",
            Some(webrtc::data_channel::data_channel_init::RTCDataChannelInit {
                ordered: Some(config.webrtc.data_channel_ordered),
                ..Default::default()
            }),
        ).await?;

        let input_handler = Arc::new(RwLock::new(input_handler));

        // Setup data channel handlers
        data_channel.on_open(Box::new(move || {
            info!("Data channel opened for input");
            Box::pin(async {})
        }));

        let input_handler_clone = input_handler.clone();
        data_channel.on_message(Box::new(move |msg| {
            let input_handler = input_handler_clone.clone();
            Box::pin(async move {
                // Handle input messages
                debug!("Received data channel message");
            })
        }));

        Ok(Self {
            config,
            peer_connection,
            video_track,
            data_channel,
            input_handler,
        })
    }

    /// Send a properly formatted H.264 NAL unit
    pub async fn send_nal_unit(&self, nal_data: Vec<u8>, is_keyframe: bool, pts: Duration) -> Result<()> {
        // Ensure we have proper NAL unit data
        if nal_data.len() < 4 {
            return Err(anyhow::anyhow!("NAL unit too small"));
        }

        // Check NAL unit type
        let nal_type = if nal_data[2] == 0 && nal_data[3] == 1 {
            nal_data[4] & 0x1F
        } else if nal_data[1] == 0 && nal_data[2] == 1 {
            nal_data[3] & 0x1F
        } else {
            return Err(anyhow::anyhow!("Invalid NAL unit header"));
        };

        // Log important NAL units
        match nal_type {
            5 => debug!("Sending IDR frame (keyframe) NAL unit, size: {}", nal_data.len()),
            7 => debug!("Sending SPS NAL unit, size: {}", nal_data.len()),
            8 => debug!("Sending PPS NAL unit, size: {}", nal_data.len()),
            1 => { /* Non-IDR frame, too verbose to log all */ },
            _ => debug!("Sending NAL unit type: {}, size: {}", nal_type, nal_data.len()),
        }

        let sample = Sample {
            data: Bytes::from(nal_data),
            duration: Duration::from_millis(33), // 30fps
            ..Default::default()
        };

        if let Err(e) = self.video_track.write_sample(&sample).await {
            error!("Error sending NAL unit: {}", e);
            return Err(e.into());
        }

        Ok(())
    }

    /// Send an encoded frame (may contain multiple NAL units)
    pub async fn send_frame(&self, frame: EncodedFrame) -> Result<()> {
        // If the frame contains multiple NAL units, we should split them
        // For now, assume frame.data is a single NAL unit
        self.send_nal_unit(frame.data, frame.is_keyframe, Duration::from_millis(frame.pts as u64)).await
    }

    pub async fn create_offer(&self) -> Result<String> {
        let offer = self.peer_connection.create_offer(None).await?;
        self.peer_connection.set_local_description(offer.clone()).await?;
        Ok(offer.sdp)
    }

    pub async fn set_remote_description(&self, sdp: &str, sdp_type: &str) -> Result<()> {
        let mut session_desc = webrtc::peer_connection::sdp::session_description::RTCSessionDescription::default();
        session_desc.sdp = sdp.to_string();
        session_desc.sdp_type = match sdp_type {
            "offer" => webrtc::peer_connection::sdp::sdp_type::RTCSdpType::Offer,
            "answer" => webrtc::peer_connection::sdp::sdp_type::RTCSdpType::Answer,
            _ => return Err(GameShareError::webrtc("Invalid SDP type").into()),
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

    pub fn peer_connection(&self) -> Arc<RTCPeerConnection> {
        self.peer_connection.clone()
    }
}