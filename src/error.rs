use thiserror::Error;

#[derive(Error, Debug)]
pub enum GameShareError {
    #[error("Capture error: {0}")]
    Capture(String),

    #[error("Encoding error: {0}")]
    Encoding(String),

    #[error("WebRTC error: {0}")]
    WebRTC(String),

    #[error("Input error: {0}")]
    Input(String),

    #[error("Configuration error: {0}")]
    Configuration(String),

    #[error("System error: {0}")]
    System(String),

    #[error("Network error: {0}")]
    Network(String),

    #[error("Performance error: {0}")]
    Performance(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("WebRTC internal error: {0}")]
    WebRTCInternal(#[from] webrtc::Error),
}

pub type Result<T> = std::result::Result<T, GameShareError>;

impl GameShareError {
    pub fn capture(msg: impl Into<String>) -> Self {
        Self::Capture(msg.into())
    }

    pub fn encoding(msg: impl Into<String>) -> Self {
        Self::Encoding(msg.into())
    }

    pub fn webrtc(msg: impl Into<String>) -> Self {
        Self::WebRTC(msg.into())
    }

    pub fn input(msg: impl Into<String>) -> Self {
        Self::Input(msg.into())
    }

    pub fn configuration(msg: impl Into<String>) -> Self {
        Self::Configuration(msg.into())
    }

    pub fn system(msg: impl Into<String>) -> Self {
        Self::System(msg.into())
    }

    pub fn network(msg: impl Into<String>) -> Self {
        Self::Network(msg.into())
    }

    pub fn performance(msg: impl Into<String>) -> Self {
        Self::Performance(msg.into())
    }
} 