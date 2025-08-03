const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
const sessions = new Map();

console.log('🔐 GameShare Signaling Server Starting...');
console.log(`📡 WebSocket server will run on port ${PORT}`);

// Create WebSocket server that will work behind Fly.io's proxy
const wss = new WebSocket.Server({ 
    port: PORT,
    perMessageDeflate: false
});

wss.on('connection', (ws, req) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`🔗 New connection from ${clientIp}`);
    
    let sessionId = null;
    let clientType = null;

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            console.log(`📨 Received: ${message.type} from ${clientType || 'unknown'}`);

            switch (message.type) {
                case 'join':
                    sessionId = message.sessionId;
                    clientType = message.clientType;
                    
                    if (!sessions.has(sessionId)) {
                        sessions.set(sessionId, {
                            host: null,
                            clients: new Set(),
                            offers: [],
                            answers: [],
                            iceCandidates: []
                        });
                        console.log(`📝 Created session: ${sessionId}`);
                    }
                    
                    const session = sessions.get(sessionId);
                    if (clientType === 'host') {
                        session.host = ws;
                        console.log(`🎮 Host joined session: ${sessionId}`);
                        
                        // Send any pending offers to the host
                        session.offers.forEach(offer => {
                            ws.send(JSON.stringify(offer));
                        });
                    } else {
                        session.clients.add(ws);
                        console.log(`👤 Client joined session: ${sessionId}`);
                        
                        // Send any pending answers to the client
                        session.answers.forEach(answer => {
                            ws.send(JSON.stringify(answer));
                        });
                    }
                    
                    // Send confirmation
                    ws.send(JSON.stringify({
                        type: 'joined',
                        sessionId: sessionId,
                        clientType: clientType
                    }));
                    break;

                case 'offer':
                    if (sessionId && sessions.has(sessionId)) {
                        const session = sessions.get(sessionId);
                        session.offers.push(message);
                        
                        // Send to host if available
                        if (session.host && session.host.readyState === WebSocket.OPEN) {
                            session.host.send(JSON.stringify(message));
                            console.log(`📤 Sent offer to host in session: ${sessionId}`);
                        }
                    }
                    break;

                case 'answer':
                    if (sessionId && sessions.has(sessionId)) {
                        const session = sessions.get(sessionId);
                        session.answers.push(message);
                        
                        // Send to all clients
                        session.clients.forEach(client => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify(message));
                                console.log(`📤 Sent answer to client in session: ${sessionId}`);
                            }
                        });
                    }
                    break;

                case 'ice-candidate':
                    if (sessionId && sessions.has(sessionId)) {
                        const session = sessions.get(sessionId);
                        session.iceCandidates.push(message);
                        
                        // Forward to appropriate peer
                        if (message.target === 'host' && session.host && session.host.readyState === WebSocket.OPEN) {
                            session.host.send(JSON.stringify(message));
                        } else if (message.target === 'client') {
                            session.clients.forEach(client => {
                                if (client.readyState === WebSocket.OPEN) {
                                    client.send(JSON.stringify(message));
                                }
                            });
                        }
                    }
                    break;
            }
        } catch (error) {
            console.error('❌ Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log(`🔌 Connection closed from ${clientIp}`);
        
        if (sessionId && sessions.has(sessionId)) {
            const session = sessions.get(sessionId);
            
            if (clientType === 'host') {
                session.host = null;
                console.log(`🎮 Host left session: ${sessionId}`);
            } else {
                session.clients.delete(ws);
                console.log(`👤 Client left session: ${sessionId}`);
            }
            
            // Clean up empty sessions
            if (!session.host && session.clients.size === 0) {
                sessions.delete(sessionId);
                console.log(`🗑️ Cleaned up empty session: ${sessionId}`);
            }
        }
    });

    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
    });
});

console.log('🎯 GameShare Signaling Server ready!');
console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
console.log('💡 When deployed to Fly.io, it will be available at wss://your-app.fly.dev');

// Keep the process alive
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing WebSocket server');
    wss.close(() => {
        console.log('WebSocket server closed');
        process.exit(0);
    });
});