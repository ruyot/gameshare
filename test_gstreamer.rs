// Simple test program to verify GStreamer installation
// Compile with: rustc test_gstreamer.rs $(pkg-config --cflags --libs gstreamer-1.0)

use std::process::Command;

fn main() {
    println!("Testing GStreamer installation...\n");

    // Test 1: Check if GStreamer is available via pkg-config
    print!("1. Checking pkg-config... ");
    match Command::new("pkg-config")
        .args(&["--modversion", "gstreamer-1.0"])
        .output()
    {
        Ok(output) => {
            if output.status.success() {
                let version = String::from_utf8_lossy(&output.stdout);
                println!("✓ GStreamer version: {}", version.trim());
            } else {
                println!("✗ GStreamer not found via pkg-config");
                println!("   Error: {}", String::from_utf8_lossy(&output.stderr));
            }
        }
        Err(e) => {
            println!("✗ pkg-config not found: {}", e);
            println!("   Please install pkg-config first");
        }
    }

    // Test 2: Check for WebRTC plugin
    print!("2. Checking gstreamer-webrtc-1.0... ");
    match Command::new("pkg-config")
        .args(&["--modversion", "gstreamer-webrtc-1.0"])
        .output()
    {
        Ok(output) => {
            if output.status.success() {
                let version = String::from_utf8_lossy(&output.stdout);
                println!("✓ GStreamer WebRTC version: {}", version.trim());
            } else {
                println!("✗ GStreamer WebRTC not found");
                println!("   Please install gstreamer webrtc development packages");
            }
        }
        Err(e) => {
            println!("✗ Failed to check: {}", e);
        }
    }

    // Test 3: Check if gst-launch-1.0 is available
    print!("3. Checking gst-launch-1.0... ");
    match Command::new("gst-launch-1.0").arg("--version").output() {
        Ok(output) => {
            if output.status.success() {
                println!("✓ gst-launch-1.0 is available");
            } else {
                println!("✗ gst-launch-1.0 not found in PATH");
            }
        }
        Err(_) => {
            println!("✗ gst-launch-1.0 not found");
            println!("   Please add GStreamer bin directory to PATH");
        }
    }

    // Test 4: List important plugins
    println!("\n4. Checking important plugins:");
    let plugins = vec![
        ("videotestsrc", "Core video test source"),
        ("x264enc", "H.264 software encoder"),
        ("webrtcbin", "WebRTC element"),
        ("ximagesrc", "X11 screen capture (Linux)"),
        ("d3d11screencapturesrc", "DirectX 11 capture (Windows)"),
        ("dx9screencapsrc", "DirectX 9 capture (Windows)"),
    ];

    for (plugin, desc) in plugins {
        print!("   - {} ({}): ", plugin, desc);
        match Command::new("gst-inspect-1.0")
            .arg(plugin)
            .output()
        {
            Ok(output) => {
                if output.status.success() {
                    println!("✓");
                } else {
                    println!("✗ Not found");
                }
            }
            Err(_) => {
                println!("✗ gst-inspect-1.0 not available");
                break;
            }
        }
    }

    println!("\n5. PKG_CONFIG_PATH: {:?}", std::env::var("PKG_CONFIG_PATH"));
    
    // Platform-specific checks
    #[cfg(target_os = "windows")]
    {
        println!("\n6. Windows-specific checks:");
        println!("   - GStreamer default location: C:\\gstreamer\\1.0\\msvc_x86_64");
        if std::path::Path::new("C:\\gstreamer\\1.0\\msvc_x86_64").exists() {
            println!("   ✓ Found GStreamer at default location");
        } else {
            println!("   ✗ GStreamer not found at default location");
        }
    }

    println!("\nIf any checks failed, please refer to GSTREAMER_SETUP.md for installation instructions.");
}