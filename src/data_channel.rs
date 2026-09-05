use webrtc::data_channel::{DataChannel, DataChannelEvent};
use webrtc::peer_connection::{
    MediaEngine, RTCConfigurationBuilder, RTCIceGatheringState, RTCIceServer,
    RTCPeerConnectionState, RTCSessionDescription, Registry, register_default_interceptors,
};
use webrtc::peer_connection::{PeerConnection, PeerConnectionBuilder, PeerConnectionEventHandler};
use webrtc::runtime::{Runtime, Sender, channel};
use std::sync::Arc;


async fn webrtc_engine() ->  {

    let config = RTCConfigurationBuilder::new()
        .with_ice_servers(vec![RTCIceServer {
            urls: vec!("stun:stun.l.google.com:19302".to_string()),
            ..Default::default()
        }])
        .build();

    






}


 /* 
    let pc = PeerConnectionBuilder::new() 
    .with_configuration(
        RTCConfigurationBuilder::default()
            .with_ice_servers(vec![RTCIceServer {  // Typically connections rely on multiple fallback servers for a general build we'll use 1
                urls: vec!["stun:stun.l.google.com:19302".to_owned()],
                ..Default::default() // Stun servers take other fields than just urls but by doing ..Default::default all remaining fields are given default representations
            }])
            .build(),
    )
    .with_handler(Arc::new(Events))
    .with_udp_addrs(vec!["0.0.0.0:0"]) // Binding to all IPv4 interfaces on the local machine with a random available port
    .build() // Initiating the WebRTC engine
    .await?;


};
*/

// State what kind of channel we want to the engine




// For peer 1
// Peer 1 creates the webRTC peer connection object and registers a data channel
// Peer 1 sets up an internal listener to watch for the complete signal on_ice_gathering state change
// Generates initial offer by calling create offer() and then saves it locally via set_local_description()
// The stun wait this step triggers in the background stun lookup, peer 1 pauses and blocks execution here waiting for the listener from step 2 to signal that gathering is done
// Once unblocked peer 1 extracts the final local description which has the stun information within it
// Peer 1 serializes this complete offer to json and sends it through the websocket server as a relay message
// Peer 1 waits for an answer

// For peer 2
// receives offer sits idle until a relay message arrives over the websocet containing peer 1s complete sdp offer
// Initialize and inject peer 2 creates its own webrtc peer connection object and imemdaitely injects peer 1s data into it using set create remote description
// Peer 2 listens for completion on its gathering state
// Peer 2 calls create answer and saves it locally using set_local_description
// Peer 2s stun lookup happens in the background peer 2 pauses awiting for the listener to signal that gathering is complete
// Once unblocked peer 2 extracts its finalized local description with all its stun ip info baked into it 
// Peer 2 serializes its complete answer to json and sends it back through the websocket server as relay

// peer 1 receives peer 2s complete sdp answers via the websocket and passes it to set_remote description 
// The handshake completes because both sdp documents contain a full list of all the possible navigation paths the two pick the best matching ones 
// the webrtc-rs data channel transitions to open 

/*
let (gather_complete_tx, mut gather_complete_rx) = channel(1);

let peer_connection = PeerConnectionBuilder::new()
    .with_runtime(runtime.clone())
    .build()
    .await?;

// Creating a data channel with label data
let data_channel = peer_connection.create_data_channel("data", None).await?;

// Gonna be using non trickle ice 

*/