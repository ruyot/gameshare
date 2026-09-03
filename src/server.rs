use core::error;
use std::{collections::HashMap, sync::{Arc, Mutex}}; 
use futures_util::{SinkExt, StreamExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::mpsc;
use serde_json;
use crate::room::{Room, assign_room, get_opposing_peer_tx, join_room, remove_room};
use crate::signal::SignallingMessage;

pub async fn start(addr:&str) -> Result<(), Box<dyn error::Error>>{

    let map = Arc::new(Mutex::new(HashMap::<String, Room>::new()));

    let try_socket = TcpListener::bind(&addr).await?;

    // Start listening for connections
    while let Ok((stream, _)) = try_socket.accept().await{
    
        tokio::spawn(connection_helper(stream, map.clone())); // Hand off execution to background task spawner

    }

    Ok(())
}

async fn connection_helper(stream: TcpStream, map:Arc<Mutex<HashMap<String, Room>>>) -> Result<(), Box<dyn error::Error + Send + Sync>> {

    // Creates a struct with both stream (send) and sink (receive)
    let ws_stream = tokio_tungstenite::accept_async(stream)
        .await
        .expect("There was an Error during the websocket handshake");

    let (mut write, mut read) = ws_stream.split();

    // The server doesnt know if the client wants to host a new room or join an existing room 

    // Connections need their own internal messaging queues 
    let (tx, mut rx) = mpsc::unbounded_channel::<SignallingMessage>();

    // For our connection loop we need to keep track of room id and whether the person sending us (the server) stuff is the host or not
    let mut room_id: Option<String> = None;

    let mut is_host = false;

    type Message = tokio_tungstenite::tungstenite::protocol::Message; // Simplify pulling the message enum from tokio tungstenite

    loop {
        tokio::select! {   

        // Websocket branch
        // Allowed to be none for exiting the loop
        msg = read.next() => {
            // Because the signalling message enum has both serialize and deserialize we can convert directly into the data we defined in the enum
            // However serde needs a way to differentiate which data type it needs to convert to by picking correctly within the enum
            // To do this differentiation we make use of internal tagging, internal tagging means that the name of the variant is matched against the message when choosing
            
            let Some(Ok(msg)) = msg else {
                break;
            };

            // We destruct the option and result and convert the message to text (one of its defined possible fields within the enum)
            let text = msg.to_text()?;
            let parsed_msg: SignallingMessage = serde_json::from_str(text)?;
            
            match parsed_msg {
                // Assign - Give me (host) a room (all variants need to define their fields)
                SignallingMessage::Assign {} => {
                    room_id = assign_room(&map, tx.clone()).ok();

                    let Some(id) = &room_id else {
                        return Err("Failed to assign a room and an id was not generated".into()) // convert to the error type we need using into
                    };

                    let room = SignallingMessage::Assigned { room_id: id.clone()};

                    // Serialize the enum variant so we can send it back to the host
                    let serialized = serde_json::to_string(&room);

                        match serialized {
                            Ok(msg) => { 
                                write.send(Message::text(msg)).await?;
                                is_host = true;
                            }

                            Err(_) => {
                                return Err("Failed to serialize enum variant Assigned".into())
                            }
                        }
                    } 
                 
                // Join - Let me (client) join an existing room (the client gives us the id for the room in the message)
                SignallingMessage::Join {room_id : provided_id} => {

                    // Have to return a success or an error 
                    let joined = join_room(&provided_id, &map, tx.clone());

                    match joined {
                        Ok(_) => {

                            let success = SignallingMessage::Joined {success_message : format!("Joined room {provided_id} successfully")};

                            let serialized_success = serde_json::to_string(&success);

                            match serialized_success {
                                Ok(msg) => {
                                    write.send(Message::text(msg)).await?;

                                    is_host = false;

                                    room_id = Some(provided_id);
                                }

                                Err(_) => {
                                    return Err("Failed to serialize success message for join".into())
                                }
                            }
                        }

                    
                        Err(_) => {
                            let error = SignallingMessage::Error { error_message : "Failed to join a rooom, are you sure the provided id is correct or that the room exists?".to_string()};
                            
                            let serialized_error = serde_json::to_string(&error);

                            match serialized_error {

                                Ok(msg) => {
                                    write.send(Message::text(msg)).await?;
                                }

                                Err(_) => {
                                    return Err("Failed to serialize error message for join".into())
                                }

                            }
                            
                        }

                    }

                }
                
                // Relay - Let me send a message to my peer
                SignallingMessage::Relay {payload} => {
                    // Check if the peer making the request is even in a room

                    match &room_id {
                        
                        None => {
                            let error = SignallingMessage::Error { error_message : "Join a room first".to_string()};

                            let serialized_error = serde_json::to_string(&error);

                            match serialized_error {

                                Ok(msg) => {
                                    write.send(Message::text(msg)).await?;
                                }

                                Err(_) => {
                                    return Err("Failed to serialize error message for no room on relay".into())

                                }

                            }

                        }

                        Some(id) => {
                            let peertx = get_opposing_peer_tx(id, &map, is_host);

                            match peertx {

                                Ok(peertx) => {
                                    // The peer sent us (the server) a message (variant relay) which states that they would like to send a payload to the other peer
                                    // Ensuring all other conditions are valid we need to send this over through the other peers channel
                                    // Everything we transmit is of type enum signallingmessage so we need to contruct a relay message to send back using the payload, this is different than the one we got

                                    let package = SignallingMessage::Relay {payload : payload};

                                    // returns Ok() or SendError
                                    let send_package = peertx.send(package);

                                    match send_package {

                                        Ok(_) => {
                                            let success = SignallingMessage::Relayed {success_message : "Message sent to peer succesfully".to_string()};

                                            let success_serialized = serde_json::to_string(&success);

                                            match success_serialized {
                                                Ok(msg) => {
                                                    write.send(Message::text(msg)).await?;
                                                }
                                                Err(_) => {
                                                    return Err("Failed to serialize success message for relay".into())
                                                }
                                            }

                                        }

                                        Err(_) => {
                                            let error = SignallingMessage::Error {error_message : "Message failed to send over the internal channel, please try again".to_string()};
                                            let serialized_error = serde_json::to_string(&error);

                                            match serialized_error {
                                                
                                                Ok(msg) => {
                                                    write.send(Message::text(msg)).await?;
                                                }

                                                Err(_) => {
                                                    return Err("Failed to serialize error message for failure to send over internal channel during relay".into())
                                                }
                                            }
                                        }

                                    }
                                }

                                Err(_) => {
                                    let error = SignallingMessage::Error { error_message : "Failed to retrieve the channel of the opposing peer".to_string()};

                                    let serialized_error = serde_json::to_string(&error);

                                    match serialized_error {

                                        Ok(msg) => {
                                            write.send(Message::text(msg)).await?;
                                        }

                                        Err(_) => {
                                            return Err("Failed to serialize error message for opposing peer retrieval".into())
                                        }

                                    }

                                }

                            }

                        }
                    }
                }
                // Wildcard for last two that dont need to be matched
                _ => (),              
                }

            }

        // Internal channel branch
        Some(msg) = rx.recv() => {
            // Peer receives a message from the opposing peer on the internal channel
            // The message should be written to the peer who received the internal channel message
            // Needs to be serialized since its of type SignallingMessage

            let serialized = serde_json::to_string(&msg)?;

            // Use {..} to match against the disconnection variant and anything within it
            if matches!(msg, SignallingMessage::Disconnection {..}) {
                match is_host {
                    true => {
                        write.send(Message::text(serialized)).await?;
                    }
                    false => {
                        write.send(Message::text(serialized)).await?;

                        room_id = None;

                        write.close().await?;

                        break;
                    }
                }
            } else {
                write.send(Message::text(serialized)).await?;
            }

            } 

        }

    }

    // Check if the room_id is none first 
    // Could be a case where the websocket connection fails even before a room is created
    let id = room_id;

    // We also have to exit with different actions depending on whether or not the current thread is a host or client thread

    match id {
        Some(id) => {
            match is_host {
                // There is a room and the current peer is the host
                true => {

                            // What if the client is still connected to the room even after the host disconnects?
                            // We should force the client out by sending them a message so that they're also removed on the next iteration of their thread loop
                            // This message will be of variant disconnection once its sent the client thread should hit it on the internal channel branch 
                    
                    if let Ok(client_tx) = get_opposing_peer_tx(&id, &map, is_host) {
                        let msg = SignallingMessage::Disconnection { disconnection_message: ("The host has left the room, you will now be disconnected".to_string())};

                        remove_room(&id, &map)?;
                        
                        client_tx.send(msg)?;

                    } else {
                        println!("There is no client connected to the room so a disconnection message isnt needed");

                        remove_room(&id, &map)?;
                    };

                }

                

                // There is a room and the current peer is the client
                false => {
                    // We dont remove the room completely because the host can wait for the client to rejoin
                    // Note - based on the architecture if the host is gone the room should already be gone anyway
                    // We also have to reset the client_tx field in the room struct to become None

                    if let Ok(peertx) = get_opposing_peer_tx(&id, &map, is_host) {
                        let msg = SignallingMessage::Disconnection { disconnection_message: ("The client has disconnected".to_string()) };
                        
                        let sent = peertx.send(msg);

                        match sent {
                            Ok(_) => {
                                println!("The host was successfully informed that the client disconnected")
                            }
                            Err(_) => {
                                println!("The host has already disconnected from the room, cannot send client disconnection message");
                            }

                        }
              
                        }; // could have an else check for peertx here but it shouldnt be possible for there to not be a room or a host_tx if theres a room id

                        // Query the hashmap for this specific room to change the client_tx back to none

                        let rooms = &map;

                        let mut mutable_map = rooms.lock().unwrap();

                        let room = mutable_map.get_mut(&id);

                        match room {
                            Some(room) => {
                                if room.client_tx.is_some() {
                                    room.client_tx = None;
                                } else {
                                    return Ok(())
                                }

                            }

                            None => {
                                println!("Couldn't find the associated room in the hashmap to reset client_tx")
                            }

                        }
                    }

                }
                
            }

        None => {
            // There is no room
            println!("Peer disconnected or there was never an associated room")
        }
    }

    Ok(())
}




/*
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
    // Stream is (incoming / reading) -> receive
    // Sink is (outgoing / writing) -> send
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

 */