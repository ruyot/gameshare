# GameShare Remote Client & Signaling Server

This directory contains the split-architecture components for GameShare, allowing the host to run locally while clients connect through a remote signaling server.

## Architecture

- **Local Host**: Runs `gameshare-host` with `--remote-signaling-url` pointing to the remote server
- **Remote Server**: Node.js Express server with WebSocket signaling
- **Remote Client**: Browser-based client that connects to the remote server

## Deployment

### Option 1: Deploy to Fly.io

1. Install Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
2. Login: `fly auth login`
3. Deploy:
   ```bash
   cd client/remote
   fly launch
   fly deploy
   ```

### Option 2: Deploy to Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Deploy:
   ```bash
   cd client/remote
   railway init
   railway up
   ```

### Option 3: Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy:
   ```bash
   cd client/remote
   vercel
   ```

## Usage

### Starting the Host

```bash
# Connect to remote signaling server
./gameshare-host --remote-signaling-url wss://your-server.com

# Or with a specific session ID
./gameshare-host --remote-signaling-url wss://your-server.com --session-id my-game-session
```

### Connecting Clients

Clients can connect by visiting:
```
https://your-server.com/?session=my-game-session&signaling=wss://your-server.com
```

Or simply:
```
https://your-server.com/?session=my-game-session
```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: 0.0.0.0)

## API Endpoints

- `GET /`: Main client page
- `GET /health`: Health check
- `GET /sessions`: List active sessions
- `WS /`: WebSocket signaling endpoint

## Development

```bash
cd client/remote
npm install
npm run dev
```

The server will be available at `http://localhost:3000`

## File Structure

```
client/remote/
├── index.html          # Minimal client page
├── client.js           # Remote client logic
├── server.js           # Express + WebSocket server
├── package.json        # Node.js dependencies
└── README.md          # This file
```

## Security Notes

- The signaling server is stateless and doesn't store sensitive data
- WebRTC connections are peer-to-peer and don't go through the server
- Consider adding authentication if needed for production use 