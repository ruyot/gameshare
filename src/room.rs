use std::collections::HashMap;
use tokio::sync::mpsc;
use std::sync::{Arc, Mutex};

use crate::signal;  // Signalling message enum

// Mapping a string key to a Room data (defined in the struct)
// Mutex provides mutual exclusion so only one task/thread can read or write to the inner HashMap at any given millisecond
// Arc gives you shared ownership at runtime so that we can increment the reference count via an atomic reference counter (arc) everytime you clone (shallow copy)

// Channel Sender alias (channels are split into tx and rx)
type PeerTx = mpsc::Sender<SignallingMessage>;

// What we store in a single room
pub struct Room {
    pub host_tx: PeerTx,
    pub client_tx: Option<PeerTx>,  // We dont have this value until the client joins
}

pub type MappedRoom = Arc<Mutex<HashMap<String, Room>>>;





/*
async fn channel() {

    // Sender and Receiver tx rx within the channel cap 32
    let (tx, mut rx) = mpsc::channel(32);



    // You can send from multiple tasks if you clone the sender
    // e.g. let tx2 = tx.clone(); cant clone receiver in mpsc

    // In the cases of using tx and rx you use .await because you need to wait until the message is removed




}
*/