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
    // receiver for messages coming *from* the host
    rx: tokio::sync::mpsc::UnboundedReceiver<SignalingMessage>,
}

impl RemoteSignalingClient {
    pub fn new(
        url: String,
        session_id: String,
        host_mgr: Arc<HostSessionManager>,
        rx: tokio::sync::mpsc::UnboundedReceiver<SignalingMessage>,
    ) -> Self {
        Self { url, session_id, host_mgr, rx }
    }

    pub async fn connect(mut self) -> anyhow::Result<()> {
        use futures_util::{StreamExt, SinkExt};
        let (ws, _) = tokio_tungstenite::connect_async(url::Url::parse(&self.url)?).await?;
        let (mut ws_sink, mut ws_stream) = ws.split();

        // 1) JOIN as host
        let join = serde_json::to_string(&RemoteSignalingMessage::Join {
            session_id: self.session_id.clone(),
            client_type: ClientType::Host,
        })?;
        ws_sink.send(tokio_tungstenite::tungstenite::Message::Text(join)).await?;

        // 2) writer task: forward every SignalingMessage the host sends
        let mut writer = ws_sink;
        let mut rx = self.rx;
        tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                if let Ok(remote) = RemoteSignalingClient::convert_local_to_remote(msg) {
                    if let Ok(text) = serde_json::to_string(&remote) {
                        if writer.send(tokio_tungstenite::tungstenite::Message::Text(text)).await.is_err() {
                            break;
                        }
                    }
                }
            }
        });

        // 3) reader loop: forward incoming messages to host_mgr
        while let Some(Ok(tokio_tungstenite::tungstenite::Message::Text(text))) = ws_stream.next().await {
            if let Ok(remote) = serde_json::from_str::<RemoteSignalingMessage>(&text) {
                if let Ok(local) = Self::convert_remote_to_local(remote) {
                    self.host_mgr.handle_signaling_message(local).await?;
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