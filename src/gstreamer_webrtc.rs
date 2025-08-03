use anyhow::Result;
use gstreamer as gst;
use gstreamer::prelude::*;
use gstreamer_webrtc as gst_webrtc;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{debug, error, info};

pub struct GStreamerWebRTC {
    pipeline: gst::Pipeline,
    webrtcbin: gst::Element,
    frame_sender: tokio::sync::mpsc::Sender<Vec<u8>>,
}

impl GStreamerWebRTC {
    pub async fn new() -> Result<Self> {
        // Initialize GStreamer
        gst::init()?;

        // Create pipeline
        let pipeline = gst::Pipeline::new(Some("webrtc-pipeline"));

        // Create elements
        let ximagesrc = gst::ElementFactory::make("ximagesrc", Some("screen-source"))?;
        let videoconvert = gst::ElementFactory::make("videoconvert", Some("convert"))?;
        let videoscale = gst::ElementFactory::make("videoscale", Some("scale"))?;
        let capsfilter = gst::ElementFactory::make("capsfilter", Some("caps"))?;
        let x264enc = gst::ElementFactory::make("x264enc", Some("encoder"))?;
        let h264parse = gst::ElementFactory::make("h264parse", Some("parser"))?;
        let rtph264pay = gst::ElementFactory::make("rtph264pay", Some("payloader"))?;
        let webrtcbin = gst::ElementFactory::make("webrtcbin", Some("webrtc"))?;

        // Configure elements
        ximagesrc.set_property("use-damage", false);
        ximagesrc.set_property("show-pointer", true);

        // Set video caps for 1920x1080 @ 30fps
        let caps = gst::Caps::builder("video/x-raw")
            .field("width", 1920i32)
            .field("height", 1080i32)
            .field("framerate", gst::Fraction::new(30, 1))
            .build();
        capsfilter.set_property("caps", &caps);

        // Configure x264enc for low latency and regular keyframes
        x264enc.set_property("tune", "zerolatency");
        x264enc.set_property("speed-preset", "ultrafast");
        x264enc.set_property("key-int-max", 30u32); // Keyframe every second at 30fps
        x264enc.set_property("bitrate", 5000u32);
        x264enc.set_property("threads", 4u32);
        
        // Configure H264 parser
        h264parse.set_property("config-interval", -1i32); // Send SPS/PPS with every keyframe

        // Configure RTP payloader
        rtph264pay.set_property("config-interval", -1i32);
        rtph264pay.set_property("pt", 96u32);

        // Configure WebRTC bin
        webrtcbin.set_property("bundle-policy", gst_webrtc::WebRTCBundlePolicy::MaxBundle);

        // Add elements to pipeline
        pipeline.add_many(&[
            &ximagesrc,
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
            &ximagesrc,
            &videoconvert,
            &videoscale,
            &capsfilter,
            &x264enc,
            &h264parse,
            &rtph264pay,
        ])?;

        // Link to webrtcbin
        let rtp_caps = gst::Caps::builder("application/x-rtp")
            .field("media", "video")
            .field("encoding-name", "H264")
            .field("payload", 96i32)
            .build();
        rtph264pay.link_filtered(&webrtcbin, &rtp_caps)?;

        // Create a channel for frame output (if needed for monitoring)
        let (frame_sender, _frame_receiver) = tokio::sync::mpsc::channel(100);

        Ok(Self {
            pipeline,
            webrtcbin,
            frame_sender,
        })
    }

    pub async fn start(&self) -> Result<()> {
        info!("Starting GStreamer pipeline");
        self.pipeline.set_state(gst::State::Playing)?;
        Ok(())
    }

    pub async fn stop(&self) -> Result<()> {
        info!("Stopping GStreamer pipeline");
        self.pipeline.set_state(gst::State::Null)?;
        Ok(())
    }

    pub fn get_webrtcbin(&self) -> &gst::Element {
        &self.webrtcbin
    }

    pub async fn create_offer(&self) -> Result<gst_webrtc::WebRTCSessionDescription> {
        let promise = gst::Promise::new();
        self.webrtcbin.emit_by_name::<()>("create-offer", &[&None::<gst::Structure>, &promise]);
        
        let reply = promise.wait();
        let offer = reply
            .map(|s| s.get::<gst_webrtc::WebRTCSessionDescription>("offer"))
            .flatten()
            .ok_or_else(|| anyhow::anyhow!("Failed to create offer"))?;

        self.webrtcbin.emit_by_name::<()>("set-local-description", &[&offer]);
        
        Ok(offer)
    }

