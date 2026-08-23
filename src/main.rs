mod echo_server;
mod room;
mod signal;

#[tokio::main]
async fn main() {
    // Initialize the logger
    if echo_server::run().await.is_err() {
        println!("Error when starting");
    }
}
