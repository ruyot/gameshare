# GStreamer Setup Guide for GameShare

This guide will help you set up GStreamer for GameShare on different platforms.

## Linux (Ubuntu/Debian)

Run the provided installation script:

```bash
chmod +x install_gstreamer.sh
./install_gstreamer.sh
```

Or install manually:

```bash
sudo apt update
sudo apt install -y \
    libgstreamer1.0-dev \
    libgstreamer-plugins-base1.0-dev \
    libgstreamer-plugins-bad1.0-dev \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-plugins-bad \
    gstreamer1.0-plugins-ugly \
    gstreamer1.0-libav \
    gstreamer1.0-tools \
    gstreamer1.0-nice \
    libgstwebrtc-1.0-0 \
    libgstwebrtc-1.0-dev \
    gstreamer1.0-pulseaudio \
    gstreamer1.0-x \
    gstreamer1.0-gl \
    gstreamer1.0-gtk3
```

## Windows

1. Download GStreamer from https://gstreamer.freedesktop.org/download/#windows
   - Download both runtime and development packages
   - Choose MSVC 64-bit version for compatibility

2. Install both packages to their default locations (usually `C:\gstreamer`)

3. Install pkg-config for Windows:
   - Download from http://ftp.gnome.org/pub/gnome/binaries/win32/dependencies/
   - Or use chocolatey: `choco install pkgconfiglite`

4. Set environment variables:
   ```powershell
   $env:PKG_CONFIG_PATH = "C:\gstreamer\1.0\msvc_x86_64\lib\pkgconfig"
   $env:PATH += ";C:\gstreamer\1.0\msvc_x86_64\bin"
   ```

5. Build GameShare:
   ```powershell
   .\build_windows.bat
   ```

## macOS

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install GStreamer
brew install gstreamer gst-plugins-base gst-plugins-good gst-plugins-bad gst-plugins-ugly gst-libav

# Install pkg-config
brew install pkg-config
```

## Building GameShare with GStreamer

Once GStreamer is installed, build GameShare with:

```bash
# Linux/macOS
cargo build --release

# Run with GStreamer
./target/release/gameshare-host --use-gstreamer --window-title "Your Game"
```

```powershell
# Windows
.\build_windows.bat

# Run with GStreamer
.\target\release\gameshare-host.exe --use-gstreamer --window-title "Your Game"
```

## Troubleshooting

### "pkg-config not found"
- Linux: `sudo apt install pkg-config`
- Windows: Install pkg-config-lite from chocolatey or download manually
- macOS: `brew install pkg-config`

### "gstreamer-webrtc-1.0.pc not found"
- Make sure you installed the development packages, not just runtime
- Check that PKG_CONFIG_PATH is set correctly
- On Windows, ensure you're using the MSVC version, not MinGW

### Build fails with linking errors
- On Windows, make sure you're using the MSVC toolchain: `rustup default stable-msvc`
- Ensure GStreamer bin directory is in your PATH

## Advantages of GStreamer over FFmpeg

1. **Native WebRTC support** - GStreamer has built-in WebRTC elements
2. **Cross-platform** - Works on Windows, Linux, and macOS
3. **Hardware acceleration** - Supports various hardware encoders
4. **Lower latency** - Designed for real-time streaming
5. **Better integration** - Direct pipeline to WebRTC without intermediate steps