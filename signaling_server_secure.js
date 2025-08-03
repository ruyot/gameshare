const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Create self-signed certificate for development
const { execSync } = require('child_process');
const certPath = path.join(__dirname, 'cert');

// Generate self-signed certificate if it doesn't exist
if (!fs.existsSync(certPath)) {
    console.log('Generating self-signed certificate for development...');
    try {
        execSync(`openssl req -x509 -newkey rsa:4096 -keyout ${certPath}/key.pem -out ${certPath}/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`, { stdio: 'inherit' });
    } catch (error) {
        console.log('OpenSSL not available, creating dummy certificate...');
        // Create dummy certificate files
        if (!fs.existsSync(certPath)) {
            fs.mkdirSync(certPath);
        }
        fs.writeFileSync(path.join(certPath, 'cert.pem'), '-----BEGIN CERTIFICATE-----\nDUMMY\n-----END CERTIFICATE-----');
        fs.writeFileSync(path.join(certPath, 'key.pem'), '-----BEGIN PRIVATE KEY-----\nDUMMY\n-----END PRIVATE KEY-----');
    }
}

const serverOptions = {
    cert: fs.readFileSync(path.join(certPath, 'cert.pem')),
    key: fs.readFileSync(path.join(certPath, 'key.pem'))
};

const httpsServer = https.createServer(serverOptions);
const wss = new WebSocket.Server({ server: httpsServer });

const sessions = new Map();

console.log('🔐 Secure GameShare Signaling Server Starting...');
console.log('📡 WebSocket Secure (WSS) server will run on port 3001');
console.log('📡 WebSocket (WS) server will run on port 3000');

// Create regular WS server for local connections
const wsServer = new WebSocket.Server({ port: 3000 });

// Handle both secure and non-secure connections
function handleConnection(ws, req) {
    const clientIp = req.socket.remoteAddress;
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
}

// Handle secure connections
wss.on('connection', handleConnection);

// Handle regular connections
wsServer.on('connection', handleConnection);

// Start both servers
httpsServer.listen(3001, () => {
    console.log('🔐 Secure WSS server running on port 3001');
    console.log('⚠️  Note: You may need to accept the self-signed certificate in your browser');
});

wsServer.on('listening', () => {
    console.log('📡 Regular WS server running on port 3000');
    console.log('🎯 Ready for GameShare connections!');
});

console.log('\n📋 Connection URLs:');
console.log('   Local (WS): ws://localhost:3000');
console.log('   Local (WSS): wss://localhost:3001');
console.log('   Network (WS): ws://10.0.0.105:3000');
console.log('   Network (WSS): wss://10.0.0.105:3001');
console.log('\n💡 For HTTPS pages, use WSS URLs');
console.log('💡 For HTTP pages, use WS URLs'); 