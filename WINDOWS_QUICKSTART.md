# GameShare Windows Quick Start Guide

This guide helps you get GameShare running on Windows WITHOUT needing GStreamer, FFmpeg, or any complex installations.

## Simple Browser-Based Solution

We've created a WebRTC-based screen sharing solution that works directly in your browser!

### Step 1: Start the Web Server

The server is already running on http://localhost:8080

If you need to restart it:
```powershell
python -m http.server 8080
```

### Step 2: Open GameShare in Browser

1. Open your browser and go to: http://localhost:8080
2. You'll see the GameShare main page with two options:
   - **Start as Host** - Share your screen
   - **Join as Client** - View someone's shared screen

### Step 3: Share Your Screen (Host)

1. Click "Start as Host"
2. Click "Start Screen Share"
3. Select what you want to share (entire screen, window, or tab)
4. Your screen is now being shared!

### Step 4: View Shared Screen (Client)

1. Open another browser tab or use another device
2. Go to http://localhost:8080 
3. Click "Join as Client"
4. Click "Connect" (uses default session ID)
5. You'll see the shared screen!

## How It Works

- Uses WebRTC for peer-to-peer connection
- No server-side processing needed
- Works entirely in the browser
- Low latency, high quality streaming

## Connecting from Other Devices

To connect from another device on your network:

1. Find your computer's IP address:
   ```powershell
   ipconfig
   ```
   Look for your IPv4 Address (e.g., 192.168.1.100)

2. On the other device, open browser and go to:
   ```
   http://YOUR_IP_ADDRESS:8080
   ```

## Advantages Over FFmpeg/GStreamer

1. **No Installation Required** - Works in any modern browser
2. **Cross-Platform** - Same code works on Windows, Mac, Linux
3. **Simple** - No complex dependencies or build processes
4. **Direct P2P** - Lower latency than server-based solutions

## Using the Original Rust Application

If you still want to use the Rust application with GStreamer:

1. Install GStreamer from: https://gstreamer.freedesktop.org/download/#windows
2. Install pkg-config (via Chocolatey: `choco install pkgconfiglite`)
3. Set environment variables:
   ```powershell
   $env:PKG_CONFIG_PATH = "C:\gstreamer\1.0\msvc_x86_64\lib\pkgconfig"
   ```
4. Build the Rust app:
   ```powershell
   cargo build --release
   ```
5. Run with GStreamer flag:
   ```powershell
   .\target\release\gameshare-host.exe --use-gstreamer
   ```

But honestly, the browser-based solution is much simpler for Windows!

## Troubleshooting

### Port 8080 Already in Use
```powershell
# Use a different port
python -m http.server 8081
```

### Can't Access from Other Devices
- Check Windows Firewall settings
- Make sure devices are on the same network
- Try disabling Windows Defender Firewall temporarily

### Browser Doesn't Support WebRTC
- Use Chrome, Firefox, or Edge (all modern versions support WebRTC)
- Safari may have issues with screen sharing

## Next Steps

- Customize the session ID for private sessions
- Add password protection (modify the HTML files)
- Deploy to a public server for internet-wide access