use anyhow::Result;
use clap::Parser;
use std::net::SocketAddr;
use tracing::{info, error, warn};
use std::sync::Arc;

mod config;
mod error;
mod signaling;
mod remote_signaling;
mod host_session;

#[cfg(target_os = "linux")]
mod capture;
#[cfg(target_os = "linux")]
mod encoding;
#[cfg(target_os = "linux")]
mod input;
#[cfg(target_os = "linux")]
mod streaming;

use crate::config::Config;

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
    #[arg(short, long, default_value = "127.0.0.1:8080")]
    signaling_addr: SocketAddr,

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
    validate_system_requirements(&config).await?;

    // Handle signaling based on mode
    info!("Remote signaling URL: {:?}", args.remote_signaling_url);
    let _signaling_handle = if let Some(remote_url) = &args.remote_signaling_url {
        // Remote signaling mode
        let session_id = std::env::var("SESSION_ID").unwrap_or_else(|_| "default-session".to_string());

        // single channel shared between host and remote client
        let (sig_tx, sig_rx) = tokio::sync::mpsc::unbounded_channel::<crate::signaling::SignalingMessage>();

        // HostSessionManager gets the *sender*
        let host_mgr = Arc::new(
            host_session::HostSessionManager::new(Arc::new(config.clone()))
                .with_response_sender(sig_tx.clone())
        );

        // RemoteSignalingClient gets the *receiver*
        let remote_client = remote_signaling::RemoteSignalingClient::new(
            remote_url.clone(),
            session_id,
            host_mgr.clone(),
            sig_rx,
        );

        tokio::spawn(async move {
            if let Err(e) = remote_client.connect().await {
                error!("Remote signaling connection failed: {}", e);
            }
            Ok::<(), anyhow::Error>(())
        })
    } else {
        // Local signaling server mode
        // Create host manager for local mode
        let host_mgr = Arc::new(host_session::HostSessionManager::new(Arc::new(config.clone())));
        tokio::spawn(signaling::start_server(config.signaling_addr, host_mgr))
    };

    #[cfg(target_os = "linux")]
    {
        // Initialize capture system
        let mut capture_system = capture::CaptureSystem::new(&config).await?;
        
        // Initialize encoding system
        let mut encoder = encoding::Encoder::new(&config).await?;
        
        // Initialize input handler
        let input_handler = input::InputHandler::new(&config).await?;
        
        // Initialize WebRTC streaming
        let streamer = streaming::WebRTCStreamer::new(&config, input_handler).await?;

        info!("All systems initialized successfully");
        info!("Waiting for client connections on {}", config.signaling_addr);

        // Main game loop
        let mut frame_count = 0u64;
        let start_time = std::time::Instant::now();

        loop {
            // Capture frame from game window
            if let Some(frame) = capture_system.capture_frame().await? {
                // Encode frame
                if let Some(encoded_frame) = encoder.encode_frame(frame).await? {
                    // Stream to connected clients
                    streamer.send_frame(encoded_frame).await?;
                    
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
            }

            // Small sleep to prevent busy loop
            tokio::time::sleep(std::time::Duration::from_millis(1)).await;
        }
    }

    // Cleanup
    _signaling_handle.abort();

    #[cfg(not(target_os = "linux"))]
    {
        anyhow::bail!("GameShare host agent is only supported on Linux");
    }

    Ok(())
}

async fn validate_system_requirements(_config: &Config) -> Result<()> {
    info!("Validating system requirements...");

    // Check if running on Linux
    if !cfg!(target_os = "linux") {
        anyhow::bail!("GameShare host agent currently only supports Linux");
    }

    #[cfg(not(target_os = "linux"))]
    {
        anyhow::bail!("This build does not support the current platform. Please use a Linux system.");
    }

    // Check for X11 display
    if std::env::var("DISPLAY").is_err() {
        anyhow::bail!("X11 DISPLAY environment variable not set");
    }

    #[cfg(target_os = "linux")]
    {
        // Check for hardware encoding support if requested
        if _config.use_nvenc {
            if !encoding::check_nvenc_support().await? {
                warn!("NVENC not available, falling back to x264 software encoding");
            }
        }

        // Check for uinput permissions
        if !input::check_uinput_permissions()? {
            anyhow::bail!("Insufficient permissions for uinput. Please run with sudo or add user to input group");
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