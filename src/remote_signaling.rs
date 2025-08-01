use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{error, info};
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use futures_util::{SinkExt, StreamExt};
use url::Url;
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
    tx: tokio::sync::mpsc::UnboundedSender<SignalingMessage>,
}

impl RemoteSignalingClient {
    pub fn new(url: String, session_id: String, host_mgr: Arc<HostSessionManager>) -> Self {
        let (tx, rx) = tokio::sync::mpsc::unbounded_channel::<SignalingMessage>();
        
        // Spawn a task to handle outgoing messages
        let url_clone = url.clone();
        let session_id_clone = session_id.clone();
        tokio::spawn(async move {
            if let Err(e) = Self::run_outgoing_messages(url_clone, session_id_clone, rx).await {
                error!("Outgoing message handler failed: {}", e);
            }
        });

        Self {
            url,
            session_id,
            host_mgr,
            tx,
        }
    }

    pub async fn connect(&self) -> Result<()> {
        let url = Url::parse(&self.url)?;
        info!("Connecting to remote signaling server: {}", self.url);

        let (ws_stream, _) = connect_async(url).await?;
        info!("Connected to remote signaling server");

        let (mut write, mut read) = ws_stream.split();

        // Send join message
        let join_msg = RemoteSignalingMessage::Join {
            session_id: self.session_id.clone(),
            client_type: ClientType::Host,
        };
        let join_json = serde_json::to_string(&join_msg)?;
        write.send(Message::Text(join_json)).await?;
        info!("Joined session: {}", self.session_id);

        // Handle incoming messages
        while let Some(msg) = read.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    if let Ok(remote_msg) = serde_json::from_str::<RemoteSignalingMessage>(&text) {
                        // Convert remote message to local format
                        let local_msg = self.convert_remote_to_local(remote_msg);
                        if let Ok(local_msg) = local_msg {
                            // Forward to host manager
                            if let Err(e) = self.host_mgr.handle_signaling_message(local_msg).await {
                                error!("Failed to handle signaling message: {}", e);
                            }
                        }
                    }
                }
                Ok(Message::Close(_)) => {
                    info!("Remote signaling server closed connection");
                    break;
                }
                Err(e) => {
                    error!("WebSocket error: {}", e);
                    break;
                }
                _ => {}
            }
        }

        Ok(())
    }

    async fn run_outgoing_messages(
        url: String,
        session_id: String,
        mut rx: tokio::sync::mpsc::UnboundedReceiver<SignalingMessage>,
    ) -> Result<()> {
        let url = Url::parse(&url)?;
        let (ws_stream, _) = connect_async(url).await?;
        let (mut write, _) = ws_stream.split();

        // Send join message
        let join_msg = RemoteSignalingMessage::Join {
            session_id: session_id.clone(),
            client_type: ClientType::Host,
        };
        let join_json = serde_json::to_string(&join_msg)?;
        write.send(Message::Text(join_json)).await?;

        // Handle outgoing messages
        while let Some(local_msg) = rx.recv().await {
            let remote_msg = Self::convert_local_to_remote(local_msg)?;
            let remote_json = serde_json::to_string(&remote_msg)?;
            write.send(Message::Text(remote_json)).await?;
        }

        Ok(())
    }

    fn convert_remote_to_local(&self, remote_msg: RemoteSignalingMessage) -> Result<SignalingMessage> {
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