mod echo_server;

#[tokio::main]
async fn main() {
    // Initialize the logger
    if echo_server::run().await.is_err() {
        println!("Error when starting");
    }
}
