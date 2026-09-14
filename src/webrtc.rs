use webrtc::data_channel::RTCDataChannelInit;
use webrtc::peer_connection::{MediaEngine, RTCConfigurationBuilder, RTCIceGatheringState, RTCIceServer, register_default_interceptors};
use webrtc::peer_connection::{Registry, PeerConnection, PeerConnectionBuilder, PeerConnectionEventHandler};
use webrtc::media_stream::track_remote::{TrackRemote};
use webrtc::runtime::{Receiver, Sender, channel};
use std::error::Error;
use std::sync::Arc;

use crate::media_channel::media_channel_receiver;


pub async fn peer_connection_builder() -> Result<(impl PeerConnection, Receiver<()>, RTCDataChannelInit), Box<dyn Error + Send + Sync>>{

    let registry = Registry::new();

    let (gather_complete_tx, gather_complete_rx) = channel(1);
    #[derive(Clone)]
    struct Handler {   // For events like ice candidates
        gather_complete_tx: Sender<()>
    }

    // Media stuff
    let mut media_engine = MediaEngine::default();
    media_engine.register_default_codecs()?;

    #[async_trait::async_trait]
    impl PeerConnectionEventHandler for Handler {
        async fn on_ice_gathering_state_change(&self, state: RTCIceGatheringState) {
            println!("ICE gathering state: {:?}", state);
            if state == RTCIceGatheringState::Complete {
                let _ = self.gather_complete_tx.try_send(()); // Sends a message in the channel once gathering is completed
            }
        }

        async fn on_track(&self, track : Arc<dyn TrackRemote>) {
            println!("Media channel ready");
            tokio::spawn(media_channel_receiver(track)); // If the track exists spawn a task and pass the track through
        }
    }

    // Supplying a data channel configuration for the peer means the event of an open data channel doesnt need to be tracked
    // Id just needs to be supplied and data channel needs to be initialized on both sides with the same configuration
    let data_channel_specs = RTCDataChannelInit {
        ordered: true,
        max_packet_life_time: None,
        max_retransmits: None,
        negotiated: Some(172),
        protocol: "".to_string(),
    };

    let handler = Arc::new(Handler {
        gather_complete_tx,
    });

    // Interceptors for detecting stuff like packet loss and request retransmission
    // Default includes NACK, RTCP reports, simulcast headers, and TWCC receiver
    let registry = register_default_interceptors(registry, &mut media_engine)?;

    // Specifying properties of the WebRTC session using the builder
    let connection_config = RTCConfigurationBuilder::new()
        .with_ice_servers(vec![RTCIceServer {
            urls: vec!("stun:stun.l.google.com:19302".to_string()),
            ..Default::default()
        }])
        .build();

    // Start the engine with the data channel and whatever else we'll need later
    let peer_connection = PeerConnectionBuilder::new()
        .with_configuration(connection_config)
        .with_media_engine(media_engine)
        .with_interceptor_registry(registry)
        .with_handler(handler)
        .with_udp_addrs(vec!["0.0.0.0:0"]) // Configures the builder with the local udp socket addresses to bind
        .build()
        .await?;

    Ok((peer_connection, gather_complete_rx, data_channel_specs))
}

/* 
// Creating a data channel with the label 'data'
// Will want to trigger the creation of a data channel based on an event ie after offers have been exchanged
// So ideally after the host sets their remote? cause thats indication of the process being done
let data_channel = peer_connection.create_data_channel("data", None).await?;
*/


/*
// When you call methods like remote_description(offer)
// WebRTC internally reaches into the runtime handle that was given (in peer_connection) and executes

let offer = peer_connection.create_offer(None).await?; // SDP offer
peer_connection.set_local_description(offer).await?; // Session description
*/

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

/*
    // Get the local description and send it to the signalling server
    // 
    if let Some(local_desc) = peer_connection.local_description().await {

        // Serialize to json
        let serialized_desc = serde_json::to_string(&local_desc)?; 

        // Make it of type enum variant relay
        let offer = SignallingMessage::Relay { payload: serialized_desc };

        // Send across the internal channel
        peertx.send(offer)?;

        println!("Successfully sent the sdp offer to the other peer")

    // Webrtc loop needs to see if an offer was received or if an answer was received
    // Set remote description, create answer, set local description, send answer back 
    // Set remote description, negotitation complete

    } else {
        println!("Failed to generate local_description")
    }

*/


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


/*
// Single signal channels to determine whether sdp and ice gathering is done
    let (done_tx, mut done_rx) = channel::<()>(1);
    let (gather_complete_tx, mut gather_complete_rx) = channel::<()>(1);
*/