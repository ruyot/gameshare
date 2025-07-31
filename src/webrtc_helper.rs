//! Minimal abstractions adapted from https://github.com/JRF63/webrtc-helper (MIT)
//! so we can reuse them in the host-agent without pulling the full crate.

use serde::{Deserialize, Serialize};
use async_trait::async_trait;
use std::sync::Arc;
use webrtc::{
    peer_connection::sdp::session_description::RTCSessionDescription,
    rtp_transceiver::rtp_codec::RTCRtpCodecCapability,
    track::track_local::track_local_static_rtp::TrackLocalStaticRTP,
    track::track_remote::TrackRemote,
    rtp_transceiver::RTCRtpTransceiver,
    rtp_receiver::RTCRtpReceiver,
    ice_transport::ice_connection_state::IceConnectionState,
};

// -----------------------------------------------------------------------------
// 1. Signaling primitives
// -----------------------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Message {
    Offer { sdp: String },
    Answer { sdp: String },
    IceCandidate {
        candidate: String,
        sdp_mid: Option<String>,
        sdp_mline_index: Option<u16>,
    },
    Bye,
}

#[async_trait]
pub trait Signaler: Send + Sync {
    type Error: std::fmt::Display + Send + Sync + 'static;

    async fn recv(&self) -> Result<Message, Self::Error>;
    async fn send(&self, msg: Message) -> Result<(), Self::Error>;
}

// -----------------------------------------------------------------------------
// 2. Encoder/Decoder plug-in traits
// -----------------------------------------------------------------------------

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Codec {
    H264,
    Opus,
    // Extend as necessary
}

pub trait DecoderBuilder: Send {
    fn supported_codecs(&self) -> &[Codec];

    fn build(
        self: Box<Self>,
        track: Arc<TrackRemote>,
        rtp_receiver: Arc<RTCRtpReceiver>,
    );
}

pub trait EncoderBuilder: Send {
    fn supported_codecs(&self) -> &[Codec];

    fn build(
        self: Box<Self>,
        rtp_track: Arc<TrackLocalStaticRTP>,
        transceiver: Arc<RTCRtpTransceiver>,
        ice_state: IceConnectionState,
        bw_estimate: TwccBandwidthEstimate,
        codec_cap: RTCRtpCodecCapability,
        ssrc: u32,
        payload_type: u8,
    );
}

// -----------------------------------------------------------------------------
// 3. TWCC bandwidth estimate (extracted)
// -----------------------------------------------------------------------------
#[derive(Debug, Clone, Copy, Default)]
pub struct TwccBandwidthEstimate {
    pub bitrate: u64, // bps
    pub loss: f32,    // 0.0-1.0
}

// -----------------------------------------------------------------------------
// 4. Negotiator skeleton (perfect negotiation helper)
// -----------------------------------------------------------------------------

pub struct Negotiator<S: Signaler> {
    polite: bool,
    making_offer: bool,
    pc: webrtc::peer_connection::RTCPeerConnection,
    signaler: Arc<S>,
}

impl<S: Signaler> Negotiator<S> {
    pub fn new(pc: webrtc::peer_connection::RTCPeerConnection, signaler: Arc<S>, polite: bool) -> Self {
        Self { pc, signaler, making_offer: false, polite }
    }

    pub async fn handle_remote_message(&mut self, msg: Message) -> anyhow::Result<()> {
        match msg {
            Message::Offer { sdp } => {
                self.on_offer(sdp).await?;
            }
            Message::Answer { sdp } => {
                self.on_answer(sdp).await?;
            }
            Message::IceCandidate { candidate, sdp_mid, sdp_mline_index } => {
                self.pc
                    .add_ice_candidate(webrtc::ice_transport::ice_candidate::RTCIceCandidateInit {
                        candidate,
                        sdp_mid,
                        sdp_mline_index,
                        username_fragment: None,
                    })
                    .await?;
            }
            Message::Bye => {
                self.pc.close().await?;
            }
        }
        Ok(())
    }

    async fn on_offer(&mut self, sdp: String) -> anyhow::Result<()> where S::Error: std::error::Error {
        let offer = RTCSessionDescription::offer(sdp);
        let collision = !self.polite && (self.making_offer || self.pc.signaling_state() != webrtc::peer_connection::signaling_state::RTCSignalingState::Stable);
        if collision {
            // Discard offer politely
            return Ok(());
        }
        self.pc.set_remote_description(offer?).await?;
        let answer = self.pc.create_answer(None).await?;
        self.pc.set_local_description(answer.clone()).await?;
        self.signaler.send(Message::Answer { sdp: answer.sdp }).await?;
        Ok(())
    }

    async fn on_answer(&mut self, sdp: String) -> anyhow::Result<()> {
        let ans = RTCSessionDescription::answer(sdp);
        self.pc.set_remote_description(ans?).await?;
        Ok(())
    }
} 