const WebSocket = require('ws');

// Signaling relay server that connects to SocketsBay with API key
const SOCKETSBAY_API_KEY = process.env.SOCKETSBAY_API_KEY || 'YOUR_API_KEY_HERE';
const SOCKETSBAY_URL = `wss://socketsbay.com/wss/v2/1/${SOCKETSBAY_API_KEY}/`;

const PORT = process.env.PORT || 3001;
const sessions = new Map();

console.log('🔐 GameShare Signaling Relay Server Starting...');
console.log(`📡 Local WebSocket server on port ${PORT}`);
console.log(`🌐 Relaying through SocketsBay`);

// Create local WebSocket server
const wss = new WebSocket.Server({ port: PORT });

// Handle local connections
wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`🔗 New local connection from ${clientIp}`);
    
    let sessionId = null;
    let socketsBayWs = null;
    
    // Connect to SocketsBay
    try {
        socketsBayWs = new WebSocket(SOCKETSBAY_URL);
        
        socketsBayWs.on('open', () => {
            console.log('✅ Connected to SocketsBay relay');
            ws.send(JSON.stringify({ type: 'relay-connected' }));
        });
        
        socketsBayWs.on('message', (data) => {
            // Forward messages from SocketsBay to local client
            ws.send(data);
        });
        
        socketsBayWs.on('error', (error) => {
            console.error('❌ SocketsBay error:', error);
            ws.send(JSON.stringify({ type: 'relay-error', error: error.message }));
        });
        
        socketsBayWs.on('close', () => {
            console.log('🔌 SocketsBay connection closed');
            ws.close();
        });
        
    } catch (error) {
        console.error('❌ Failed to connect to SocketsBay:', error);
        ws.send(JSON.stringify({ type: 'relay-error', error: error.message }));
        ws.close();
        return;
    }
    
    // Handle messages from local client
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            
            // Store session ID if this is a join message
            if (message.type === 'join') {
                sessionId = message.sessionId;
                console.log(`📝 Client joined session: ${sessionId}`);
            }
            
            // Forward all messages to SocketsBay
            if (socketsBayWs && socketsBayWs.readyState === WebSocket.OPEN) {
                socketsBayWs.send(data);
            }
            
        } catch (error) {
            console.error('❌ Error processing message:', error);
        }
    });
    
    ws.on('close', () => {
        console.log(`🔌 Local connection closed from ${clientIp}`);
        if (socketsBayWs) {
            socketsBayWs.close();
        }
    });
    
    ws.on('error', (error) => {
        console.error('❌ Local WebSocket error:', error);
        if (socketsBayWs) {
            socketsBayWs.close();
        }
    });
});

console.log(`\n🎯 Signaling Relay Server ready!`);
console.log(`📡 Local endpoint: ws://localhost:${PORT}`);
console.log(`🔑 Using SocketsBay API key: ${SOCKETSBAY_API_KEY.substring(0, 8)}...`);
console.log(`\n💡 To use this relay:`);
console.log(`   1. Set SOCKETSBAY_API_KEY environment variable`);
console.log(`   2. Connect to ws://localhost:${PORT}`);
console.log(`   3. Messages will be relayed through SocketsBay`);

// Keep the process alive
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing WebSocket server');
    wss.close(() => {
        console.log('WebSocket server closed');
        process.exit(0);
    });
});