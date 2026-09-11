use std::{error::Error, sync::Arc};
use webrtc::data_channel::{DataChannel, DataChannelEvent};

pub async fn data_channel_helper(handle : Arc<dyn DataChannel>) -> Result<(), Box<dyn Error + Send + Sync>>{
    
    println!("I exist");

    while let Some(event) = handle.poll().await {
        println!("While loop hit");

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

    println!("out of while loop");
    
    Ok(())   
}
// "5eb7cbcc-f64f-4a26-8835-8999ef23e318"