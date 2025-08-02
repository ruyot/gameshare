use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use crate::host_session::HostSessionManager;
use crate::signaling::{SignalingMessage, ClientType};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum RemoteSignalingMessage {
    #[serde(rename = "offer")]
    Offer {
        sdp: String,
        session_id: String,
    },
    #[serde(rename = "answer")]
    Answer {
        sdp: String,
        session_id: String,
    },
    #[serde(rename = "ice-candidate")]
    IceCandidate {
        candidate: String,
        sdp_mid: Option<String>,
        sdp_mline_index: Option<u16>,
        session_id: String,
    },
    #[serde(rename = "join")]
    Join {
        session_id: String,
        client_type: ClientType,
    },
    #[serde(rename = "leave")]
    Leave {
        session_id: String,
    },
    #[serde(rename = "error")]
    Error {
        message: String,
    },
}

pub struct RemoteSignalingClient {
    url: String,
    session_id: String,
    host_mgr: Arc<HostSessionManager>,
}

impl RemoteSignalingClient {
    pub fn new(
        url: String,
        session_id: String,
        host_mgr: Arc<HostSessionManager>,
    ) -> Self {
        Self { url, session_id, host_mgr }
    }

    pub async fn connect(self) -> anyhow::Result<()> {
        use futures_util::{StreamExt, SinkExt};
        use tokio_tungstenite::tungstenite::Message;
        use tracing::{info, error};

        info!("Connecting to remote signaling server: {}", self.url);
        
        let (ws, _) = tokio_tungstenite::connect_async(url::Url::parse(&self.url)?).await?;
        info!("Connected to remote signaling server");

        let (mut write, mut read) = ws.split();

        // Send join message
        let join_msg = RemoteSignalingMessage::Join {
            session_id: self.session_id.clone(),
            client_type: ClientType::Host,
        };
        let join_json = serde_json::to_string(&join_msg)?;
        write.send(Message::Text(join_json)).await?;
        info!("Joined session: {}", self.session_id);

        // Main loop: handle both incoming and outgoing messages
        loop {
            tokio::select! {
                // Handle incoming messages from WebSocket
                msg = read.next() => {
                    match msg {
                        Some(Ok(Message::Text(text))) => {
                            info!("Received message: {}", text);
                            if let Ok(remote_msg) = serde_json::from_str::<RemoteSignalingMessage>(&text) {
                                if let Ok(local_msg) = Self::convert_remote_to_local(remote_msg) {
                                    // Forward to host manager and get response
                                    match self.host_mgr.handle_signaling_message(local_msg).await {
                                        Ok(Some(response_msg)) => {
                                            // Convert response back to remote format and send
                                            if let Ok(remote_response) = Self::convert_local_to_remote(response_msg) {
                                                if let Ok(response_json) = serde_json::to_string(&remote_response) {
                                                    info!("Sending response: {}", response_json);
                                                    if let Err(e) = write.send(Message::Text(response_json)).await {
                                                        error!("Failed to send response: {}", e);
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                        Ok(None) => {
                                            // No response needed
                                        }
                                        Err(e) => {
                                            error!("Failed to handle signaling message: {}", e);
                                        }
                                    }
                                }
                            }
                        }
                        Some(Ok(Message::Close(_))) => {
                            info!("WebSocket connection closed");
                            break;
                        }
                        Some(Err(e)) => {
                            error!("WebSocket error: {}", e);
                            break;
                        }
                        None => {
                            info!("WebSocket stream ended");
                            break;
                        }
                        _ => {}
                    }
                }
            }
        }

        Ok(())
    }

    fn convert_remote_to_local(remote_msg: RemoteSignalingMessage) -> Result<SignalingMessage> {
        match remote_msg {
            RemoteSignalingMessage::Offer { sdp, session_id } => {
                Ok(SignalingMessage::Offer { sdp, session_id })
            }
            RemoteSignalingMessage::Answer { sdp, session_id } => {
                Ok(SignalingMessage::Answer { sdp, session_id })
            }
            RemoteSignalingMessage::IceCandidate { candidate, sdp_mid, sdp_mline_index, session_id } => {
                Ok(SignalingMessage::IceCandidate { 
                    candidate, 
                    sdp_mid, 
                    sdp_mline_index, 
                    session_id 
                })
            }
            RemoteSignalingMessage::Join { session_id, client_type } => {
                Ok(SignalingMessage::Join { session_id, client_type })
            }
            RemoteSignalingMessage::Leave { session_id } => {
                Ok(SignalingMessage::Leave { session_id })
            }
            RemoteSignalingMessage::Error { message } => {
                Ok(SignalingMessage::Error { message })
            }
        }
    }

    fn convert_local_to_remote(local_msg: SignalingMessage) -> Result<RemoteSignalingMessage> {
        match local_msg {
            SignalingMessage::Offer { sdp, session_id } => {
                Ok(RemoteSignalingMessage::Offer { sdp, session_id })
            }
            SignalingMessage::Answer { sdp, session_id } => {
                Ok(RemoteSignalingMessage::Answer { sdp, session_id })
            }
            SignalingMessage::IceCandidate { candidate, sdp_mid, sdp_mline_index, session_id } => {
                Ok(RemoteSignalingMessage::IceCandidate { 
                    candidate, 
                    sdp_mid, 
                    sdp_mline_index, 
                    session_id 
                })
            }
            SignalingMessage::Join { session_id, client_type } => {
                Ok(RemoteSignalingMessage::Join { session_id, client_type })
            }
            SignalingMessage::Leave { session_id } => {
                Ok(RemoteSignalingMessage::Leave { session_id })
            }
            SignalingMessage::Error { message } => {
                Ok(RemoteSignalingMessage::Error { message })
            }
        }
    }
} 