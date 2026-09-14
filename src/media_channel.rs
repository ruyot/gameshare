use std::{default, error::Error, sync::Arc, vec};
use rtc::sctp::Payload;
use webrtc::media_stream::{track_local::TrackLocal, track_remote::{TrackRemote, TrackRemoteEvent}};
use bytes::Bytes;
use rtc_rtp::{Packet,Header};

pub async fn media_channel_sender(track : Arc<dyn TrackLocal>) -> Result<(), Box<dyn Error + Send + Sync>>{
    
    Ok(())
}



pub async fn media_channel_receiver(track : Arc<dyn TrackRemote>) -> Result<(), Box<dyn Error + Send + Sync>>{
    
    println!("Media Channel Created!");

    // Can process through data in the track here
    
    Ok(())
}