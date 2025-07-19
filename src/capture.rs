use anyhow::Result;
use std::process::{Command, Stdio};
use std::sync::Arc;
use tokio::sync::mpsc;
use tracing::{debug, error, info, warn};

use crate::config::Config;
use crate::error::GameShareError;

pub struct CaptureSystem {
    config: Arc<Config>,
    window_id: Option<u64>,
    ffmpeg_process: Option<tokio::process::Child>,
    frame_receiver: Option<mpsc::Receiver<Frame>>,
}

#[derive(Debug, Clone)]
pub struct Frame {
    pub data: Vec<u8>,
    pub width: u32,
    pub height: u32,
    pub format: PixelFormat,
    pub timestamp: std::time::Instant,
}

#[derive(Debug, Clone)]
pub enum PixelFormat {
    Bgr24,
    Yuv420p,
    Rgba,
}

impl CaptureSystem {
    pub async fn new(config: &Config) -> Result<Self> {
        let config = Arc::new(config.clone());
        
        let mut capture_system = Self {
            config: config.clone(),
            window_id: None,
            ffmpeg_process: None,
            frame_receiver: None,
        };

        // Find target window
        capture_system.find_target_window().await?;
        
        // Initialize FFmpeg capture
        capture_system.initialize_capture().await?;

        Ok(capture_system)
    }

    async fn find_target_window(&mut self) -> Result<()> {
        info!("Searching for target window...");

        let window_id = if let Some(ref title) = self.config.capture.window_title {
            Self::find_window_by_title(title).await?
        } else if let Some(ref process) = self.config.capture.process_name {
            Self::find_window_by_process(process).await?
        } else {
            // Use the entire desktop
            None
        };

        if let Some(id) = window_id {
            info!("Found target window with ID: 0x{:x}", id);
            self.window_id = Some(id);
        } else {
            info!("No specific window found, will capture entire desktop");
        }

        Ok(())
    }

    async fn find_window_by_title(title: &str) -> Result<Option<u64>> {
        let output = Command::new("xwininfo")
            .args(&["-name", title])
            .output()
            .map_err(|e| GameShareError::capture(format!("Failed to run xwininfo: {}", e)))?;

        if !output.status.success() {
            return Ok(None);
        }

        let output_str = String::from_utf8_lossy(&output.stdout);
        for line in output_str.lines() {
            if line.contains("Window id:") {
                if let Some(id_str) = line.split_whitespace().nth(3) {
                    if let Ok(id) = u64::from_str_radix(id_str.trim_start_matches("0x"), 16) {
                        return Ok(Some(id));
                    }
                }
            }
        }

        Ok(None)
    }

    async fn find_window_by_process(process_name: &str) -> Result<Option<u64>> {
        // First find the PID
        let output = Command::new("pgrep")
            .arg(process_name)
            .output()
            .map_err(|e| GameShareError::capture(format!("Failed to run pgrep: {}", e)))?;

        if !output.status.success() {
            return Ok(None);
        }

        let pid_str = String::from_utf8_lossy(&output.stdout);
        let pid = pid_str.trim().parse::<u32>().ok();

        if let Some(pid) = pid {
            // Find window for this PID
            let output = Command::new("xdotool")
                .args(&["search", "--pid", &pid.to_string()])
                .output()
                .map_err(|e| GameShareError::capture(format!("Failed to run xdotool: {}", e)))?;

            if output.status.success() {
                let window_str = String::from_utf8_lossy(&output.stdout);
                if let Some(window_line) = window_str.lines().next() {
                    if let Ok(window_id) = window_line.trim().parse::<u64>() {
                        return Ok(Some(window_id));
                    }
                }
            }
        }

        Ok(None)
    }

