use std::{error::Error, sync::Arc};
use webrtc::data_channel::{DataChannel, DataChannelEvent};

pub async fn data_channel_helper(handle : Arc<dyn DataChannel>) -> Result<(), Box<dyn Error + Send + Sync>>{
    
    println!("I exist");

    while let Some(event) = handle.poll().await {
        match event {
            DataChannelEvent::OnOpen => {
                println!("Data channel opened!");
            }
            DataChannelEvent::OnClose => {
                println!("Data channel closed");
            }
            _ => {}
        }
    }

    Ok(())   
}