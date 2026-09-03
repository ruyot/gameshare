mod server;
mod room;
mod signal;

const ADDR:&str = "127.0.0.1:8080"; // Server address

#[tokio::main]
async fn main() {
    // Initialize the logger

    let run_application = server::start(ADDR).await;

    match run_application {
        Ok(_) => {
            println!("Signalling server successfully started")
        }
        Err(_) => {
            println!("Signalling server failed to start")
        }

    }
    
}
