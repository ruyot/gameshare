use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]

enum SignalingMessage {
    Assign {
    },
    Assigned {
        room_id: String,
    },
    Join {
        room_id: String,
    },
    Relay {
        payload: String,
    },
    Error {
        error_id: String,
        error_message: String,
    },
}