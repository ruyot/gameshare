class GameShareClient {
    constructor() {
        this.ws = null;
        this.pc = null;
        this.dataChannel = null;
        this.sessionId = null;
        this.connected = false;
        this.stats = {
            latency: 0,
            bitrate: 0,
            fps: 0,
            packetLoss: 0
        };
        
        this.frameCount = 0;
        this.lastStatsTime = Date.now();
        this.lastFrameTime = Date.now();
        
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        // Video element events
        const video = document.getElementById('gameVideo');
        video.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded');
            this.requestPointerLock();
        });

        video.addEventListener('loadeddata', () => {
            console.log('Video data loaded');
            document.getElementById('videoOverlay').classList.add('hidden');
            video.style.display = 'block';
        });

        // Input event listeners
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        document.addEventListener('wheel', (e) => this.handleMouseWheel(e), { passive: false });
        
        // Pointer lock events
        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === video) {
                console.log('Pointer locked to video');
            } else {
                console.log('Pointer lock released');
            }
        });
    }

    async connect() {
        const signalingUrl = document.getElementById('signalingUrl').value;
        const sessionId = document.getElementById('sessionId').value;

        if (!signalingUrl || !sessionId) {
            alert('Please enter both signaling URL and session ID');
            return;
        }

        this.sessionId = sessionId;
        this.updateStatus('connecting', 'Connecting...');

        try {
            // Connect to signaling server
            this.ws = new WebSocket(signalingUrl);
            this.ws.onopen = () => this.onSignalingConnected();
            this.ws.onmessage = (event) => this.onSignalingMessage(event);
            this.ws.onerror = (error) => this.onSignalingError(error);
            this.ws.onclose = () => this.onSignalingClosed();

        } catch (error) {
            console.error('Connection failed:', error);
            this.updateStatus('disconnected', 'Connection failed');
            alert('Failed to connect: ' + error.message);
        }
    }

    disconnect() {
        this.connected = false;
        this.updateStatus('disconnected', 'Disconnecting...');

        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }

        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        // Reset video
        const video = document.getElementById('gameVideo');
        video.style.display = 'none';
        video.srcObject = null;
        document.getElementById('videoOverlay').classList.remove('hidden');

        this.updateStatus('disconnected', 'Disconnected');
        this.updateUI();
    }

    async onSignalingConnected() {
        console.log('Connected to signaling server');
        
        // Join session as client
        const joinMessage = {
            type: 'join',
            session_id: this.sessionId,
            client_type: 'client'
        };
        
        this.ws.send(JSON.stringify(joinMessage));
        await this.setupPeerConnection();
    }

    async onSignalingMessage(event) {
        const message = JSON.parse(event.data);
        console.log('Received signaling message:', message.type);

        switch (message.type) {
            case 'offer':
                await this.handleOffer(message);
                break;
            case 'ice-candidate':
                await this.handleIceCandidate(message);
                break;
            case 'error':
                console.error('Signaling error:', message.message);
                alert('Signaling error: ' + message.message);
                break;
            default:
                console.log('Unknown message type:', message.type);
        }
    }

    onSignalingError(error) {
        console.error('Signaling error:', error);
        this.updateStatus('disconnected', 'Signaling error');
    }

    onSignalingClosed() {
        console.log('Signaling connection closed');
        if (this.connected) {
            this.updateStatus('disconnected', 'Signaling disconnected');
        }
    }

    async setupPeerConnection() {
        // Create peer connection with STUN and TURN servers
        this.pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { 
                    urls: ['turn:global.relay.metered.ca:80', 'turn:global.relay.metered.ca:443?transport=tcp'],
                    username: 'f5e9b6f5df726ad6e7f4e8e9',
                    credential: 'Gk4EhT4xJCdXgY8p'
                }
            ]
        });

        // Handle incoming tracks (video/audio)
        this.pc.ontrack = (event) => {
            console.log('Received track:', event.track.kind);
            if (event.track.kind === 'video') {
                const video = document.getElementById('gameVideo');
                video.srcObject = event.streams[0];
            }
        };

        // Handle data channel from host
        this.pc.ondatachannel = (event) => {
            console.log('Received data channel');
            this.dataChannel = event.channel;
            this.setupDataChannel();
        };

        // Handle ICE candidates
        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                const candidateMessage = {
                    type: 'ice-candidate',
                    candidate: event.candidate.candidate,
                    sdp_mid: event.candidate.sdpMid,
                    sdp_mline_index: event.candidate.sdpMLineIndex,
                    session_id: this.sessionId
                };
                this.ws.send(JSON.stringify(candidateMessage));
            }
        };

        // Handle connection state changes
        this.pc.onconnectionstatechange = () => {
            console.log('Connection state:', this.pc.connectionState);
            switch (this.pc.connectionState) {
                case 'connected':
                    this.connected = true;
                    this.updateStatus('connected', 'Connected');
                    this.startStatsCollection();
                    break;
                case 'disconnected':
                case 'failed':
                case 'closed':
                    this.connected = false;
                    this.updateStatus('disconnected', 'Disconnected');
                    break;
            }
        };

        // Handle ICE connection state changes
        this.pc.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', this.pc.iceConnectionState);
        };
    }

    setupDataChannel() {
        this.dataChannel.onopen = () => {
            console.log('Data channel opened');
        };

        this.dataChannel.onclose = () => {
            console.log('Data channel closed');
        };

        this.dataChannel.onerror = (error) => {
            console.error('Data channel error:', error);
        };
    }

    async handleOffer(message) {
        console.log('Handling offer');
        
        try {
            await this.pc.setRemoteDescription({
                type: 'offer',
                sdp: message.sdp
            });
            console.log('Set remote description (offer) successfully');

            const answer = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answer);
            console.log('Created and set local description (answer) successfully');

            const answerMessage = {
                type: 'answer',
                sdp: answer.sdp,
                session_id: this.sessionId
            };

            this.ws.send(JSON.stringify(answerMessage));
            console.log('Sent answer to host');
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }

    async handleIceCandidate(message) {
        console.log('Handling ICE candidate:', message.candidate);
        
        try {
            await this.pc.addIceCandidate({
                candidate: message.candidate,
                sdpMid: message.sdp_mid,
                sdpMLineIndex: message.sdp_mline_index
            });
            console.log('Added ICE candidate successfully');
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }

    sendInputEvent(event) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(event));
        }
    }

    handleKeyDown(e) {
        if (!this.connected) return;
        
        // Prevent default browser behavior for game keys
        if (this.isGameKey(e.code)) {
            e.preventDefault();
        }

        const inputEvent = {
            "KeyboardKey": {
                "key": this.mapWebKeyToLinux(e.code),
                "pressed": true
            }
        };
        this.sendInputEvent(inputEvent);
    }

    handleKeyUp(e) {
        if (!this.connected) return;
        
        if (this.isGameKey(e.code)) {
            e.preventDefault();
        }

        const inputEvent = {
            "KeyboardKey": {
                "key": this.mapWebKeyToLinux(e.code),
                "pressed": false
            }
        };
        this.sendInputEvent(inputEvent);
    }

    handleMouseMove(e) {
        if (!this.connected || document.pointerLockElement !== document.getElementById('gameVideo')) {
            return;
        }

        const inputEvent = {
            "MouseMove": {
                "dx": e.movementX,
                "dy": e.movementY
            }
        };
        this.sendInputEvent(inputEvent);
    }

    handleMouseDown(e) {
        if (!this.connected) return;
        
        e.preventDefault();
        
        const inputEvent = {
            "MouseButton": {
                "button": this.mapMouseButton(e.button),
                "pressed": true
            }
        };
        this.sendInputEvent(inputEvent);
    }

    handleMouseUp(e) {
        if (!this.connected) return;
        
        e.preventDefault();
        
        const inputEvent = {
            "MouseButton": {
                "button": this.mapMouseButton(e.button),
                "pressed": false
            }
        };
        this.sendInputEvent(inputEvent);
    }

    handleMouseWheel(e) {
        if (!this.connected) return;
        
        e.preventDefault();
        
        const inputEvent = {
            "MouseWheel": {
                "dx": e.deltaX > 0 ? 1 : e.deltaX < 0 ? -1 : 0,
                "dy": e.deltaY > 0 ? -1 : e.deltaY < 0 ? 1 : 0  // Invert Y for natural scrolling
            }
        };
        this.sendInputEvent(inputEvent);
    }

    requestPointerLock() {
        const video = document.getElementById('gameVideo');
        video.addEventListener('click', () => {
            if (this.connected) {
                video.requestPointerLock();
            }
        });
    }

    isGameKey(code) {
        // Common game keys that should be captured
        const gameKeys = [
            'KeyW', 'KeyA', 'KeyS', 'KeyD', // WASD
            'Space', 'ShiftLeft', 'ControlLeft', 'AltLeft',
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'Escape', 'Tab', 'Enter'
        ];
        return gameKeys.includes(code);
    }

    mapWebKeyToLinux(webKey) {
        // Simplified mapping - in production, you'd want a complete mapping
        const keyMap = {
            'KeyA': 30, 'KeyB': 48, 'KeyC': 46, 'KeyD': 32, 'KeyE': 18,
            'KeyF': 33, 'KeyG': 34, 'KeyH': 35, 'KeyI': 23, 'KeyJ': 36,
            'KeyK': 37, 'KeyL': 38, 'KeyM': 50, 'KeyN': 49, 'KeyO': 24,
            'KeyP': 25, 'KeyQ': 16, 'KeyR': 19, 'KeyS': 31, 'KeyT': 20,
            'KeyU': 22, 'KeyV': 47, 'KeyW': 17, 'KeyX': 45, 'KeyY': 21,
            'KeyZ': 44, 'Space': 57, 'Enter': 28, 'Escape': 1,
            'ArrowUp': 103, 'ArrowDown': 108, 'ArrowLeft': 105, 'ArrowRight': 106,
            'ShiftLeft': 42, 'ControlLeft': 29, 'AltLeft': 56
        };
        return keyMap[webKey] || 0;
    }

    mapMouseButton(button) {
        switch (button) {
            case 0: return 'Left';
            case 1: return 'Middle';
            case 2: return 'Right';
            case 3: return 'Extra1';
            case 4: return 'Extra2';
            default: return 'Left';
        }
    }

    updateStatus(status, text) {
        const indicator = document.querySelector('.status-indicator');
        const statusText = document.getElementById('statusText');
        
        indicator.className = `status-indicator ${status}`;
        statusText.textContent = text;
    }

    updateUI() {
        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        const inputs = document.querySelectorAll('#signalingUrl, #sessionId');
        
        connectBtn.disabled = this.connected;
        disconnectBtn.disabled = !this.connected;
        
        inputs.forEach(input => {
            input.disabled = this.connected;
        });
    }

    async startStatsCollection() {
        setInterval(async () => {
            if (this.pc && this.connected) {
                await this.updateStats();
            }
        }, 1000);
    }

    async updateStats() {
        try {
            const stats = await this.pc.getStats();
            let bytesReceived = 0;
            let packetsLost = 0;
            let packetsReceived = 0;
            
            stats.forEach(report => {
                if (report.type === 'inbound-rtp' && report.kind === 'video') {
                    bytesReceived = report.bytesReceived || 0;
                    packetsLost = report.packetsLost || 0;
                    packetsReceived = report.packetsReceived || 0;
                    
                    // Calculate FPS
                    const currentTime = Date.now();
                    const timeDiff = currentTime - this.lastFrameTime;
                    if (timeDiff > 0) {
                        this.stats.fps = Math.round((report.framesDecoded || 0) / (timeDiff / 1000));
                    }
                    this.lastFrameTime = currentTime;
                }
            });

            // Calculate bitrate
            const currentTime = Date.now();
            const timeDiff = (currentTime - this.lastStatsTime) / 1000;
            if (timeDiff > 0) {
                this.stats.bitrate = Math.round((bytesReceived * 8) / 1000 / timeDiff);
            }
            this.lastStatsTime = currentTime;

            // Calculate packet loss
            if (packetsReceived > 0) {
                this.stats.packetLoss = ((packetsLost / (packetsLost + packetsReceived)) * 100).toFixed(1);
            }

            // Update UI
            document.getElementById('latencyValue').textContent = this.stats.latency + 'ms';
            document.getElementById('bitrateValue').textContent = this.stats.bitrate;
            document.getElementById('fpsValue').textContent = this.stats.fps;
            document.getElementById('packetLossValue').textContent = this.stats.packetLoss + '%';

        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }
}

// Global instance and functions
let client = new GameShareClient();

function connect() {
    client.connect();
}

function disconnect() {
    client.disconnect();
}

// Initialize
client.updateUI(); 