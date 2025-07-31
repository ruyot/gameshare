# GameShare Client Components

This repository contains the client-side components for GameShare, a decentralized P2P cloud gaming platform. The backend WebRTC implementation is maintained in a separate repository.

## Components

### Local Client (`client/`)
The original GameShare client that connects to a local signaling server.

- **`index.html`**: Full-featured web interface with connection controls, performance stats, and game input handling
- **`client.js`**: WebRTC client implementation with input event handling and performance monitoring

### Remote Client (`client/remote/`)
Split-architecture client and signaling server for production deployments.

- **`index.html`**: Minimal client page for remote connections
- **`client.js`**: Remote client that connects to external signaling servers
- **`server.js`**: Express.js + WebSocket signaling server
- **`package.json`**: Node.js dependencies for the remote server
- **`README.md`**: Deployment and usage instructions

## Quick Start

### Local Development

1. **Start the remote signaling server:**
   ```bash
   cd client/remote
   npm install
   npm start
   ```

2. **Connect to the server:**
   - Open `http://localhost:3000` in your browser
   - The client will automatically connect to the local signaling server

### Deployment

The remote client can be deployed to various cloud platforms:

```bash
cd client/remote

# Deploy to Fly.io
fly launch
fly deploy

# Deploy to Railway
railway init
railway up

# Deploy to Vercel
vercel
```

## Architecture

- **Local Client**: Full-featured interface for development and testing
- **Remote Client**: Minimal interface for production deployments
- **Remote Server**: Node.js signaling server for WebRTC coordination

## File Structure

```
client/
├── index.html          # Local client interface
├── client.js           # Local client logic
└── remote/             # Remote client components
    ├── index.html      # Remote client interface
    ├── client.js       # Remote client logic
    ├── server.js       # Signaling server
    ├── package.json    # Dependencies
    ├── README.md       # Documentation
    ├── deploy.sh       # Linux deployment script
    └── deploy.bat      # Windows deployment script
```

## Usage

### Local Development
```bash
# Start remote signaling server
cd client/remote
npm start

# Access client
open http://localhost:3000
```

### Production Deployment
1. Deploy the remote server to your preferred platform
2. Share the URL with users: `https://your-server.com/?session=game-session`
3. Users can connect directly without any setup

## Features

- **WebRTC Integration**: Direct peer-to-peer connections
- **Input Handling**: Mouse and keyboard event capture
- **Performance Monitoring**: Real-time stats display
- **Responsive Design**: Works on desktop and mobile
- **Cross-Platform**: Deployable to any cloud platform

## Security

- WebRTC connections are peer-to-peer and don't go through the server
- The signaling server only coordinates connection establishment
- No sensitive data is stored on the server

