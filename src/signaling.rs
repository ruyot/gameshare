use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};
use tracing::{debug, error, info, warn};
use warp::ws::{Message, WebSocket};
use warp::Filter;
use futures_util::{SinkExt, StreamExt};

use crate::error::GameShareError;
use crate::host_session::HostSessionManager;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum SignalingMessage {
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ClientType {
    #[serde(rename = "host")]
    Host,
    #[serde(rename = "client")]
    Client,
}

#[derive(Debug, Clone)]
pub struct SessionInfo {
    pub session_id: String,
    pub host_sender: Option<mpsc::UnboundedSender<SignalingMessage>>,
    pub client_senders: Vec<mpsc::UnboundedSender<SignalingMessage>>,
    pub created_at: std::time::Instant,
}

type Sessions = Arc<RwLock<HashMap<String, SessionInfo>>>;

pub async fn start_server(addr: SocketAddr, host_mgr: Arc<HostSessionManager>) -> Result<()> {
    let sessions: Sessions = Arc::new(RwLock::new(HashMap::new()));

    let signaling_route = warp::path("signaling")
        .and(warp::ws())
        .and(with_sessions(sessions.clone()))
        .and(warp::any().map(move || host_mgr.clone()))
        .and_then(handle_websocket);

    let health_route = warp::path("health")
        .map(|| warp::reply::with_status("OK".to_string(), warp::http::StatusCode::OK));

    let cors = warp::cors()
        .allow_any_origin()
        .allow_headers(vec!["content-type", "authorization"])
        .allow_methods(vec!["GET", "POST", "PUT", "DELETE"]);

    let routes = signaling_route
        .or(health_route)
        .with(cors)
        .with(warp::log("gameshare::signaling"));

    info!("Starting signaling server on {}", addr);

    warp::serve(routes)
        .run(addr)
        .await;

    Ok(())
}

fn with_sessions(sessions: Sessions) -> impl Filter<Extract = (Sessions,), Error = std::convert::Infallible> + Clone {
    warp::any().map(move || sessions.clone())
}

async fn handle_websocket(
    ws: warp::ws::Ws,
    sessions: Sessions,
    host_mgr: Arc<HostSessionManager>,
) -> Result<impl warp::Reply, warp::Rejection> {
    Ok(ws.on_upgrade(move |socket| handle_client(socket, sessions, host_mgr)))
}

async fn handle_client(ws: WebSocket, sessions: Sessions, host_mgr: Arc<HostSessionManager>) {
    let (ws_tx, mut ws_rx) = ws.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<SignalingMessage>();

    // Spawn task to handle outgoing messages
    let ws_tx = Arc::new(tokio::sync::Mutex::new(ws_tx));
    let ws_tx_clone = ws_tx.clone();
    tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if let Ok(json) = serde_json::to_string(&msg) {
                let mut ws_tx = ws_tx_clone.lock().await;
                if let Err(e) = ws_tx.send(Message::text(json)).await {
                    error!("Failed to send WebSocket message: {}", e);
                    break;
                }
            }
        }
    });

    let mut current_session_id: Option<String> = None;
    let mut client_type: Option<ClientType> = None;

    // Handle incoming messages
    use futures_util::StreamExt;
    while let Some(result) = ws_rx.next().await {
        match result {
            Ok(msg) => {
                if let Ok(text) = msg.to_str() {
                    match serde_json::from_str::<SignalingMessage>(text) {
                        Ok(signaling_msg) => {
                            if let Err(e) = handle_signaling_message(
                                signaling_msg,
                                &tx,
                                &sessions,
                                &mut current_session_id,
                                &mut client_type,
                                host_mgr.clone()
                            ).await {
                                error!("Error handling signaling message: {}", e);
                                let error_msg = SignalingMessage::Error {
                                    message: e.to_string(),
                                };
                                let _ = tx.send(error_msg);
                            }
                        }
                        Err(e) => {
                            warn!("Failed to parse signaling message: {}", e);
                            let error_msg = SignalingMessage::Error {
                                message: format!("Invalid message format: {}", e),
                            };
                            let _ = tx.send(error_msg);
                        }
                    }
                }
            }
            Err(e) => {
                warn!("WebSocket error: {}", e);
                break;
            }
        }
    }

    // Clean up on disconnect
    if let (Some(session_id), Some(client_type)) = (current_session_id, client_type) {
        cleanup_client(sessions.clone(), &session_id, &client_type).await;
    }
}

