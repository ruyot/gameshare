use anyhow::Result;
use std::process::{Command, Stdio};
use std::sync::Arc;
use tokio::process;
use tracing::{debug, error, info};

use crate::capture::Frame;
use crate::config::Config;
use crate::error::GameShareError;

pub struct Encoder {
    config: Arc<Config>,
    encoder_type: EncoderType,
    ffmpeg_process: Option<process::Child>,
    frame_sender: Option<tokio::sync::mpsc::Sender<Frame>>,
    encoded_receiver: Option<tokio::sync::mpsc::Receiver<EncodedFrame>>,
}

#[derive(Debug, Clone)]
pub enum EncoderType {
    Nvenc,
    X264,
}

#[derive(Debug, Clone)]
pub struct EncodedFrame {
    pub data: Vec<u8>,
    pub timestamp: std::time::Instant,
    pub is_keyframe: bool,
    pub pts: i64,
}

impl Encoder {
    pub async fn new(config: &Config) -> Result<Self> {
        let config = Arc::new(config.clone());
        
        // Determine encoder type
        let encoder_type = if config.use_nvenc && check_nvenc_support().await? {
            info!("Using NVENC hardware encoding");
            EncoderType::Nvenc
        } else {
            info!("Using x264 software encoding");
            EncoderType::X264
        };

        let mut encoder = Self {
            config: config.clone(),
            encoder_type,
            ffmpeg_process: None,
            frame_sender: None,
            encoded_receiver: None,
        };

        encoder.initialize_encoder().await?;
        Ok(encoder)
    }

    async fn initialize_encoder(&mut self) -> Result<()> {
        let (frame_tx, frame_rx) = tokio::sync::mpsc::channel(30);
        let (encoded_tx, encoded_rx) = tokio::sync::mpsc::channel(30);

        let mut ffmpeg_cmd = Command::new("ffmpeg");
        
        // Input configuration
        ffmpeg_cmd.args(&[
            "-f", "rawvideo",
            "-pix_fmt", "bgr24",
            "-s", &format!("{}x{}", self.config.resolution.width, self.config.resolution.height),
            "-r", &self.config.target_framerate.to_string(),
            "-i", "-",
        ]);

        // Encoder configuration
        match self.encoder_type {
            EncoderType::Nvenc => {
                ffmpeg_cmd.args(&[
                    "-c:v", "h264_nvenc",
                    "-preset", "llhq", // Low latency high quality
                    "-rc", "cbr",
                    "-b:v", &format!("{}k", self.config.target_bitrate),
                    "-maxrate", &format!("{}k", self.config.target_bitrate),
                    "-bufsize", &format!("{}k", self.config.target_bitrate / 2),
                    "-g", &self.config.encoding.keyframe_interval.to_string(),
                    "-bf", "0", // No B-frames for low latency
                    "-refs", "1",
                    "-spatial-aq", "1",
                    "-temporal-aq", "1",
                    "-rc-lookahead", "0",
                    "-delay", "0",
                ]);
            },
            EncoderType::X264 => {
                ffmpeg_cmd.args(&[
                    "-c:v", "libx264",
                    "-preset", &self.config.encoding.preset,
                    "-tune", "zerolatency",
                    "-crf", &self.config.encoding.crf.to_string(),
                    "-maxrate", &format!("{}k", self.config.target_bitrate),
                    "-bufsize", &format!("{}k", self.config.target_bitrate / 2),
                    "-g", &self.config.encoding.keyframe_interval.to_string(),
                    "-bf", "0", // No B-frames
                    "-refs", "1",
                    "-sc_threshold", "0", // Disable scene change detection
                ]);
            }
        }

        // Output configuration
        ffmpeg_cmd.args(&[
            "-f", "h264",
            "-flags", "+global_header",
            "-fflags", "+nobuffer",
            "-"
        ]);

        // Low latency flags
        if self.config.encoding.low_latency {
            ffmpeg_cmd.args(&[
                "-flags", "low_delay",
                "-fflags", "nobuffer+fastseek",
                "-probesize", "32",
                "-analyzeduration", "0",
            ]);
        }

        debug!("Starting encoder with command: {:?}", ffmpeg_cmd);

        let mut ffmpeg_process = process::Command::from(ffmpeg_cmd)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| GameShareError::encoding(format!("Failed to start encoder: {}", e)))?;

