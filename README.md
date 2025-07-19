# 🎮 GameShare Cloud Backend

A decentralized P2P cloud gaming platform that allows users to host their hardware for others to play games remotely. This is the Stage 1 Linux proof-of-concept implementation in Rust.

## 🌟 Features

### Host Agent
- **Screen Capture**: Captures specific game windows or full desktop using FFmpeg's x11grab
- **Hardware Encoding**: H.264 encoding with NVIDIA NVENC or x264 software fallback
- **WebRTC Streaming**: Low-latency video/audio streaming over WebRTC
- **Input Handling**: Receives and replays mouse/keyboard events via Linux uinput
- **Performance Monitoring**: Real-time FPS, bitrate, and memory usage tracking

### Web Client  
- **WebRTC Integration**: Connects to host via WebRTC with STUN/TURN support
- **Input Capture**: Captures and sends mouse/keyboard input to host
- **Performance Stats**: Real-time latency, bitrate, FPS, and packet loss monitoring
- **Responsive Design**: Modern, responsive web interface

## 🎯 Performance Targets

- **Latency**: ~100ms round-trip latency
- **Memory**: Sub-100MB agent footprint
- **Framerate**: Stable 30+ FPS streaming

## 🔧 Prerequisites

### System Requirements
- Linux with X11 display server
- FFmpeg with x11grab support
- For hardware encoding: NVIDIA GPU with NVENC support
- For input handling: Access to `/dev/uinput` (run with sudo or add user to input group)

### Development Dependencies
- Rust 1.70+ (2021 edition)
- Linux development packages:
  ```bash
  # Ubuntu/Debian
  sudo apt install build-essential pkg-config libssl-dev
  sudo apt install ffmpeg libavcodec-dev libavformat-dev libavutil-dev
  sudo apt install libudev-dev
  
  # For OpenCV (optional)
  sudo apt install libopencv-dev
  ```

## 🚀 Quick Start

### 1. Clone and Build
```bash
git clone <repository-url>
cd gameshare-cloud
cargo build --release
```

### 2. Configure uinput Permissions
```bash
# Option 1: Add user to input group (recommended)
sudo usermod -a -G input $USER
sudo udevadm control --reload-rules
# Log out and back in

# Option 2: Run with sudo (for testing)
sudo ./target/release/gameshare-host
```

### 3. Start Host Agent
```bash
# Basic usage - capture entire desktop
cargo run --release

# Capture specific game window
cargo run --release -- --window-title "SuperTuxKart"

# Or by process name
cargo run --release -- --process-name "supertuxkart"

# With custom settings
cargo run --release -- --resolution 1280x720 --framerate 60 --bitrate 8000
```

### 4. Connect with Web Client
1. Open `client/index.html` in a web browser
2. Enter signaling server URL: `ws://localhost:8080/signaling`
3. Enter session ID: `test-session` (or any shared ID)
4. Click "Connect"
5. Click on the video to capture mouse/keyboard input

## ⚙️ Configuration

Edit `config.toml` to customize settings:

```toml
[video]
target_framerate = 30
target_bitrate = 5000
width = 1920
height = 1080
use_nvenc = true

[capture]
window_title = "My Game"  # Specific window to capture
capture_cursor = true
capture_audio = true

[encoding]
preset = "ultrafast"  # x264 preset for software encoding
low_latency = true

[input]
mouse_sensitivity = 1.0
enable_keyboard = true
enable_mouse = true
```

## 🎮 Testing with SuperTuxKart

1. Install SuperTuxKart:
   ```bash
   sudo apt install supertuxkart
   ```

2. Start SuperTuxKart:
   ```bash
   supertuxkart
   ```

3. In another terminal, start GameShare:
   ```bash
   cargo run --release -- --process-name "supertuxkart"
   ```

4. Open the web client and connect
5. Test gameplay with mouse/keyboard input

## 📊 Performance Monitoring

The host agent provides real-time performance metrics:
- FPS and frame processing rate
- Memory usage (target: <100MB)
- Encoding performance (NVENC vs x264)
- WebRTC connection statistics

Access via logs or web client statistics panel.

## 🔍 Troubleshooting

### Common Issues

**Permission denied for /dev/uinput**
```bash
sudo chmod 666 /dev/uinput
# Or add user to input group (permanent solution)
```

**FFmpeg not found**
```bash
sudo apt install ffmpeg
```

**NVENC not available**
- Ensure NVIDIA GPU is present and drivers are installed
- Check `nvidia-smi` command works
- System will automatically fall back to x264 software encoding

**Window capture fails**
- Ensure the target application is running
- Try using process name instead of window title
- Check X11 display environment: `echo $DISPLAY`

### Debug Mode
```bash
cargo run --release -- --verbose
```

## 🛠️ Development

### Project Structure
```
src/
├── main.rs           # Entry point and main game loop
├── capture.rs        # FFmpeg screen capture
├── encoding.rs       # H.264 encoding (NVENC/x264)
├── streaming.rs      # WebRTC streaming
├── signaling.rs      # WebSocket signaling server
├── input.rs          # Linux uinput handling
├── config.rs         # Configuration management
└── error.rs          # Error types

client/
├── index.html        # Web client interface
└── client.js         # WebRTC client implementation
```

### Building for Different Targets
```bash
# Debug build
cargo build

# Release build (optimized)
cargo build --release

# With specific features
cargo build --features "nvenc"
cargo build --features "x264"
```

## 🚧 Roadmap

### Stage 1 (Current) - Linux Proof of Concept
- [x] Basic screen capture
- [x] H.264 encoding
- [x] WebRTC streaming
- [x] Input handling
- [x] Web client
- [ ] Performance optimization
- [ ] Testing with multiple games

### Stage 2 - Production Features
- [ ] Audio capture and streaming
- [ ] Multi-client support
- [ ] Session management
- [ ] Security hardening
- [ ] Docker containerization

### Stage 3 - Platform Expansion
- [ ] Windows support
- [ ] macOS support
- [ ] Mobile clients
- [ ] P2P discovery

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📧 Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review logs with `--verbose` flag