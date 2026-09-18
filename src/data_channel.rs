use std::{error::Error, sync::Arc};
use webrtc::data_channel::{DataChannel, DataChannelEvent};
use crate::signal::InputMessage;

pub async fn data_channel_helper(handle : Arc<dyn DataChannel>) -> Result<(), Box<dyn Error + Send + Sync>>{
    
    println!("I exist");

    while let Some(event) = handle.poll().await {
        match event {
            DataChannelEvent::OnOpen => {
                println!("Data channel opened!");
                // Add wasm listeners for browser events
            }
            DataChannelEvent::OnClose => {
                println!("Data channel closed");
            }
            _ => {}
        }
    }

    Ok(())   
}

/*
To manipulate anything in chrome, wasm has to make a call to javascript, and javascript makes the call to the browser
writing manual js code for every dom method eg document.getelemenetbyid is too much
the browser vendors publish formal machine readable definitions of every api that exists in browsers called webidl
the web-sys crate in rust is entirely mechanically generated inside build.rs using wasm-bindgens webIDL frontend and the webidl interface defintions for web apis.
*/