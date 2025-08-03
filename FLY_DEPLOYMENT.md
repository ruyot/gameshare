# Deploying GameShare to Fly.io

This will deploy the GameShare web interface to Fly.io, making it accessible from anywhere without local network issues.

## Prerequisites

1. Install Fly CLI:
```bash
# On Windows (PowerShell as Admin)
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# On Mac
brew install flyctl

# Or download from https://fly.io/docs/hands-on/install-flyctl/
```

2. Login to Fly.io:
```bash
fly auth login
```

## Deploy Steps

1. **Initialize the app** (first time only):
```bash
fly launch --name gameshare-web --region ord --no-deploy
```
When prompted:
- Would you like to set up a PostgreSQL database? **No**
- Would you like to set up an Upstash Redis database? **No**

2. **Deploy the app**:
```bash
fly deploy
```

3. **Get your app URL**:
```bash
fly status
# Look for: https://gameshare-web.fly.dev
```

## How to Use After Deployment

### On Windows (Host - with the game):
1. Keep running the input bridge locally:
   ```
   python input_bridge_direct.py
   ```
2. Open: https://gameshare-web.fly.dev
3. Click "🎮 Gaming Host"
4. Start your game and share

### On Mac (Client - playing remotely):
1. Open: https://gameshare-web.fly.dev
2. Click "🕹️ Gaming Client"
3. Enter session ID and play!

## Benefits of Fly.io Deployment

✅ **No firewall issues** - Works through any network
✅ **No IP Helper overhead** - Web server runs on Fly.io
✅ **Global access** - Play from anywhere
✅ **Free tier** - 3 shared VMs included
✅ **Auto SSL** - HTTPS automatically configured

## Architecture

```
[Windows PC]                    [Fly.io Cloud]                [Mac/Any Device]
Game + Input Bridge <--WebRTC--> Web Interface <--WebRTC--> Browser Client
     (Local)                    (gameshare-web)               (Remote)
```

## Important Notes

1. The input bridge still needs to run locally on the Windows host
2. The Fly.io app just serves the web interface
3. WebRTC creates a direct peer-to-peer connection between host and client
4. No game data goes through Fly.io servers (only signaling)

## Updating the App

To update after making changes:
```bash
fly deploy
```

## Monitoring

View logs:
```bash
fly logs
```

Check status:
```bash
fly status
```

## Custom Domain (Optional)

To use your own domain:
```bash
fly certs add yourdomain.com
```