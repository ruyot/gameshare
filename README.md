Gameshare is a peer to peer application that allows a host to stream a video game or a standard application through their machine to a user. 

The overall goal is for the user to be able to interact and play the game as if theyre directly on the hosts machine with negligible latency. 

WebRTC, Rust, the WebRTC.rs crate and asynchronous programming are all used to make this all possible. 


Architecture Breakdown:
Before even creating a direct connection between two peers (P2P) WebRTC requires the host and user to already be able to communicate with each other in order to exchange machine specific information like their session description protocol and ice candidates. These define the peer machines video or audio capabilities and possible connection paths respectively.

So how do the host and client communicate securely in order to share information for the establishment of a direct P2P connection?

Traditionally a signalling server is used to handle this. The signalling server manages thread processes or tasks where each thread is a client or host connecting to the signalling server.

In GameShare the signalling sever ir server.rs. In server.rs an initial asynchronous start function runs continously with a loop where the server constantly listens for connections to its address.

For every connected peer tokio::spawn is used to create a tokio task for that specific peer. 

```rust
    while let Ok((stream, _)) = try_socket.accept().await{
    
        tokio::spawn(connection_helper(stream, map.clone())); // Hand off execution to background task spawner

    }
```

Tokio tasks are similar to os threads in the sense that theyre able to run in the background and do things - however tokio tasks are much smaller and take much less memory eg a few kilobytes dependent on local variables.

Every connected peer takes an immediate call of the connection_helper function along with stream and map as parameters.

Stream being the TCP connection thats created and used via websockets and map being a hashmap that stores room/peer information for O(1) lookup time - more on this later.

```rust
    let map = Arc::new(Mutex::new(HashMap::<String, Room>::new()));

    let try_socket = TcpListener::bind(&addr).await?;
```
Initializing the map and binding a TCP websocket to the servers address

So this is how peers actually connect to the server, but what actually happens in the server? Previously we discussed that the 


