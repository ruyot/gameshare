# GameShare
### <p style="font-size:20px; text-align: center;">Current Progress</p>
<video width="700" height="200" controls>
    <source src="v1.mov" type="video/mp4">
</video>

> As you can see the media stream on the client side is currently pretty laggy, im gonna be working on improving this next and adding input handling!

## What is GameShare?

GameShare is a peer to peer application that allows a host to stream a video game through their machine to a user. 

The overall goal is for the user to be able to interact and play the game as if theyre directly on the hosts machine with negligible latency. 

WebRTC, Rust, the WebRTC.rs crate and asynchronous programming are all used to make this possible. 

## Architecture Breakdown
Before even creating a direct connection between two peers (P2P) WebRTC requires the host and user to already be able to communicate with each other in order to exchange machine specific information like their session description protocol and ice candidates. These define the peer machines video or audio capabilities and possible connection paths respectively.

> So how do the host and the client (e.g. pc and laptop) communicate securely in order to share information for the establishment of a direct P2P connection (WebRTC)?

Traditionally a signalling server is used to handle this. The signalling acts as a middleman, managing thread processes or tasks where each thread is a client or host connecting to the signalling server.

In GameShare the signalling sever is server.rs. In server.rs an initial asynchronous start function runs continously with a loop where the server constantly listens for connections to its address.

For every connected peer tokio::spawn is used to create a tokio task for that specific peer. 

```rust
    while let Ok((stream, _)) = try_socket.accept().await{
    
        tokio::spawn(connection_helper(stream, map.clone())); // Hand off execution to background task spawner

    }
```

Tokio tasks are similar to OS threads in the sense that theyre able to run in the background and do things, however tokio tasks are much smaller and take much less memory eg a few kilobytes.

Every connected peer takes an immediate call of the connection_helper function along with stream and map as parameters.

Stream being the TCP connection thats created and used via websockets and map being a hashmap that stores room/peer information for O(1) lookup time (more on this later).

```rust
    let map = Arc::new(Mutex::new(HashMap::<String, Room>::new()));

    let try_socket = TcpListener::bind(&addr).await?;
```
*The above initializes the map and binds a TCP websocket to the servers address.*

> So this is how peers actually connect to the server, but what actually happens in the server?

Previously we discussed that each peer makes a call to the connection_helper function inside their own tokio task. Everything that can happen between the peer and the server exists within this connection helper function. This includes the various kinds of messages that can be sent back and forth by the peer.

An enum SignallingMessage is defined with the various kinds of messages that can be sent which are all of type string for simplicity and ease of execution.

```rust
pub enum SignallingMessage {
    Assign {
    },
    Assigned {
        room_id: String,
    },
    Join {
        room_id: String,
    },
    Joined {
        success_message: String,
    },
    Relay {
        payload: String,
    },
    Relayed {
        success_message: String,
    },
    Disconnection {
        disconnection_message: String,
    },
    Error {
        error_message: String,
    },
}
```



