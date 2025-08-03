use anyhow::Result;
use clap::Parser;
use std::net::SocketAddr;
use tracing::{info, error, warn, debug};
use std::sync::Arc;

mod config;
mod error;
mod signaling;
mod remote_signaling;
mod host_session;
mod gstreamer_pipeline;

#[cfg(target_os = "linux")]
mod capture;
#[cfg(target_os = "linux")]
mod encoding;
#[cfg(target_os = "linux")]
mod input;
#[cfg(target_os = "linux")]
mod streaming;

use crate::config::Config;
use crate::gstreamer_pipeline::GStreamerPipeline;

#[derive(Parser, Debug, Clone)]
#[command(name = "gameshare-host")]
#[command(about = "GameShare P2P Cloud Gaming Host Agent")]
struct Args {
    /// Configuration file path
    #[arg(short, long, default_value = "config.toml")]
    config: String,

    /// Game window title to capture
    #[arg(short, long)]
    window_title: Option<String>,

    /// Game window process name to capture  
    #[arg(short, long)]
    process_name: Option<String>,

    /// Signaling server address (for local server mode)
    #[arg(short, long, default_value = "wss://gameshare-clientview.fly.dev/signaling")]
    signaling_addr: String,

    /// Remote signaling server URL (for remote mode)
    #[arg(long)]
    remote_signaling_url: Option<String>,

    /// Enable hardware encoding (NVENC)
    #[arg(long)]
    nvenc: bool,

    /// Video resolution (format: WIDTHxHEIGHT)
    #[arg(long, default_value = "1920x1080")]
    resolution: String,

    /// Target framerate
    #[arg(long, default_value = "30")]
    framerate: u32,

    /// Video bitrate in kbps
    #[arg(long, default_value = "5000")]
    bitrate: u32,

    /// Verbose logging
    #[arg(short, long)]
    verbose: bool,
    
    /// Use GStreamer instead of FFmpeg
    #[arg(long)]
    use_gstreamer: bool,
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();

    // Initialize logging
    let log_level = if args.verbose { "debug" } else { "info" };
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new(format!("gameshare_cloud_backend={}", log_level)))
        )
        .init();

    info!("Starting GameShare Host Agent v{}", env!("CARGO_PKG_VERSION"));

    // Load configuration
    info!("About to load configuration...");
    let config = Config::load(&args.config.clone(), args.clone())?;
    info!("Configuration loaded: {:?}", config);
    info!("Remote signaling URL from args: {:?}", args.remote_signaling_url);

    // Validate system requirements
    info!("About to validate system requirements...");
    validate_system_requirements(&config, &args).await?;

    // Create host manager (shared between both modes)
    let host_mgr = Arc::new(host_session::HostSessionManager::new(Arc::new(config.clone())));
    
    // Handle signaling based on mode
    info!("Signaling address: {}", config.signaling_addr);
    let _signaling_handle = if config.signaling_addr.starts_with("ws://") || config.signaling_addr.starts_with("wss://") {
        // Remote signaling mode
        let session_id = std::env::var("SESSION_ID").unwrap_or_else(|_| "default-session".to_string());

        // Create remote signaling client
        let remote_client = remote_signaling::RemoteSignalingClient::new(
            config.signaling_addr.clone(),
            session_id,
            host_mgr.clone(),
        );

        tokio::spawn(async move {
            if let Err(e) = remote_client.connect().await {
                error!("Remote signaling connection failed: {}", e);
            }
            Ok::<(), anyhow::Error>(())
        })
    } else {
        // Local signaling server mode
        let addr: SocketAddr = config.signaling_addr.parse().expect("Invalid socket address");
        tokio::spawn(signaling::start_server(addr, host_mgr.clone()))
    };

    // Choose between GStreamer and FFmpeg based on command line flag or platform
    if args.use_gstreamer || cfg!(not(target_os = "linux")) {
        info!("Using GStreamer for video capture and encoding");
        
        // Initialize GStreamer pipeline
        let mut gst_pipeline = GStreamerPipeline::new(&config, host_mgr.clone()).await?;
        
        // Start GStreamer pipeline
        gst_pipeline.start().await?;
        info!("GStreamer pipeline started successfully");
        
        info!("All systems initialized successfully");
        info!("Waiting for client connections on {}", config.signaling_addr);
        
        // Main loop - GStreamer handles the video pipeline internally
        let mut frame_count = 0u64;
        let start_time = std::time::Instant::now();
        info!("Starting main loop");
        
        loop {
            // Check if pipeline is still running
            if !gst_pipeline.is_running().await {
                error!("GStreamer pipeline stopped unexpectedly");
                break;
            }
            
            // Log performance stats every 5 seconds
            if frame_count % (u64::from(config.target_framerate) * 5) == 0 && frame_count > 0 {
                let elapsed = start_time.elapsed();
                let fps = frame_count as f64 / elapsed.as_secs_f64();
                let memory_usage = get_memory_usage();
                
                info!(
                    "Performance: {:.1} FPS, {} MB memory, {} frames processed",
                    fps, memory_usage, frame_count
                );
                
                if memory_usage > 100.0 {
                    warn!("Memory usage above target: {:.1} MB > 100 MB", memory_usage);
                }
            }
            
            frame_count += 1;
            
            // Small sleep to prevent busy loop
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }
        
        // Cleanup
        gst_pipeline.stop().await?;
        
    } else {
        #[cfg(target_os = "linux")]
        {
            info!("Using FFmpeg for video capture and encoding");
            
            // Initialize capture system
            let mut capture_system = capture::CaptureSystem::new(&config).await?;
            
            // Initialize encoding system
            let mut encoder = encoding::Encoder::new(&config).await?;
            
            // Initialize input handler
            let input_handler = input::InputHandler::new(&config).await?;
            
            info!("All systems initialized successfully");
            info!("Waiting for client connections on {}", config.signaling_addr);

            // Main game loop
            let mut frame_count = 0u64;
            let start_time = std::time::Instant::now();
            info!("Starting main capture loop");

            loop {
                // Capture frame from game window
                match capture_system.capture_frame().await {
                    Ok(Some(frame)) => {
                        debug!("Captured frame {} with {} bytes", frame_count, frame.data.len());
                        // Encode frame
                        match encoder.encode_frame(frame).await {
                            Ok(Some(encoded_frame)) => {
                                debug!("Encoded frame {} with {} bytes", frame_count, encoded_frame.data.len());
                                // Log every 5 seconds
                                if frame_count % (u64::from(config.target_framerate) * 5) == 0 {
                                    info!("Captured and encoded frame #{}", frame_count);
                                }
                                // Broadcast to all connected sessions
                                host_mgr.broadcast_frame(encoded_frame).await?;
                                
                                frame_count += 1;
                        
                        // Log performance stats every 5 seconds
                        if frame_count % (u64::from(config.target_framerate) * 5) == 0 {
                            let elapsed = start_time.elapsed();
                            let fps = frame_count as f64 / elapsed.as_secs_f64();
                            let memory_usage = get_memory_usage();
                            
                            info!(
                                "Performance: {:.1} FPS, {} MB memory, {} frames processed",
                                fps, memory_usage, frame_count
                            );
                            
                            // Check performance targets
                            if fps < config.target_framerate as f64 * 0.9 {
                                warn!("FPS below target: {:.1} < {}", fps, config.target_framerate);
                            }
                            
                            if memory_usage > 100.0 {
                                warn!("Memory usage above target: {:.1} MB > 100 MB", memory_usage);
                            }
                        }
                            }
                            Ok(None) => {
                                debug!("No encoded frame produced");
                            }
                            Err(e) => {
                                error!("Failed to encode frame: {}", e);
                            }
                        }
                    }
                    Ok(None) => {
                        // No frame captured - this might be normal
                        tokio::time::sleep(std::time::Duration::from_millis(1)).await;
                    }
                    Err(e) => {
                        error!("Failed to capture frame: {}", e);
                        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
                    }
                }

                // Small sleep to prevent busy loop
                tokio::time::sleep(std::time::Duration::from_millis(1)).await;
            }
        }

        #[cfg(not(target_os = "linux"))]
        {
            anyhow::bail!("FFmpeg mode is only supported on Linux. Use --use-gstreamer flag for cross-platform support.");
        }
    }

    Ok(())
}

