# Next Steps to Complete GStreamer Integration

You're currently on Windows but trying to build for Linux (WSL). Here's what you need to do:

## On Your Linux System (WSL)

1. **Install GStreamer packages:**
   ```bash
   # Copy and run these commands on your Linux terminal
   chmod +x install_gstreamer.sh
   ./install_gstreamer.sh
   ```

2. **Build with GStreamer support:**
   ```bash
   # After installing GStreamer
   cargo build --release
   ```

3. **Run with GStreamer (replaces FFmpeg):**
   ```bash
   # This will use GStreamer instead of FFmpeg
   ./target/release/gameshare-host --use-gstreamer --window-title "xeyes"
   ```

## Key Changes Made

1. **Added GStreamer pipeline module** (`src/gstreamer_pipeline.rs`)
   - Cross-platform video capture (X11 on Linux, DirectX on Windows)
   - H.264 encoding with proper WebRTC settings
   - Direct WebRTC integration

2. **Updated main.rs**
   - Added `--use-gstreamer` command line flag
   - Supports both FFmpeg (Linux only) and GStreamer (cross-platform)
   - GStreamer is automatically used on non-Linux platforms

3. **Cross-platform support**
   - Windows: Uses DirectX screen capture
   - Linux: Uses X11 screen capture
   - macOS: Falls back to test source (can be extended)

## Testing the Implementation

Once GStreamer is installed on your Linux system:

```bash
# Test with xeyes window
./target/release/gameshare-host --use-gstreamer --window-title "xeyes" --framerate 30 --bitrate 5000

# Test with full desktop capture
./target/release/gameshare-host --use-gstreamer --framerate 30 --bitrate 5000
```

## Advantages of GStreamer over FFmpeg

1. **Native WebRTC support** - No need for complex NAL unit parsing
2. **Better latency** - Direct pipeline from capture to WebRTC
3. **Cross-platform** - Same code works on Windows, Linux, macOS
4. **Hardware acceleration** - Supports NVENC, VAAPI, etc.
5. **Cleaner architecture** - Single pipeline handles everything

## If GStreamer Installation Fails

The error you saw (`gstreamer-webrtc-1.0.pc not found`) means you need to install the development packages. The `install_gstreamer.sh` script will handle this, but if it fails, you can install manually:

```bash
# Core packages
sudo apt install libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev

# WebRTC support (most important)
sudo apt install libgstwebrtc-1.0-dev gstreamer1.0-nice

# Additional plugins
sudo apt install gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-x
```

## Troubleshooting

If you still get pkg-config errors after installation:

```bash
# Find where GStreamer installed its .pc files
find /usr -name "gstreamer-1.0.pc" 2>/dev/null

# Set PKG_CONFIG_PATH if needed
export PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig:$PKG_CONFIG_PATH
```