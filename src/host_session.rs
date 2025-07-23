//! Manages per-session WebRTCStreamer instances on the host side.
//! Only built on Linux where capture/streaming is supported.

#[cfg(target_os = "linux")]
use {
    crate::{config::Config, input::InputHandler, streaming::WebRTCStreamer},
    anyhow::Result,
    std::{collections::HashMap, sync::Arc},
    tokio::sync::Mutex,
};

#[cfg(target_os = "linux")]
pub struct HostSessionManager {
    cfg: Arc<Config>,
    sessions: Mutex<HashMap<String, Arc<WebRTCStreamer>>>,
}

#[cfg(target_os = "linux")]
impl HostSessionManager {
    pub fn new(cfg: Arc<Config>) -> Self {
        Self { cfg, sessions: Mutex::new(HashMap::new()) }
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
} 