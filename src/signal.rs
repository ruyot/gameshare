use serde::{Serialize, Deserialize};

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
    Error {
        error_message: String,
    },
}