async fn validate_system_requirements(config: &Config, args: &Args) -> Result<()> {
    info!("Validating system requirements...");

    if args.use_gstreamer || cfg!(not(target_os = "linux")) {
        // GStreamer mode - cross-platform
        info!("Validating GStreamer installation...");
        
        // Check if GStreamer is initialized properly
        if let Err(e) = gstreamer::init() {
            anyhow::bail!("Failed to initialize GStreamer: {}. Please install GStreamer development packages.", e);
        }
        
        // Platform-specific display checks
        #[cfg(target_os = "linux")]
        {
            if std::env::var("DISPLAY").is_err() && std::env::var("WAYLAND_DISPLAY").is_err() {
                anyhow::bail!("Neither X11 DISPLAY nor WAYLAND_DISPLAY environment variable is set");
            }
        }
        
        info!("GStreamer validated successfully");
    } else {
        // FFmpeg mode - Linux only
        #[cfg(target_os = "linux")]
        {
            // Check for X11 display
            if std::env::var("DISPLAY").is_err() {
                anyhow::bail!("X11 DISPLAY environment variable not set");
            }
            
            // Check for hardware encoding support if requested
            if config.use_nvenc {
                if !encoding::check_nvenc_support().await? {
                    warn!("NVENC not available, falling back to x264 software encoding");
                }
            }

            // Check for uinput permissions
            if !input::check_uinput_permissions()? {
                anyhow::bail!("Insufficient permissions for uinput. Please run with sudo or add user to input group");
            }
        }
        
        #[cfg(not(target_os = "linux"))]
        {
            anyhow::bail!("FFmpeg mode is only supported on Linux. Use --use-gstreamer flag for cross-platform support.");
        }
    }

    info!("System requirements validated successfully");
    Ok(())
}

fn get_memory_usage() -> f64 {
    use sysinfo::{System, SystemExt, ProcessExt};
    
    let mut system = System::new();
    system.refresh_process(sysinfo::get_current_pid().unwrap());
    
    if let Some(process) = system.process(sysinfo::get_current_pid().unwrap()) {
        process.memory() as f64 / 1024.0 / 1024.0 // Convert to MB
    } else {
        0.0
    }
} 