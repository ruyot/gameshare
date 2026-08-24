use std::collections::HashMap;
use tokio::sync::mpsc;
use std::sync::{Arc, Mutex};
use uuid::Uuid; // Random id generation

use crate::signal::SignallingMessage;  // Signalling message enum

// Mapping a string key to a Room data (defined in the struct)
// Mutex provides mutual exclusion so only one task/thread can read or write to the inner HashMap at any given millisecond
// Arc gives you shared ownership at runtime so that we can increment the reference count via an atomic reference counter (arc) everytime you clone (shallow copy)

// Channel Sender alias (channels are split into tx and rx)
// Unbounded instead of bounded
type PeerTx = mpsc::UnboundedSender<SignallingMessage>;

// What we store in a single room
pub struct Room {
    pub host_tx: PeerTx,
    pub client_tx: Option<PeerTx>,  // We dont have this value until the client joins
}

pub type MappedRoom = Arc<Mutex<HashMap<String, Room>>>;

// for the function signature we need a reference to the shared map

// The overall idea of assign is that we want to be able to add a new room instance to the hashmap (where were storing the rooms)
pub fn assign_room(rooms:&MappedRoom, host_tx:PeerTx) -> Result<String, String> {

    let id = Uuid::new_v4().to_string();

    let room = Room {
        host_tx: host_tx,
        client_tx: None,
    };
    let mut map = rooms.lock().unwrap(); // Lock the hashmap check for error via unwrap (shorter lock durations tend to be better)
    map.insert(id.clone(), room);

    Ok(id)
}

// For assign we want to acquire the lock 
// Construct an instance of the room
// Insert into the map
// Release the lock


// For the join room function a room already exists 
// A second peer wants (client) wants to join the room 
// Theyre gonna need the room id to connect to the room and we need their channel too - &str lookup by reference
pub fn join_room(id:&str, rooms:&MappedRoom, client_tx:PeerTx) -> Result<(), String> {

    // is_some() and is_none() let you boolean check the values in options
    let mut map = rooms.lock().unwrap();

    if let Some(room) = map.get_mut(id) {
        if room.client_tx.is_some(){
            return Err("This room is full".to_string());
        }
        else {
            room.client_tx = Some(client_tx);
        }
    } else {
       return Err("Room does not exist".to_string());
    }

    Ok(())
}

/*
Given room x if the sender is peer A give me peer B's inbox handle
If the sender is peer b give me peer a's inbox handle
*/

// Based on a room
// If the sender is Peer A give them peer B's handle
// If the sender is Peer B give them peer A's inbox handle

pub fn get_opposing_peer_tx (id:&str, rooms:&MappedRoom, is_host:bool) -> Result<PeerTx, String> {

    let map = rooms.lock().unwrap();

    if let Some(room) = map.get(id) {
        if is_host{
            if room.client_tx.is_none() {
               return Err("The client hasn't connected yet".to_string());
            }
            else{
                return Ok(room.client_tx.as_ref().unwrap().clone());
            }
        }
        else{
            return Ok(room.host_tx.clone());
        }
    } else {
        return Err("Room not found".to_string());
    }
}

pub fn remove_room (id:&str, rooms:&MappedRoom) -> Result<(), String> {
    let mut map = rooms.lock().unwrap();
    
    if map.remove(id).is_some() {
        println!("Removed room {}", id);
    }
    else {
        return Err("Provided room not found".to_string());
    }

    Ok(())
}

/*
async fn channel() {

    // Sender and Receiver tx rx within the channel cap 32
    let (tx, mut rx) = mpsc::channel(32);



    // You can send from multiple tasks if you clone the sender
    // e.g. let tx2 = tx.clone(); cant clone receiver in mpsc

    // In the cases of using tx and rx you use .await because you need to wait until the message is removed




}
*/