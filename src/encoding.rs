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
                    "-profile:v", "baseline",
                    "-level", "3.1",
                    "-rc", "cbr",
                    "-b:v", &format!("{}k", self.config.target_bitrate),
                    "-maxrate", &format!("{}k", self.config.target_bitrate),
                    "-bufsize", &format!("{}k", self.config.target_bitrate / 2),
                    "-g", &self.config.encoding.keyframe_interval.to_string(),
                    "-keyint_min", &self.config.encoding.keyframe_interval.to_string(), // Minimum GOP size
                    "-forced-idr", "1", // Force IDR frames for NVENC
                    "-bf", "0", // No B-frames for low latency
                    "-refs", "1",
                    "-spatial-aq", "1",
                    "-temporal-aq", "1",
                    "-rc-lookahead", "0",
                    "-delay", "0",
                    "-flags2", "+local_header",  // Include SPS/PPS with keyframes
                ]);
            },
            EncoderType::X264 => {
                ffmpeg_cmd.args(&[
                    "-c:v", "libx264",
                    "-preset", &self.config.encoding.preset,
                    "-tune", "zerolatency",
                    "-profile:v", "baseline",
                    "-level", "3.1",
                    "-crf", &self.config.encoding.crf.to_string(),
                    "-maxrate", &format!("{}k", self.config.target_bitrate),
                    "-bufsize", &format!("{}k", self.config.target_bitrate / 2),
                    "-g", &self.config.encoding.keyframe_interval.to_string(),
                    "-keyint_min", &self.config.encoding.keyframe_interval.to_string(), // Minimum GOP size
                    "-x264-params", &format!("keyint={}:min-keyint={}", 
                        self.config.encoding.keyframe_interval, 
                        self.config.encoding.keyframe_interval), // Exact GOP control
                    "-bf", "0", // No B-frames
                    "-refs", "1",
                    "-sc_threshold", "0", // Disable scene change detection
                    "-flags2", "+local_header",  // Include SPS/PPS with keyframes
                ]);
            }
        }

        // Force keyframes at regular intervals
        ffmpeg_cmd.args(&[
            "-force_key_frames", "expr:gte(t,n_forced*1)",  // Force keyframe every 1 second
        ]);
        
        // Output configuration - Output H.264 Annex B format for WebRTC
        ffmpeg_cmd.args(&[
            "-f", "h264",
            "-bsf:v", "h264_mp4toannexb,dump_extra",  // Include SPS/PPS
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
        let mut accumulated = Vec::new();
        let mut pts = 0i64;

        loop {
            match stdout.read(&mut buffer).await {
                Ok(0) => {
                    debug!("Encoder output stream ended");
                    break;
                }
                Ok(bytes_read) => {
                    // Accumulate data
                    accumulated.extend_from_slice(&buffer[..bytes_read]);
                    
                    // Parse NAL units from accumulated data
                    let (nal_units, remaining_data) = Self::extract_nal_units_with_remainder(&accumulated);
                    
                    for nal_data in nal_units {
                        if nal_data.len() < 4 {
                            continue; // Skip invalid NAL units
                        }
                        
                        let is_keyframe = Self::is_keyframe(&nal_data);
                        
                        // Log NAL unit details 
                        let nal_type = if nal_data.len() > 4 {
                            nal_data[3] & 0x1F
                        } else if nal_data.len() > 3 {
                            nal_data[2] & 0x1F
                        } else {
                            0
                        };
                        
                        // Log important NAL units
                        if pts < 10 || pts % 30 == 0 || nal_type == 5 || nal_type == 7 || nal_type == 8 {
                            let nal_type_name = match nal_type {
                                1 => "non-IDR slice",
                                5 => "IDR slice (keyframe)",
                                7 => "SPS",
                                8 => "PPS",
                                _ => "other"
                            };
                            debug!("Sending NAL unit #{}: type={} ({}), size={}, keyframe={}", 
                                   pts, nal_type, nal_type_name, nal_data.len(), is_keyframe);
                        }
                        
                        let encoded_frame = EncodedFrame {
                            data: nal_data,
                            timestamp: std::time::Instant::now(),
                            is_keyframe,
                            pts,
                        };

                        if encoded_tx.send(encoded_frame).await.is_err() {
                            debug!("Encoded frame receiver dropped, stopping encoding");
                            return;
                        }
                        
                        pts += 1;
                    }
                    
                    // Keep only the unparsed remainder
                    accumulated = remaining_data;
                    
                    // Prevent buffer from growing too large
                    if accumulated.len() > 1024 * 1024 { // 1MB limit
                        error!("NAL unit buffer overflow, clearing");
                        accumulated.clear();
                    }
                }
                Err(e) => {
                    error!("Error reading from encoder: {}", e);
                    break;
                }
            }
        }
    }

    fn extract_nal_units_with_remainder(data: &[u8]) -> (Vec<Vec<u8>>, Vec<u8>) {
        let mut nal_units = Vec::new();
        let mut i = 0;
        let mut last_complete_nal_end = 0;
        
        while i < data.len() {
            // Look for start code (0x00 0x00 0x01 or 0x00 0x00 0x00 0x01)
            if i + 3 <= data.len() && data[i] == 0x00 && data[i+1] == 0x00 {
                let start_code_len = if i + 4 <= data.len() && data[i+2] == 0x00 && data[i+3] == 0x01 {
                    4 // 4-byte start code
                } else if data[i+2] == 0x01 {
                    3 // 3-byte start code
                } else {
                    i += 1;
                    continue;
                };
                
                // Find the next start code
                let mut end_pos = i + start_code_len;
                let mut found_next = false;
                
                while end_pos + 3 < data.len() {
                    if data[end_pos] == 0x00 && data[end_pos+1] == 0x00 && 
                       (data[end_pos+2] == 0x01 || (end_pos + 3 < data.len() && data[end_pos+2] == 0x00 && data[end_pos+3] == 0x01)) {
                        found_next = true;
                        break;
                    }
                    end_pos += 1;
                }
                
                if found_next {
                    // We found a complete NAL unit
                    let nal_unit = data[i..end_pos].to_vec();
                    if nal_unit.len() > 4 {
                        nal_units.push(nal_unit);
                    }
                    last_complete_nal_end = end_pos;
                    i = end_pos;
                } else {
                    // This might be an incomplete NAL unit at the end
                    break;
                }
            } else {
                i += 1;
            }
        }
        
        // Return the NAL units and any remaining incomplete data
        let remainder = if last_complete_nal_end < data.len() {
            data[last_complete_nal_end..].to_vec()
        } else {
            Vec::new()
        };
        
        (nal_units, remainder)
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