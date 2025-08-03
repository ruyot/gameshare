use anyhow::Result;
use gstreamer as gst;
use gstreamer::prelude::*;
use gstreamer_app as gst_app;
use gstreamer_webrtc as gst_webrtc;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{debug, error, info, warn};

use crate::config::Config;
use crate::host_session::HostSessionManager;

pub struct GStreamerPipeline {
    pipeline: gst::Pipeline,
    webrtcbin: Option<gst::Element>,
    config: Arc<Config>,
    host_mgr: Arc<HostSessionManager>,
    is_running: Arc<Mutex<bool>>,
}

impl GStreamerPipeline {
    pub async fn new(config: &Config, host_mgr: Arc<HostSessionManager>) -> Result<Self> {
        // Initialize GStreamer
        gst::init()?;
        info!("GStreamer initialized successfully");

        // Create pipeline
        let pipeline = gst::Pipeline::new(None);
        
        Ok(Self {
            pipeline,
            webrtcbin: None,
            config: Arc::new(config.clone()),
            host_mgr,
            is_running: Arc::new(Mutex::new(false)),
        })
    }
    
    pub async fn start(&mut self) -> Result<()> {
        info!("Starting GStreamer pipeline...");
        
        // Create pipeline elements
        let source = self.create_video_source()?;
        let videoconvert = gst::ElementFactory::make("videoconvert").build()?;
        let videoscale = gst::ElementFactory::make("videoscale").build()?;
        let capsfilter = gst::ElementFactory::make("capsfilter").build()?;
        let x264enc = gst::ElementFactory::make("x264enc").build()?;
        let h264parse = gst::ElementFactory::make("h264parse").build()?;
        let rtph264pay = gst::ElementFactory::make("rtph264pay").build()?;
        let webrtcbin = gst::ElementFactory::make("webrtcbin").build()?;
        
        // Configure elements
        let caps = gst::Caps::builder("video/x-raw")
            .field("width", self.config.resolution.width as i32)
            .field("height", self.config.resolution.height as i32)
            .field("framerate", gst::Fraction::new(self.config.target_framerate as i32, 1))
            .build();
        capsfilter.set_property("caps", &caps);
        
        // Configure x264 encoder for low latency
        x264enc.set_property("tune", "zerolatency");
        x264enc.set_property("speed-preset", "ultrafast");
        x264enc.set_property("key-int-max", self.config.encoding.keyframe_interval);
        x264enc.set_property("bitrate", self.config.target_bitrate);
        
        // Configure RTP payloader
        rtph264pay.set_property("config-interval", -1i32);
        rtph264pay.set_property("pt", 96u32);
        
        // Configure WebRTC
        webrtcbin.set_property("bundle-policy", gst_webrtc::WebRTCBundlePolicy::MaxBundle);
        
        // Add elements to pipeline
        self.pipeline.add_many(&[
            &source,
            &videoconvert,
            &videoscale,
            &capsfilter,
            &x264enc,
            &h264parse,
            &rtph264pay,
            &webrtcbin,
        ])?;
        
        // Link elements
        gst::Element::link_many(&[
            &source,
            &videoconvert,
            &videoscale,
            &capsfilter,
            &x264enc,
            &h264parse,
            &rtph264pay,
        ])?;
        
        // Connect RTP to WebRTC
        let pay_caps = gst::Caps::builder("application/x-rtp")
            .field("media", "video")
            .field("encoding-name", "H264")
            .field("payload", 96i32)
            .build();
        rtph264pay.link_filtered(&webrtcbin, &pay_caps)?;
        
        self.webrtcbin = Some(webrtcbin.clone());
        
        // Set up WebRTC signaling callbacks
        self.setup_webrtc_callbacks(webrtcbin)?;
        
        // Start pipeline
        self.pipeline.set_state(gst::State::Playing)?;
        
        *self.is_running.lock().await = true;
        info!("GStreamer pipeline started successfully");
        
        Ok(())
    }
    
    pub async fn stop(&mut self) -> Result<()> {
        info!("Stopping GStreamer pipeline...");
        
        *self.is_running.lock().await = false;
        self.pipeline.set_state(gst::State::Null)?;
        
        info!("GStreamer pipeline stopped");
        Ok(())
    }
    
    pub async fn is_running(&self) -> bool {
        *self.is_running.lock().await
    }
    
    fn create_video_source(&self) -> Result<gst::Element> {
        #[cfg(target_os = "linux")]
        {
            // Use ximagesrc for X11 capture on Linux
            let source = gst::ElementFactory::make("ximagesrc").build()?;
            source.set_property("use-damage", false);
            source.set_property("show-pointer", self.config.capture.capture_cursor);
            
            if let Some(ref window_title) = self.config.capture.window_title {
                info!("Capturing window: {}", window_title);
                // TODO: Implement window ID lookup
            }
            
            Ok(source)
        }
        
        #[cfg(target_os = "windows")]
        {
            // Try d3d11screencapsrc first, fall back to dx9screencapsrc
            let source = gst::ElementFactory::make("d3d11screencapsrc")
                .build()
                .or_else(|_| {
                    warn!("d3d11screencapsrc not available, falling back to dx9screencapsrc");
                    gst::ElementFactory::make("dx9screencapsrc").build()
                })?;
            
            source.set_property("show-cursor", self.config.capture.capture_cursor);
            
            Ok(source)
        }
        
        #[cfg(not(any(target_os = "linux", target_os = "windows")))]
        {
            // Use test source for other platforms
            warn!("Using test video source for unsupported platform");
            let source = gst::ElementFactory::make("videotestsrc").build()?;
            source.set_property("pattern", "ball");
            Ok(source)
        }
    }
    
    fn setup_webrtc_callbacks(&self, webrtcbin: gst::Element) -> Result<()> {
        let host_mgr = self.host_mgr.clone();
        
        // Handle negotiation needed
        webrtcbin.connect("on-negotiation-needed", false, move |_values| {
            debug!("WebRTC negotiation needed");
            // This would trigger offer creation through the host session manager
            None
        });
        
        // Handle ICE candidates
        let host_mgr_ice = host_mgr.clone();
        webrtcbin.connect("on-ice-candidate", false, move |values| {
            let _candidate = values[1].get::<String>().expect("Invalid candidate");
            let _sdp_mline_index = values[2].get::<u32>().expect("Invalid mline index");
            debug!("Local ICE candidate generated");
            // This would be sent through the signaling channel
            None
        });
        
        Ok(())
    }
}