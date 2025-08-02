//! Manages per-session WebRTCStreamer instances on the host side.
//! Only built on Linux where capture/streaming is supported.

#[cfg(target_os = "linux")]
use {
    crate::{config::Config, input::InputHandler, streaming::WebRTCStreamer},
    anyhow::Result,
    std::{collections::HashMap, sync::Arc},
    tokio::sync::Mutex,
    tracing::{info, error},
};

#[cfg(target_os = "linux")]
pub struct HostSessionManager {
    cfg: Arc<Config>,
    sessions: Mutex<HashMap<String, Arc<WebRTCStreamer>>>,
    response_tx: Option<tokio::sync::mpsc::UnboundedSender<crate::signaling::SignalingMessage>>,
}

#[cfg(target_os = "linux")]
impl HostSessionManager {
    pub fn new(cfg: Arc<Config>) -> Self {
        Self { 
            cfg, 
            sessions: Mutex::new(HashMap::new()),
            response_tx: None,
        }
    }

    pub fn with_response_sender(mut self, response_tx: tokio::sync::mpsc::UnboundedSender<crate::signaling::SignalingMessage>) -> Self {
        self.response_tx = Some(response_tx);
        self
    }

    /// Return the existing streamer for `session_id`, or lazily create one.
    pub async fn get_or_create(&self, session_id: &str) -> Result<Arc<WebRTCStreamer>> {
        let mut guard = self.sessions.lock().await;
        if let Some(s) = guard.get(session_id) {
            return Ok(s.clone());
        }

        let input = InputHandler::new(&self.cfg).await?;
        let streamer = Arc::new(WebRTCStreamer::new(&self.cfg, input).await?);
        guard.insert(session_id.to_owned(), streamer.clone());
        Ok(streamer)
    }

    /// Handle signaling messages from remote clients
    pub async fn handle_signaling_message(self: &Arc<Self>, msg: crate::signaling::SignalingMessage) -> Result<()> {
        match msg {
            crate::signaling::SignalingMessage::Offer { sdp, session_id } => {
                info!("Received offer for session: {}", session_id);
                let streamer = self.get_or_create(&session_id).await?;
                streamer.set_remote_description(&sdp, "offer").await?;
                
                // Create and send answer
                let answer_sdp = streamer.create_answer(&sdp).await?;
                // Note: In remote mode, we would need to send this back through the remote signaling client
                // For now, we'll just log it
                info!("Created answer SDP for session: {}", session_id);
            }
            crate::signaling::SignalingMessage::Answer { sdp, session_id } => {
                info!("Received answer for session: {}", session_id);
                let streamer = self.get_or_create(&session_id).await?;
                streamer.set_remote_description(&sdp, "answer").await?;
            }
            crate::signaling::SignalingMessage::IceCandidate { candidate, sdp_mid, sdp_mline_index, session_id } => {
                info!("Received ICE candidate for session: {}", session_id);
                let streamer = self.get_or_create(&session_id).await?;
                streamer.add_ice_candidate(&candidate, sdp_mid.as_deref(), sdp_mline_index).await?;
            }
            crate::signaling::SignalingMessage::Join { session_id, client_type } => {
                info!("Client joined session: {} as {:?}", session_id, client_type);
                // Create streamer for the session
                let streamer = self.get_or_create(&session_id).await?;
                
                // If this is a client joining, automatically create and send an offer
                if matches!(client_type, crate::signaling::ClientType::Client) {
                    info!("Client joined, creating offer for session: {}", session_id);
                    
                    // Create offer
                    let offer_sdp = streamer.create_offer().await?;
                    info!("Created offer SDP for session: {}", session_id);
                    
                    // Send offer back through the remote signaling client
                    if let Some(ref response_tx) = self.response_tx {
                        let offer_msg = crate::signaling::SignalingMessage::Offer {
                            sdp: offer_sdp,
                            session_id: session_id.clone(),
                        };
                        if let Err(e) = response_tx.send(offer_msg) {
                            error!("Failed to send offer: {}", e);
                        } else {
                            info!("Sent offer to remote signaling server");
                        }
                    } else {
                        info!("No response sender available, offer SDP: {}", offer_sdp);
                    }
                }
            }
            crate::signaling::SignalingMessage::Leave { session_id } => {
                info!("Client left session: {}", session_id);
                // Could clean up the session here if needed
            }
            crate::signaling::SignalingMessage::Error { message } => {
                error!("Signaling error: {}", message);
            }
        }
        Ok(())
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stub implementation for non-Linux targets so the codebase still compiles.
#[cfg(not(target_os = "linux"))]
use {crate::config::Config, std::sync::Arc};

#[cfg(not(target_os = "linux"))]
pub struct HostSessionManager;

#[cfg(not(target_os = "linux"))]
impl HostSessionManager {
    pub fn new(_cfg: Arc<Config>) -> Self { HostSessionManager }
    
    pub fn with_response_sender(self, _response_tx: tokio::sync::mpsc::UnboundedSender<crate::signaling::SignalingMessage>) -> Self {
        self
    }
    
    /// Handle signaling messages from remote clients (stub for non-Linux)
    pub async fn handle_signaling_message(self: &Arc<Self>, _msg: crate::signaling::SignalingMessage) -> anyhow::Result<()> {
        // Stub implementation for non-Linux platforms
        Ok(())
    }
} 