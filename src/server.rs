use core::error;
use std::{collections::HashMap, env, io::Error, sync::Arc}; 
use futures_util::{StreamExt, TryStreamExt, future, lock::Mutex};
use log::info;
use tokio::net::{TcpListener, TcpStream};
use crate::room::Room;

// A future is a value that may not be ready now but will become ready at some point in the future


pub async fn start(addr:&str) -> Result<(), Box<dyn error::Error>>{

    let map = Arc::new(Mutex::new(HashMap::<String, Room>::new()));

    let try_socket = TcpListener::bind(&addr).await?;

    while let Ok((stream, _)) = try_socket.accept().await{
    
        tokio::spawn(connection_helper(stream, map.clone())); // Hand off execution to background task spawner

    }


    Ok(())
}

async fn connection_helper(stream: TcpStream, map:Arc<Mutex<HashMap<String, Room>>>) {


}





pub async fn run() -> Result<(), Error> {
    // implementation of log API using stderr
    
    // Since logging isnt mandatory we use _ to ignore the return type 
    // that can be either success or error as an error (when a logger is already running) on log intialization
    // so instead of exiting the function we just ignore the type and keep going since a log already running means we dont need another anyway
    
    let _ = env_logger::try_init();

    // nth uses 0 based indexing to get the address provided by the user e.g cargo run -- "127.0.0.1:8080"
    // unwrap_or_else looks at the stuff before it if theres something it unwraps and yields whats there 
    // If None it executes the closure inside the else which uses the default address
    let addr = env::args().nth(1).unwrap_or_else(|| "127.0.0.1:8080".to_string());

    // Create the event loop and TCP listener we'll accept connections on
    // Control plane - TCP/WebSocket signalling server
    // The bind function initializes a TCP server by reserving a specific IP address and port number 
    // passing a reference to the address allows for borrowing instead of transferring ownership
    // &addr is a pointer to addrs memory, not a copy of it 
    let try_socket = TcpListener::bind(&addr).await; // Since binding takes time it uses a future 

    // Look at the value from try_socket, if its an error return "Failed to bind" if its not keep the value - similar to unwrap but with a custom message
    let listener = try_socket.expect("Failed to bind"); 

    // info! from the log crate, ouputs to terminal
    info!("Listening on: {}", addr);

    // .accept() waits for an incoming connection and returns a tcpstream,addr when it succeeds
    while let Ok((stream, _)) = listener.accept().await {
        // Tokio's thread pool management handles the connection
        tokio::spawn(accept_connection(stream));
    }

    Ok(())
}

async fn accept_connection(stream: TcpStream) {
    // Check if the streams peer has an address
    let addr = stream.peer_addr().expect("connected streams should have a peer address");
    info!("Peer address: {}", addr);

    // Initiate a handshake to create a websocket stream
    let ws_stream = tokio_tungstenite::accept_async(stream) // single struct with both Stream and Sink
        .await
        .expect("Error during the websocket handshake occurred");

    // Stating the address after a successful connection
    info!("New WebSocket connection: {}", addr);

    // .split splits stream into two objects stream and sink
    // Stream is (incoming / reading) 
    // Sink is (outgoing / writing)
    let (write, read) = ws_stream.split();
    // We should not forward messages other than text or binary.
    read.try_filter(|msg| future::ready(msg.is_text() || msg.is_binary()))
        .forward(write)
        .await
        .expect("Failed to forward messages")
}

/*
// Traversing module paths using :: like using / in a file path
use std::{collections::HashMap, env, io::Error, sync::Arc}; // in the standard library in the io module grab error
// futures_util is a utility belt for working with async streams and futures 
use futures_util::{StreamExt, TryStreamExt, future, lock::Mutex};
// StreamExt adds iterator-like methods to async streams .next(), .map(), .filter()
// TryStreamExt has the same idea but for error producing streams .try_for_each() 
// future contains utilities for combining futures like running two concurrently
use log::info;
// logging - info!("some message") logging API 
use tokio::net::{TcpListener, TcpStream};
*/