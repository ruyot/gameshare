use webrtc::data_channel::{DataChannel, DataChannelEvent};
use webrtc::peer_connection::{
    MediaEngine, RTCConfigurationBuilder, RTCIceGatheringState, RTCIceServer,
    RTCPeerConnectionState, RTCSessionDescription, Registry, register_default_interceptors,
};
use webrtc::peer_connection::{PeerConnection, PeerConnectionBuilder, PeerConnectionEventHandler};
use webrtc::runtime::{Runtime, Sender, channel};
use std::sync::Arc;

#[derive(Clone)]
struct MyHandler;

#[async_trait::async_trait]
impl PeerConnectionEventHandler for MyHandler {
    // implement event handlers
}

let pc = PeerConnectionBuilder::new()
    .with_configuration(
        RTCConfigurationBuilder::default()
            .with_ice_servers(vec![RTCIceServer {
                urls: vec!["stun:stun.l.google.com:19302".to_owned()],
                ..Default::default()
            }])
            .build(),
    )
    .with_handler(Arc::new(MyHandler))
    .with_udp_addrs(vec!["0.0.0.0:0"])
    .build()
    .await?;

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