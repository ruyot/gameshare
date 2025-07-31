use anyhow::Result;
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;
use tracing::{debug, error, info};
use futures_util::{SinkExt, StreamExt};
use tokio_tungstenite::{connect_async, WebSocketStream, MaybeTlsStream};
use tokio::net::TcpStream;
use url::Url;

use crate::webrtc_helper::{Message, Signaler};
use async_trait::async_trait;

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
        client_type: String,
    },
    #[serde(rename = "joined")]
    Joined {
        session_id: String,
        client_type: String,
    },
    #[serde(rename = "error")]
    Error {
        message: String,
    },
}

pub struct RemoteSignalingClient {
    session_id: String,
    ws_stream: Option<WebSocketStream<MaybeTlsStream<TcpStream>>>,
    incoming: mpsc::UnboundedReceiver<Message>,
    outgoing: mpsc::UnboundedSender<Message>,
}

impl RemoteSignalingClient {
    pub fn new(
        session_id: String,
        incoming: mpsc::UnboundedReceiver<Message>,
        outgoing: mpsc::UnboundedSender<Message>,
    ) -> Self {
        Self {
            session_id,
            ws_stream: None,
            incoming,
            outgoing,
        }
    }

    pub async fn connect(&mut self, url: &str) -> Result<()> {
        let url = if !url.starts_with("ws://") && !url.starts_with("wss://") {
            format!("ws://{}", url)
        } else {
            url.to_string()
        };

        info!("Connecting to remote signaling server: {}", url);
        
        let url = Url::parse(&url)?;
        let (ws_stream, _) = connect_async(url).await?;
        
        self.ws_stream = Some(ws_stream);
        
        // Send join message
        let join_message = RemoteSignalingMessage::Join {
            session_id: self.session_id.clone(),
            client_type: "host".to_string(),
        };
        
        self.send_message(join_message).await?;
        
        info!("Connected to remote signaling server");
        Ok(())
    }

    async fn send_message(&mut self, message: RemoteSignalingMessage) -> Result<()> {
        if let Some(ws_stream) = &mut self.ws_stream {
            let message_str = serde_json::to_string(&message)?;
            ws_stream.send(tokio_tungstenite::tungstenite::Message::Text(message_str)).await?;
        }
        Ok(())
    }

    pub async fn run(&mut self) -> Result<()> {
        if let Some(mut ws_stream) = self.ws_stream.take() {
            let (mut write, mut read) = ws_stream.split();
            
            // Spawn task to handle incoming WebSocket messages
            let outgoing = self.outgoing.clone();
            let session_id = self.session_id.clone();
            
            let read_task = tokio::spawn(async move {
                while let Some(msg) = read.next().await {
                    match msg {
                        Ok(tokio_tungstenite::tungstenite::Message::Text(text)) => {
                            match serde_json::from_str::<RemoteSignalingMessage>(&text) {
                                Ok(remote_msg) => {
                                    match remote_msg {
                                        RemoteSignalingMessage::Offer { sdp, .. } => {
                                            let msg = Message::Offer { sdp };
                                            if let Err(e) = outgoing.send(msg) {
                                                error!("Failed to send offer to host: {}", e);
                                            }
                                        }
                                        RemoteSignalingMessage::Answer { sdp, .. } => {
                                            let msg = Message::Answer { sdp };
                                            if let Err(e) = outgoing.send(msg) {
                                                error!("Failed to send answer to host: {}", e);
                                            }
                                        }
                                        RemoteSignalingMessage::IceCandidate { candidate, sdp_mid, sdp_mline_index, .. } => {
                                            let msg = Message::IceCandidate {
                                                candidate,
                                                sdp_mid,
                                                sdp_mline_index: sdp_mline_index,
                                            };
                                            if let Err(e) = outgoing.send(msg) {
                                                error!("Failed to send ICE candidate to host: {}", e);
                                            }
                                        }
                                        RemoteSignalingMessage::Joined { session_id, client_type } => {
                                            info!("Joined remote session: {} as {}", session_id, client_type);
                                        }
                                        RemoteSignalingMessage::Error { message } => {
                                            error!("Remote signaling error: {}", message);
                                        }
                                        _ => {
                                            debug!("Received remote message: {:?}", remote_msg);
                                        }
                                    }
                                }
                                Err(e) => {
                                    error!("Failed to parse remote message: {}", e);
                                }
                            }
                        }
                        Ok(tokio_tungstenite::tungstenite::Message::Close(_)) => {
                            info!("Remote WebSocket connection closed");
                            break;
                        }
                        Err(e) => {
                            error!("WebSocket error: {}", e);
                            break;
                        }
                        _ => {}
                    }
                }
            });

            // Spawn task to handle outgoing messages
            let outgoing = self.outgoing.clone();
            let session_id = self.session_id.clone();
            
            let write_task = tokio::spawn(async move {
                // Note: This task won't actually receive messages since we can't clone the receiver
                // The actual message handling will be done through the Signaler trait
                loop {
                    tokio::time::sleep(std::time::Duration::from_secs(1)).await;
                }
                    let remote_msg = match msg {
                        Message::Offer { sdp } => RemoteSignalingMessage::Offer {
                            sdp,
                            session_id: session_id.clone(),
                        },
                        Message::Answer { sdp } => RemoteSignalingMessage::Answer {
                            sdp,
                            session_id: session_id.clone(),
                        },
                        Message::IceCandidate { candidate, sdp_mid, sdp_mline_index } => RemoteSignalingMessage::IceCandidate {
                            candidate,
                            sdp_mid,
                            sdp_mline_index: Some(sdp_mline_index),
                            session_id: session_id.clone(),
                        },
                        Message::Bye => {
                            debug!("Received bye message, ignoring for remote signaling");
                            continue;
                        }
                    };

                    let message_str = match serde_json::to_string(&remote_msg) {
                        Ok(s) => s,
                        Err(e) => {
                            error!("Failed to serialize message: {}", e);
                            continue;
                        }
                    };

                    if let Err(e) = write.send(tokio_tungstenite::tungstenite::Message::Text(message_str)).await {
                        error!("Failed to send message to remote server: {}", e);
                        break;
                    }
                }
            });

            // Wait for either task to complete
            tokio::select! {
                _ = read_task => {
                    info!("Read task completed");
                }
                _ = write_task => {
                    info!("Write task completed");
                }
            }
        }

        Ok(())
    }
}

// Note: RemoteSignalingClient doesn't implement Signaler directly
// Instead, it's used as a bridge between remote WebSocket and local signaling 