    async fn initialize_capture(&mut self) -> Result<()> {
        let (tx, rx) = mpsc::channel(30); // Buffer up to 1 second at 30fps
        
        let mut ffmpeg_cmd = Command::new("ffmpeg");
        
        // Input configuration
        if let Some(window_id) = self.window_id {
            // Capture specific window
            ffmpeg_cmd.args(&[
                "-f", "x11grab",
                "-r", &self.config.target_framerate.to_string(),
                "-i", &format!(":0.0+0,0"), // Will need to get window geometry
            ]);
        } else {
            // Capture full desktop
            ffmpeg_cmd.args(&[
                "-f", "x11grab",
                "-r", &self.config.target_framerate.to_string(),
                "-s", &format!("{}x{}", self.config.resolution.width, self.config.resolution.height),
                "-i", ":0.0",
            ]);
        }

        // Add cursor capture if enabled
        if self.config.capture.capture_cursor {
            ffmpeg_cmd.args(&["-draw_mouse", "1"]);
        }

        // Output configuration
        ffmpeg_cmd.args(&[
            "-f", "rawvideo",
            "-pix_fmt", "bgr24",
            "-"
        ]);

        // Configure for low latency
        ffmpeg_cmd.args(&[
            "-fflags", "nobuffer",
            "-flags", "low_delay",
            "-strict", "experimental"
        ]);

        debug!("Starting FFmpeg with command: {:?}", ffmpeg_cmd);

        let mut ffmpeg_process = tokio::process::Command::from(ffmpeg_cmd)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| GameShareError::capture(format!("Failed to start FFmpeg: {}", e)))?;

        let stdout = ffmpeg_process.stdout.take()
            .ok_or_else(|| GameShareError::capture("Failed to get FFmpeg stdout"))?;

        // Spawn frame reading task
        let config = self.config.clone();
        tokio::spawn(Self::frame_reader_task(stdout, tx, config));

        self.ffmpeg_process = Some(ffmpeg_process);
        self.frame_receiver = Some(rx);

        info!("FFmpeg capture initialized successfully");
        Ok(())
    }

    async fn frame_reader_task(
        mut stdout: tokio::process::ChildStdout,
        tx: mpsc::Sender<Frame>,
        config: Arc<Config>,
    ) {
        use tokio::io::AsyncReadExt;

        let frame_size = (config.resolution.width * config.resolution.height * 3) as usize; // BGR24
        let mut buffer = vec![0u8; frame_size];

        loop {
            match stdout.read_exact(&mut buffer).await {
                Ok(()) => {
                    let frame = Frame {
                        data: buffer.clone(),
                        width: config.resolution.width,
                        height: config.resolution.height,
                        format: PixelFormat::Bgr24,
                        timestamp: std::time::Instant::now(),
                    };

                    if tx.send(frame).await.is_err() {
                        debug!("Frame receiver dropped, stopping capture");
                        break;
                    }
                }
                Err(e) => {
                    error!("Error reading frame from FFmpeg: {}", e);
                    break;
                }
            }
        }
    }

    pub async fn capture_frame(&mut self) -> Result<Option<Frame>> {
        if let Some(ref mut receiver) = self.frame_receiver {
            Ok(receiver.recv().await)
        } else {
            Err(GameShareError::capture("Capture system not initialized").into())
        }
    }

    pub async fn get_window_geometry(&self, window_id: u64) -> Result<(i32, i32, u32, u32)> {
        let output = Command::new("xwininfo")
            .args(&["-id", &format!("0x{:x}", window_id)])
            .output()
            .map_err(|e| GameShareError::capture(format!("Failed to get window geometry: {}", e)))?;

        if !output.status.success() {
            return Err(GameShareError::capture("Failed to get window information").into());
        }

        let output_str = String::from_utf8_lossy(&output.stdout);
        let mut x = 0i32;
        let mut y = 0i32;
        let mut width = 0u32;
        let mut height = 0u32;

        for line in output_str.lines() {
            if line.contains("Absolute upper-left X:") {
                x = line.split(':').nth(1).unwrap().trim().parse().unwrap_or(0);
            } else if line.contains("Absolute upper-left Y:") {
                y = line.split(':').nth(1).unwrap().trim().parse().unwrap_or(0);
            } else if line.contains("Width:") {
                width = line.split(':').nth(1).unwrap().trim().parse().unwrap_or(0);
            } else if line.contains("Height:") {
                height = line.split(':').nth(1).unwrap().trim().parse().unwrap_or(0);
            }
        }

        Ok((x, y, width, height))
    }
}

impl Drop for CaptureSystem {
    fn drop(&mut self) {
        if let Some(mut process) = self.ffmpeg_process.take() {
            let _ = process.kill();
        }
    }
} 