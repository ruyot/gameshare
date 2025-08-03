# GameShare Remote Gaming Setup

This guide will help you set up GameShare for remote gaming, where someone can play games running on your Windows PC from anywhere!

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start GameShare

Double-click `start_gaming.bat` or run:
```bash
start_gaming.bat
```

This will:
- Start the Input Bridge (for keyboard/mouse control)
- Start the Web Server
- Open GameShare in your browser

### 3. Share a Game (Host)

1. Open http://localhost:8080 in your browser
2. Click "🎮 Gaming Host"
3. Start your game in **WINDOWED MODE** (important!)
4. Click "Start Game Sharing"
5. Select your game window
6. Share the session ID with your friend

### 4. Play Remotely (Client)

1. Open http://localhost:8080 (or http://HOST_IP:8080 from another device)
2. Click "🕹️ Gaming Client"
3. Enter the session ID
4. Click "Connect to Game"
5. Click on the video to capture mouse/keyboard
6. Play the game!

## How It Works

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Game Host  │────▶│   Browser    │────▶│   Client    │
│  (Windows)  │     │   (WebRTC)   │     │  (Browser)  │
└─────────────┘     └──────────────┘     └─────────────┘
       ▲                                         │
       │            ┌──────────────┐             │
       └────────────│ Input Bridge │◀────────────┘
                    │   (Python)   │
                    └──────────────┘
```

1. **Host** shares their game window through WebRTC
2. **Client** views the game stream in their browser
3. **Client** sends keyboard/mouse input through WebRTC
4. **Input Bridge** receives input and simulates it on the host PC

## Supported Games

Works best with games that:
- Can run in windowed mode
- Don't use anti-cheat (may block input simulation)
- Support keyboard/mouse controls

Tested with:
- TuxKart
- Minecraft
- Among Us
- Indie games
- Emulators

## Controls

### For Players (Client)
- **Click video** - Capture mouse (like fullscreen games)
- **ESC** - Release mouse
- **All keys** - Forwarded to the game
- **F11** - Toggle fullscreen

### Latency Tips

For best performance:
1. Use wired connection (both host and client)
2. Close unnecessary programs
3. Lower game graphics settings
4. Reduce resolution if needed

## Network Setup

### Local Network (LAN)
- Find your IP: Run `ipconfig` 
- Share: `http://YOUR_IP:8080`

### Over Internet
1. Port forward 8080 on your router
2. Use your public IP
3. Or use the Fly.io signaling server (built-in)

## Troubleshooting

### "Input bridge not connected"
- Make sure `input_bridge.py` is running
- Check if Python is installed: `python --version`
- Install dependencies: `pip install -r requirements.txt`

### High latency
- Check your internet connection
- Try lowering the game resolution
- Ensure no background downloads

### Can't control the game
- Make sure game is in WINDOWED mode
- Click the video to capture mouse
- Some games may block simulated input

### Browser compatibility
- Chrome/Edge: Best support
- Firefox: Good support
- Safari: Limited support

## Security Notes

- Only share session IDs with trusted people
- The input bridge only accepts local connections by default
- WebRTC connections are encrypted

## Advanced Configuration

### Custom STUN/TURN servers
Edit the `rtcConfig` in the HTML files to use your own servers.

### Different ports
- Web server: Change 8080 in `start_gaming.bat`
- Input bridge: Change 8765 in `input_bridge.py`

### Headless mode
You can run the host without opening the browser:
1. Start `input_bridge.py` manually
2. Use the WebRTC API directly

## Known Limitations

1. **Windows Only** - Input simulation currently requires Windows
2. **No Audio** - Audio capture requires additional setup
3. **No Controller** - Currently keyboard/mouse only
4. **UAC Prompts** - Can't interact with admin dialogs

## Future Improvements

- [ ] Linux/Mac input bridge support
- [ ] Gamepad/controller support  
- [ ] Audio streaming
- [ ] Multi-monitor support
- [ ] Touch input for mobile
- [ ] Recording/replay features