use serde::{Serialize, Deserialize};


// Enum message variants for the signalling server
#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")] // Internal tagging type will be the variant name
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

// Enum input variants for the data channel
#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum InputMessage {
    Up {
        triggered: bool,
    },
    Down {
        triggered: bool,
    },
    Left {
        triggered: bool,
    },
    Right {
        triggered: bool,
    },
}