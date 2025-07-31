class RemoteGameShareClient {
    constructor() {
        this.ws = null;
        this.pc = null;
        this.dataChannel = null;
        this.sessionId = null;
        this.connected = false;
        this.signalingUrl = null;
        
        this.setupEventListeners();
        this.initializeConnection();
    }

    setupEventListeners() {
        // Video element events
        const video = document.getElementById('remoteVideo');
        video.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded');
        });

        video.addEventListener('loadeddata', () => {
            console.log('Video data loaded');
        });

        // Input event listeners for game control
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

    initializeConnection() {
        // Get session ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        this.sessionId = urlParams.get('session') || 'default-session';
        this.signalingUrl = urlParams.get('signaling') || 'wss://your-signaling-server.com/signaling';
        
        console.log(`Connecting to session: ${this.sessionId} via ${this.signalingUrl}`);
        this.connect();
    }

    async connect() {
        if (!this.signalingUrl || !this.sessionId) {
            console.error('Missing signaling URL or session ID');
            return;
        }

        try {
            // Connect to remote signaling server
            this.ws = new WebSocket(this.signalingUrl);
            this.ws.onopen = () => this.onSignalingConnected();
            this.ws.onmessage = (event) => this.onSignalingMessage(event);
            this.ws.onerror = (error) => this.onSignalingError(error);
            this.ws.onclose = () => this.onSignalingClosed();

        } catch (error) {
            console.error('Connection failed:', error);
        }
    }

    async onSignalingConnected() {
        console.log('Connected to signaling server');
        
        // Join the session as a client
        const joinMessage = {
            type: 'join',
            session_id: this.sessionId,
            client_type: 'client'
        };
        
        this.ws.send(JSON.stringify(joinMessage));
    }

    async onSignalingMessage(event) {
        try {
            const message = JSON.parse(event.data);
            console.log('Received signaling message:', message);

            switch (message.type) {
                case 'offer':
                    await this.handleOffer(message);
                    break;
                case 'ice-candidate':
                    await this.handleIceCandidate(message);
                    break;
                case 'error':
                    console.error('Signaling error:', message.message);
                    break;
                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Failed to parse signaling message:', error);
        }
    }

    onSignalingError(error) {
        console.error('Signaling error:', error);
    }

    onSignalingClosed() {
        console.log('Signaling connection closed');
        this.connected = false;
    }

    async setupPeerConnection() {
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };

        this.pc = new RTCPeerConnection(configuration);

        // Handle incoming tracks
        this.pc.ontrack = (event) => {
            console.log('Received remote track:', event.track.kind);
            const video = document.getElementById('remoteVideo');
            if (event.streams && event.streams[0]) {
                video.srcObject = event.streams[0];
            } else {
                const stream = new MediaStream();
                stream.addTrack(event.track);
                video.srcObject = stream;
            }
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
            if (this.pc.connectionState === 'connected') {
                this.connected = true;
                console.log('WebRTC connection established');
            }
        };

        // Setup data channel for input events
        this.setupDataChannel();
    }

    setupDataChannel() {
        this.dataChannel = this.pc.createDataChannel('input', {
            ordered: true,
            maxRetransmits: 3
        });

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
        
        if (!this.pc) {
            await this.setupPeerConnection();
        }

        try {
            await this.pc.setRemoteDescription(new RTCSessionDescription({
                type: 'offer',
                sdp: message.sdp
            }));

            const answer = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answer);

            const answerMessage = {
                type: 'answer',
                sdp: answer.sdp,
                session_id: this.sessionId
            };

            this.ws.send(JSON.stringify(answerMessage));
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }

    async handleIceCandidate(message) {
        if (!this.pc) {
            console.warn('Received ICE candidate before peer connection setup');
            return;
        }

        try {
            const candidate = new RTCIceCandidate({
                candidate: message.candidate,
                sdpMid: message.sdp_mid,
                sdpMLineIndex: message.sdp_mline_index
            });

            await this.pc.addIceCandidate(candidate);
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
        
        const event = {
            type: 'keydown',
            code: e.code,
            key: e.key,
            timestamp: Date.now()
        };
        this.sendInputEvent(event);
    }

    handleKeyUp(e) {
        if (!this.connected) return;
        
        const event = {
            type: 'keyup',
            code: e.code,
            key: e.key,
            timestamp: Date.now()
        };
        this.sendInputEvent(event);
    }

    handleMouseMove(e) {
        if (!this.connected) return;
        
        const video = document.getElementById('remoteVideo');
        const rect = video.getBoundingClientRect();
        
        const event = {
            type: 'mousemove',
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            timestamp: Date.now()
        };
        this.sendInputEvent(event);
    }

    handleMouseDown(e) {
        if (!this.connected) return;
        
        const event = {
            type: 'mousedown',
            button: e.button,
            timestamp: Date.now()
        };
        this.sendInputEvent(event);
    }

    handleMouseUp(e) {
        if (!this.connected) return;
        
        const event = {
            type: 'mouseup',
            button: e.button,
            timestamp: Date.now()
        };
        this.sendInputEvent(event);
    }

    handleMouseWheel(e) {
        if (!this.connected) return;
        
        e.preventDefault();
        
        const event = {
            type: 'wheel',
            deltaX: e.deltaX,
            deltaY: e.deltaY,
            timestamp: Date.now()
        };
        this.sendInputEvent(event);
    }
}

// Initialize the client when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new RemoteGameShareClient();
}); 