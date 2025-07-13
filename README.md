# Inital baseline gameshare streaming

A simple game streaming solution that lets you stream games from your Windows PC using WebRTC.

## Quick Start

### Prerequisites
- **Windows PC (Host)**: Rust, Node.js, Electron
- **Mac (Client)**: Modern web browser
- **Network**: Both devices on same network (or internet connection)

### Step 1: Start the Signaling Server (Windows)

Open a terminal and run:
```bash
cd signaling
npm install
node index.js
```

You should see: `Signaling server listening on port 4000`

### Step 2: Build the Rust Streamer (Windows)

In a new terminal:
```bash
cd host_streamer
cargo build --release
```

### Step 3: Launch the Host UI (Windows)

In another terminal:
```bash
cd host-demo-electron
npm install
npm start
```

### Step 4: Start Streaming (Windows)

1. Click "Start Streaming" in the Electron window
2. Copy the `OFFER:<json>` that appears in the logs
3. The offer will also appear in a copyable box

### Step 5: Connect from Mac

1. Open `client.html` in your Mac's web browser
2. Paste the OFFER from Windows into the text area
3. Click "Connect to Stream"
4. You should see the stream appear in the video element

## 📁 Project Structure

```
gameshare/
├── host_streamer/          # Rust WebRTC streamer
│   ├── Cargo.toml
│   └── src/main.rs
├── signaling/              # Node.js signaling server
│   ├── package.json
│   └── index.js
├── host-demo-electron/     # Electron host UI
│   ├── package.json
│   ├── main.js
│   └── index.html
├── client.html             # Mac client (open in browser)
└── README.md
```

## 🔧 How It Works

1. **Signaling Server**: Handles WebRTC offer/answer exchange between Windows and Mac
2. **Rust Streamer**: Captures screen/game and creates WebRTC video stream
3. **Electron Host**: Provides a nice UI to control the streamer
4. **Web Client**: Receives and displays the stream on Mac

## Current Features

- ✅ WebRTC video streaming
- ✅ Cross-platform (Windows → Mac)
- ✅ Simple setup process
- ✅ Real-time connection status
- ✅ Copy-paste offer/answer exchange

## Limitations & Future Improvements

- **Current**: Simulated video frames (placeholder)
- **Future**: Real screen capture integration
- **Future**: Audio streaming
- **Future**: Input forwarding (keyboard/mouse)
- **Future**: Better video codecs and quality settings

## Troubleshooting

### Common Issues

**"Binary not found" error:**
- Make sure you ran `cargo build --release` in the `host_streamer` directory

**Connection fails:**
- Ensure both devices are on the same network
- Check that the signaling server is running on port 4000
- Try refreshing the client page

**No video appears:**
- This is expected in the current version (simulated frames)
- Check the browser console for any errors

### Port Conflicts

If port 4000 is in use, edit `signaling/index.js` and change:
```javascript
server.listen(4000, () => console.log('Signaling server listening on port 4000'));
```

## Streaming games

To stream games:

1. Start the game on Windows
2. Follow the setup steps above
3. The stream will capture your entire screen (or game window in future versions)
4. Play the game normally on Windows
5. View the stream on your Mac

## Development Notes

This is a proof-of-concept implementation. For production use, consider:

- Real screen capture using Windows APIs
- Better video encoding (H.264, VP9)
- Audio streaming
- Input forwarding
- Security improvements
- Better error handling
---
