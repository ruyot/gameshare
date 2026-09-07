use signal::SignallingMessage;
use tokio::sync::mpsc;
mod server;
mod room;
mod signal;
mod webrtc;

const ADDR:&str = "127.0.0.1:8080"; // Server address

#[tokio::main]
async fn main() {
    
    // Need a local messaging queue between the peer and the engine thread that goes both ways
    let (engine_tx, mut engine_rx) = mpsc::unbounded_channel::<SignallingMessage>(); // Engine send and receive handles
    let (server_tx, mut server_rx) = mpsc::unbounded_channel::<SignallingMessage>(); // Server send and receive handles 

    let run_application = server::start(ADDR, engine_tx, server_rx).await;

    match run_application {
        Ok(_) => {
            println!("Signalling server successfully started")
        }
        Err(_) => {
            println!("Signalling server failed to start")
        }

    }

    /* 
    let run_engine = tokio::spawn::(webrtc::webrtc_engine(server_tx, engine_rx));

    match run_engine {
        Ok(_) => {
            println!("Engine thread started succesfully")
        }
        Err(_) => {
            println!("Engine thread failed to start")
        }
    }
    */
    
}
