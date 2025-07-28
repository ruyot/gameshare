use crate::signaling::SignalingMessage;
use crate::webrtc_helper::{Message, Signaler};
use async_trait::async_trait;
use anyhow::Result;
use tokio::sync::mpsc;

/// Bridges our existing SignalingMessage (JSON via warp WebSocket) with
/// the generic webrtc_helper::Message/Signaler API.
pub struct WsSignaler {
    incoming: mpsc::UnboundedReceiver<Message>,
    outgoing: mpsc::UnboundedSender<Message>,
}

impl WsSignaler {
    pub fn new(
        incoming: mpsc::UnboundedReceiver<Message>,
        outgoing: mpsc::UnboundedSender<Message>,
    ) -> Self {
        Self { incoming, outgoing }
    }

    /// Convert old SignalingMessage -> new Message.
    pub fn to_new(msg: &SignalingMessage) -> Option<Message> {
        match msg {
            SignalingMessage::Offer { sdp, .. } => Some(Message::Offer { sdp: sdp.clone() }),
            SignalingMessage::Answer { sdp, .. } => Some(Message::Answer { sdp: sdp.clone() }),
            SignalingMessage::IceCandidate { candidate, sdp_mid, sdp_mline_index, .. } => {
                Some(Message::IceCandidate {
                    candidate: candidate.clone(),
                    sdp_mid: sdp_mid.clone(),
                    sdp_mline_index: *sdp_mline_index,
                })
            }
            SignalingMessage::Leave { .. } => Some(Message::Bye),
            _ => None,
        }
    }

    /// Convert new Message -> old SignalingMessage for transport.
    pub fn to_old(msg: &Message, session_id: &str) -> SignalingMessage {
        match msg {
            Message::Offer { sdp } => SignalingMessage::Offer { sdp: sdp.clone(), session_id: session_id.to_string() },
            Message::Answer { sdp } => SignalingMessage::Answer { sdp: sdp.clone(), session_id: session_id.to_string() },
            Message::IceCandidate { candidate, sdp_mid, sdp_mline_index } => SignalingMessage::IceCandidate {
                candidate: candidate.clone(),
                sdp_mid: sdp_mid.clone(),
                sdp_mline_index: *sdp_mline_index,
                session_id: session_id.to_string(),
            },
            Message::Bye => SignalingMessage::Leave { session_id: session_id.to_string() },
        }
    }
}

#[async_trait]
impl Signaler for WsSignaler {
    type Error = anyhow::Error;

    async fn recv(&self) -> Result<Message, Self::Error> {
        self.incoming.recv().await.ok_or_else(|| anyhow::anyhow!("signal channel closed"))
    }

    async fn send(&self, msg: Message) -> Result<(), Self::Error> {
        self.outgoing.send(msg)?;
        Ok(())
    }
} 