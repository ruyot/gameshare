use anyhow::Result;
use serde::{Deserialize, Serialize};
use crate::Args;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub signaling_addr: String,
    pub target_framerate: u32,
    pub target_bitrate: u32,
    pub resolution: Resolution,
    pub use_nvenc: bool,
    pub capture: CaptureConfig,
    pub encoding: EncodingConfig,
    pub input: InputConfig,
    pub webrtc: WebRTCConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resolution {
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureConfig {
    pub window_title: Option<String>,
    pub process_name: Option<String>,
    pub capture_cursor: bool,
    pub capture_audio: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncodingConfig {
    pub codec: String,
    pub preset: String,
    pub crf: u8,
    pub keyframe_interval: u32,
    pub low_latency: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InputConfig {
    pub enable_mouse: bool,
    pub enable_keyboard: bool,
    pub mouse_sensitivity: f32,
    pub input_lag_compensation: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebRTCConfig {
    pub ice_servers: Vec<IceServer>,
    pub data_channel_ordered: bool,
    pub video_codec: String,
    pub audio_codec: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IceServer {
    pub urls: Vec<String>,
    pub username: Option<String>,
    pub credential: Option<String>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            signaling_addr: "wss://gameshare-clientview.fly.dev/signaling".to_string(),
            target_framerate: 30,
            target_bitrate: 5000,
            resolution: Resolution { width: 1920, height: 1080 },
            use_nvenc: true,
            capture: CaptureConfig {
                window_title: None,
                process_name: None,
                capture_cursor: true,
                capture_audio: true,
            },
            encoding: EncodingConfig {
                codec: "h264".to_string(),
                preset: "ultrafast".to_string(),
                crf: 23,
                keyframe_interval: 30,
                low_latency: true,
            },
            input: InputConfig {
                enable_mouse: true,
                enable_keyboard: true,
                mouse_sensitivity: 1.0,
                input_lag_compensation: true,
            },
            webrtc: WebRTCConfig {
                ice_servers: vec![
                    IceServer {
                        urls: vec!["stun:stun.l.google.com:19302".to_string()],
                        username: None,
                        credential: None,
                    }
                ],
                data_channel_ordered: false,
                video_codec: "H264".to_string(),
                audio_codec: "opus".to_string(),
            },
        }
    }
}

impl Config {
    pub fn load(config_path: &str, args: Args) -> Result<Self> {
        let mut config = if std::path::Path::new(config_path).exists() {
            let config_str = std::fs::read_to_string(config_path)?;
            match toml::from_str::<Config>(&config_str) {
                Ok(cfg) => cfg,
                Err(e) => {
                    eprintln!("Config parse warning: {e}. Falling back to defaults.");
                    Config::default()
                }
            }
        } else {
            Self::default()
        };

        // Override with command line arguments
        config.signaling_addr = args.signaling_addr.to_string();
        config.target_framerate = args.framerate;
        config.target_bitrate = args.bitrate;
        config.use_nvenc = args.nvenc;

        if let Some(title) = args.window_title {
            config.capture.window_title = Some(title);
        }

        if let Some(process) = args.process_name {
            config.capture.process_name = Some(process);
        }

        // Parse resolution
        let resolution_parts: Vec<&str> = args.resolution.split('x').collect();
        if resolution_parts.len() == 2 {
            config.resolution.width = resolution_parts[0].parse()?;
            config.resolution.height = resolution_parts[1].parse()?;
        }

        Ok(config)
    }

    pub fn save(&self, config_path: &str) -> Result<()> {
        let config_str = toml::to_string_pretty(self)?;
        std::fs::write(config_path, config_str)?;
        Ok(())
    }
}

impl Resolution {
    pub fn aspect_ratio(&self) -> f32 {
        self.width as f32 / self.height as f32
    }
} 