    pub async fn set_remote_description(&self, sdp: &str, sdp_type: gst_webrtc::WebRTCSDPType) -> Result<()> {
        let sdp_message = gst_sdp::SDPMessage::parse_buffer(sdp.as_bytes())?;
        let answer = gst_webrtc::WebRTCSessionDescription::new(sdp_type, sdp_message);
        
        self.webrtcbin.emit_by_name::<()>("set-remote-description", &[&answer]);
        
        Ok(())
    }

    pub async fn add_ice_candidate(&self, candidate: &str, sdp_mline_index: u32) -> Result<()> {
        self.webrtcbin.emit_by_name::<()>("add-ice-candidate", &[&sdp_mline_index, &candidate]);
        Ok(())
    }
}

// Alternative implementation using appsrc for more control
pub struct GStreamerWebRTCWithAppSrc {
    pipeline: gst::Pipeline,
    appsrc: gst_app::AppSrc,
    webrtcbin: gst::Element,
}

impl GStreamerWebRTCWithAppSrc {
    pub async fn new() -> Result<Self> {
        gst::init()?;

        let pipeline = gst::Pipeline::new(Some("webrtc-appsrc-pipeline"));

        // Create elements
        let appsrc = gst::ElementFactory::make("appsrc", Some("app-source"))?;
        let videoconvert = gst::ElementFactory::make("videoconvert", Some("convert"))?;
        let x264enc = gst::ElementFactory::make("x264enc", Some("encoder"))?;
        let h264parse = gst::ElementFactory::make("h264parse", Some("parser"))?;
        let rtph264pay = gst::ElementFactory::make("rtph264pay", Some("payloader"))?;
        let webrtcbin = gst::ElementFactory::make("webrtcbin", Some("webrtc"))?;

        // Configure appsrc
        let appsrc = appsrc.dynamic_cast::<gst_app::AppSrc>()
            .expect("Failed to cast to AppSrc");
        
        appsrc.set_caps(Some(
            &gst::Caps::builder("video/x-raw")
                .field("format", "BGRx")
                .field("width", 1920i32)
                .field("height", 1080i32)
                .field("framerate", gst::Fraction::new(30, 1))
                .build()
        ));
        appsrc.set_format(gst::Format::Time);
        appsrc.set_property("is-live", true);

        // Configure x264enc
        x264enc.set_property("tune", "zerolatency");
        x264enc.set_property("speed-preset", "ultrafast");
        x264enc.set_property("key-int-max", 30u32);
        x264enc.set_property("bitrate", 5000u32);
        x264enc.set_property("bframes", 0u32);
        x264enc.set_property("aud", false);
        x264enc.set_property("insert-vui", true);
        
        // Configure H264 parser to ensure SPS/PPS
        h264parse.set_property("config-interval", 1i32);

        // Configure RTP payloader
        rtph264pay.set_property("config-interval", 1i32);
        rtph264pay.set_property("pt", 96u32);

        // Add elements to pipeline
        let appsrc_element = appsrc.upcast_ref::<gst::Element>();
        pipeline.add_many(&[
            appsrc_element,
            &videoconvert,
            &x264enc,
            &h264parse,
            &rtph264pay,
            &webrtcbin,
        ])?;

        // Link elements
        gst::Element::link_many(&[
            appsrc_element,
            &videoconvert,
            &x264enc,
            &h264parse,
            &rtph264pay,
        ])?;

        // Link to webrtcbin with caps
        let rtp_caps = gst::Caps::builder("application/x-rtp")
            .field("media", "video")
            .field("encoding-name", "H264")
            .field("payload", 96i32)
            .field("profile-level-id", "42e01f")
            .field("packetization-mode", "1")
            .build();
        rtph264pay.link_filtered(&webrtcbin, &rtp_caps)?;

        Ok(Self {
            pipeline,
            appsrc,
            webrtcbin,
        })
    }

    pub fn push_frame(&self, frame_data: Vec<u8>) -> Result<()> {
        let mut buffer = gst::Buffer::from_slice(frame_data);
        let buffer_ref = buffer.get_mut().unwrap();
        
        // Set timestamp based on current pipeline time
        let clock = self.pipeline.clock();
        if let Some(clock) = clock {
            let base_time = self.pipeline.base_time();
            let running_time = clock.time().unwrap() - base_time.unwrap();
            buffer_ref.set_pts(running_time);
        }

        self.appsrc.push_buffer(buffer)?;
        Ok(())
    }

    pub async fn start(&self) -> Result<()> {
        self.pipeline.set_state(gst::State::Playing)?;
        Ok(())
    }

    pub fn get_webrtcbin(&self) -> &gst::Element {
        &self.webrtcbin
    }
}