async fn handle_signaling_message(
    msg: SignalingMessage,
    tx: &mpsc::UnboundedSender<SignalingMessage>,
    sessions: &Sessions,
    current_session_id: &mut Option<String>,
    client_type: &mut Option<ClientType>,
    host_mgr: Arc<HostSessionManager>,
) -> Result<()> {
    match msg {
        SignalingMessage::Join { session_id, client_type: ct } => {
            info!("Client joining session: {} as {:?}", session_id, ct);
            
            *current_session_id = Some(session_id.clone());
            *client_type = Some(ct.clone());

            let mut sessions_lock = sessions.write().await;
            let session = sessions_lock.entry(session_id.clone())
                .or_insert_with(|| SessionInfo {
                    session_id: session_id.clone(),
                    host_sender: None,
                    client_senders: Vec::new(),
                    created_at: std::time::Instant::now(),
                });

            match ct {
                ClientType::Host => {
                    if session.host_sender.is_some() {
                        return Err(GameShareError::network("Session already has a host").into());
                    }
                    session.host_sender = Some(tx.clone());
                    info!("Host joined session: {}", session_id);
                }
                ClientType::Client => {
                    session.client_senders.push(tx.clone());
                    info!("Client joined session: {} (total clients: {})", session_id, session.client_senders.len());

                    #[cfg(target_os="linux")]
                    {
                        let streamer = host_mgr.get_or_create(&session_id).await?;
                        let pc       = streamer.peer_connection();

                        // forward host ICE before we create offer so we don't miss early candidates
                        {
                            let sig = tx.clone();
                            pc.on_ice_candidate(Box::new(move |cand| {
                                let sig = sig.clone();
                                Box::pin(async move {
                                    if let Some(c) = cand {
                                        if let Ok(json) = c.to_json() {
                                            let _ = sig.send(SignalingMessage::IceCandidate {
                                                candidate: json.candidate,
                                                sdp_mid: json.sdp_mid,
                                                sdp_mline_index: json.sdp_mline_index,
                                                session_id: session_id.clone(),
                                            });
                                        }
                                    }
                                })
                            }));
                        }

                        // now create and send offer
                        let offer_sdp = streamer.create_offer().await?;
                        let _ = tx.send(SignalingMessage::Offer { sdp: offer_sdp, session_id: session_id.clone() });
                    }
                }
            }
        }

        SignalingMessage::Offer { sdp, session_id } => {
            debug!("Received offer for session: {}", session_id);
            let sessions_lock = sessions.read().await;
            if let Some(session) = sessions_lock.get(&session_id) {
                // Send offer to all clients in the session
                for client_sender in &session.client_senders {
                    let offer_msg = SignalingMessage::Offer {
                        sdp: sdp.clone(),
                        session_id: session_id.clone(),
                    };
                    let _ = client_sender.send(offer_msg);
                }
            }
        }

        SignalingMessage::Answer { sdp, session_id } => {
            debug!("Received answer for session: {}", session_id);
            let sessions_lock = sessions.read().await;
            if let Some(session) = sessions_lock.get(&session_id) {
                #[cfg(target_os="linux")]
                {
                    if let Ok(streamer) = host_mgr.get_or_create(&session_id).await {
                        streamer.set_remote_description(&sdp, "answer").await?;
                    }
                }
                let answer_msg = SignalingMessage::Answer {
                    sdp,
                    session_id,
                };
                if let Some(ref host_sender) = session.host_sender {
                    let _ = host_sender.send(answer_msg);
                }
            }
        }

        SignalingMessage::IceCandidate { 
            candidate, 
            sdp_mid, 
            sdp_mline_index, 
            session_id 
        } => {
            debug!("Received ICE candidate for session: {}", session_id);
            let sessions_lock = sessions.read().await;
            if let Some(session) = sessions_lock.get(&session_id) {
                #[cfg(target_os="linux")]
                {
                    if let Ok(streamer) = host_mgr.get_or_create(&session_id).await {
                        streamer.add_ice_candidate(&candidate, sdp_mid.as_deref(), sdp_mline_index).await?;
                    }
                }
                let ice_msg = SignalingMessage::IceCandidate {
                    candidate,
                    sdp_mid,
                    sdp_mline_index,
                    session_id: session_id.clone(),
                };

                // Forward ICE candidate to all other participants
                if let Some(ref host_sender) = session.host_sender {
                    let _ = host_sender.send(ice_msg.clone());
                }
                
                for client_sender in &session.client_senders {
                    let _ = client_sender.send(ice_msg.clone());
                }
            }
        }

        SignalingMessage::Leave { session_id } => {
            info!("Client leaving session: {}", session_id);
            if let Some(ct) = client_type {
                cleanup_client(sessions.clone(), &session_id, ct).await;
            }
        }

        SignalingMessage::Error { message } => {
            warn!("Received error message: {}", message);
        }
    }

    Ok(())
}

async fn cleanup_client(
    sessions: Sessions,
    session_id: &str,
    client_type: &ClientType,
) {
    let mut sessions_lock = sessions.write().await;
    
    if let Some(session) = sessions_lock.get_mut(session_id) {
        match client_type {
            ClientType::Host => {
                session.host_sender = None;
                info!("Host left session: {}", session_id);
                
                // Notify all clients that host left
                let leave_msg = SignalingMessage::Leave {
                    session_id: session_id.to_string(),
                };
                
                for client_sender in &session.client_senders {
                    let _ = client_sender.send(leave_msg.clone());
                }
            }
            ClientType::Client => {
                // Remove this client from the session
                // Note: This is a simplified cleanup - in production you'd want to 
                // identify specific clients by connection ID
                session.client_senders.clear();
                info!("Client left session: {}", session_id);
            }
        }
        
        // Remove empty sessions
        if session.host_sender.is_none() && session.client_senders.is_empty() {
            sessions_lock.remove(session_id);
            info!("Removed empty session: {}", session_id);
        }
    }
} 