        let stdin = ffmpeg_process.stdin.take()
            .ok_or_else(|| GameShareError::encoding("Failed to get encoder stdin"))?;

        let stdout = ffmpeg_process.stdout.take()
            .ok_or_else(|| GameShareError::encoding("Failed to get encoder stdout"))?;

        // Spawn tasks for frame input and encoded output
        let config = self.config.clone();
        tokio::spawn(Self::frame_input_task(stdin, frame_rx, config.clone()));
        tokio::spawn(Self::encoded_output_task(stdout, encoded_tx, config));

        self.ffmpeg_process = Some(ffmpeg_process);
        self.frame_sender = Some(frame_tx);
        self.encoded_receiver = Some(encoded_rx);

        info!("Encoder initialized successfully");
        Ok(())
    }

    async fn frame_input_task(
        mut stdin: process::ChildStdin,
        mut frame_rx: tokio::sync::mpsc::Receiver<Frame>,
        _config: Arc<Config>,
    ) {
        use tokio::io::AsyncWriteExt;

        while let Some(frame) = frame_rx.recv().await {
            if let Err(e) = stdin.write_all(&frame.data).await {
                error!("Failed to write frame to encoder: {}", e);
                break;
            }
            
            if let Err(e) = stdin.flush().await {
                error!("Failed to flush encoder input: {}", e);
                break;
            }
        }
    }

    async fn encoded_output_task(
        mut stdout: process::ChildStdout,
        encoded_tx: tokio::sync::mpsc::Sender<EncodedFrame>,
        _config: Arc<Config>,
    ) {
        use tokio::io::AsyncReadExt;

        let mut buffer = vec![0u8; 65536]; // 64KB buffer
        let mut pts = 0i64;

        loop {
            match stdout.read(&mut buffer).await {
                Ok(0) => {
                    debug!("Encoder output stream ended");
                    break;
                }
                Ok(bytes_read) => {
                    let data = buffer[..bytes_read].to_vec();
                    
                    // Simple keyframe detection (look for I-frame NAL units)
                    let is_keyframe = Self::is_keyframe(&data);

                    let encoded_frame = EncodedFrame {
                        data,
                        timestamp: std::time::Instant::now(),
                        is_keyframe,
                        pts,
                    };

                    if encoded_tx.send(encoded_frame).await.is_err() {
                        debug!("Encoded frame receiver dropped, stopping encoding");
                        break;
                    }

                    pts += 1;
                }
                Err(e) => {
                    error!("Error reading from encoder: {}", e);
                    break;
                }
            }
        }
    }

    fn is_keyframe(data: &[u8]) -> bool {
        // Look for H.264 I-frame NAL unit (type 5)
        for window in data.windows(4) {
            if window[0] == 0x00 && window[1] == 0x00 && window[2] == 0x01 {
                let nal_type = window[3] & 0x1F;
                if nal_type == 5 { // IDR slice
                    return true;
                }
            }
        }
        false
    }

    pub async fn encode_frame(&mut self, frame: Frame) -> Result<Option<EncodedFrame>> {
        if let Some(ref sender) = self.frame_sender {
            sender.send(frame).await
                .map_err(|e| GameShareError::encoding(format!("Failed to send frame to encoder: {}", e)))?;
        }

        if let Some(ref mut receiver) = self.encoded_receiver {
            Ok(receiver.recv().await)
        } else {
            Ok(None)
        }
    }

    pub fn get_encoder_type(&self) -> &EncoderType {
        &self.encoder_type
    }
}

pub async fn check_nvenc_support() -> Result<bool> {
    // Check if NVIDIA GPU is available
    let nvidia_check = Command::new("nvidia-smi")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false);

    if !nvidia_check {
        return Ok(false);
    }

    // Check if FFmpeg has NVENC support
    let ffmpeg_check = Command::new("ffmpeg")
        .args(&["-hide_banner", "-encoders"])
        .output()
        .map_err(|e| GameShareError::encoding(format!("Failed to check FFmpeg encoders: {}", e)))?;

    if ffmpeg_check.status.success() {
        let output = String::from_utf8_lossy(&ffmpeg_check.stdout);
        Ok(output.contains("h264_nvenc"))
    } else {
        Ok(false)
    }
}

impl Drop for Encoder {
    fn drop(&mut self) {
        if let Some(mut process) = self.ffmpeg_process.take() {
            let _ = process.kill();
        }
    }
} 