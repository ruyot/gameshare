const WebSocket = require('ws');
const http = require('http');

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active sessions
const sessions = new Map();

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
    // Extract session ID from query string
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('session') || 'default-session';
    
    console.log(`New connection for session: ${sessionId}`);
    
    // Initialize connection state
    let clientInfo = {
        ws: ws,
        sessionId: sessionId,
        role: null,
        id: generateId()
    };
    
    // Handle messages
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            console.log(`Message from ${clientInfo.id}:`, message.type);
            
            switch (message.type) {
                case 'join':
                    handleJoin(clientInfo, message);
                    break;
                    
                case 'offer':
                case 'answer':
                case 'ice_candidate':
                    relayMessage(clientInfo, message);
                    break;
                    
                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });
    
    // Handle disconnection
    ws.on('close', () => {
        console.log(`Client ${clientInfo.id} disconnected`);
        handleDisconnect(clientInfo);
    });
    
    // Handle errors
    ws.on('error', (error) => {
        console.error(`WebSocket error for ${clientInfo.id}:`, error);
    });
});

// Handle join message
function handleJoin(clientInfo, message) {
    clientInfo.role = message.role;
    
    // Get or create session
    let session = sessions.get(clientInfo.sessionId);
    if (!session) {
        session = {
            host: null,
            clients: new Set()
        };
        sessions.set(clientInfo.sessionId, session);
    }
    
    // Add to session based on role
    if (message.role === 'host') {
        if (session.host) {
            // Replace existing host
            if (session.host.ws.readyState === WebSocket.OPEN) {
                session.host.ws.send(JSON.stringify({
                    type: 'error',
                    error: 'New host connected'
                }));
                session.host.ws.close();
            }
        }
        session.host = clientInfo;
        
        // Send success message
        clientInfo.ws.send(JSON.stringify({
            type: 'joined',
            role: 'host',
            sessionId: clientInfo.sessionId
        }));
        
        console.log(`Host joined session ${clientInfo.sessionId}`);
        
    } else if (message.role === 'client') {
        session.clients.add(clientInfo);
        
        // Send success message
        clientInfo.ws.send(JSON.stringify({
            type: 'joined',
            role: 'client',
            sessionId: clientInfo.sessionId
        }));
        
        console.log(`Client joined session ${clientInfo.sessionId}`);
        
        // Notify host if available
        if (session.host && session.host.ws.readyState === WebSocket.OPEN) {
            session.host.ws.send(JSON.stringify({
                type: 'client_joined',
                clientId: clientInfo.id
            }));
        }
    }
}

// Relay message between peers
function relayMessage(sender, message) {
    const session = sessions.get(sender.sessionId);
    if (!session) {
        console.error('Session not found:', sender.sessionId);
        return;
    }
    
    // Determine target
    let target = null;
    if (sender.role === 'host' && message.target === 'client') {
        // Host sending to client
        for (const client of session.clients) {
            if (client.ws.readyState === WebSocket.OPEN) {
                target = client;
                break;
            }
        }
    } else if (sender.role === 'client' && message.target === 'host') {
        // Client sending to host
        target = session.host;
    }
    
    // Send message
    if (target && target.ws.readyState === WebSocket.OPEN) {
        target.ws.send(JSON.stringify(message));
        console.log(`Relayed ${message.type} from ${sender.role} to ${target.role}`);
    } else {
        console.error('Target not available');
        sender.ws.send(JSON.stringify({
            type: 'error',
            error: 'Target peer not available'
        }));
    }
}

// Handle disconnection
function handleDisconnect(clientInfo) {
    const session = sessions.get(clientInfo.sessionId);
    if (!session) return;
    
    if (clientInfo.role === 'host') {
        // Host disconnected
        session.host = null;
        
        // Notify all clients
        for (const client of session.clients) {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify({
                    type: 'host_left'
                }));
            }
        }
        
        // Clean up empty session
        if (session.clients.size === 0) {
            sessions.delete(clientInfo.sessionId);
        }
        
    } else if (clientInfo.role === 'client') {
        // Client disconnected
        session.clients.delete(clientInfo);
        
        // Notify host
        if (session.host && session.host.ws.readyState === WebSocket.OPEN) {
            session.host.ws.send(JSON.stringify({
                type: 'client_left',
                clientId: clientInfo.id
            }));
        }
        
        // Clean up empty session
        if (!session.host && session.clients.size === 0) {
            sessions.delete(clientInfo.sessionId);
        }
    }
}

// Generate unique ID
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Signaling server running on port ${PORT}`);
    console.log(`WebSocket endpoint: ws://localhost:${PORT}/signaling`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    wss.close(() => {
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
});