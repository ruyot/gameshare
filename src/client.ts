const configuration = {
    iceServers: [{
        urls: "stun:stun.l.google.com:19302"
    }],
};
         
let pc = new RTCPeerConnection(configuration); 

/*
this.pc.onicecandidate = (event) => {
    if (event.candidate) {
        this.sendSignaling({
            type: "candidate",
            candidate: event.candidate,
            sessionId: qrData.sessionId
        }, qrData.signalingUrl);
            }
};
*/