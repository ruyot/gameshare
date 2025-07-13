use tokio::io::{self, AsyncBufReadExt};
use webrtc::api::{APIBuilder, media_engine::MediaEngine};
use webrtc::peer_connection::configuration::RTCConfiguration;
use webrtc::peer_connection::RTCPeerConnection;
use webrtc::rtc_session_description::RTCSessionDescription;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Setup WebRTC API
    let mut m = MediaEngine::default();
    m.register_default_codecs()?;
    let api = APIBuilder::new().with_media_engine(m).build();

    // 2. Create PeerConnection
    let pc: RTCPeerConnection = api.new_peer_connection(RTCConfiguration::default()).await?;

    // TODO: hook a real capture track here (desktop/game window capture)
    // For MVP, we skip actual media and focus on SDP exchange.

    // 3. Create offer and print to stdout
    let offer = pc.create_offer(None).await?;
    pc.set_local_description(offer.clone()).await?;
    let sdp = serde_json::to_string(&offer)?;
    println!("OFFER:{}", sdp);

    // 4. Read remote answer from stdin
    let stdin = io::BufReader::new(io::stdin());
    let mut lines = stdin.lines();
    while let Some(line) = lines.next_line().await? {
        if let Some(json) = line.strip_prefix("ANSWER:") {
            let answer: RTCSessionDescription = serde_json::from_str(json)?;
            pc.set_remote_description(answer).await?;
            break;
        }
    }

    // Keep alive until connection closes
    pc.on_peer_connection_state_change(Box::new(move |state| {
        println!("PC State: {:?}", state);
        Box::pin(async {})
    })).await;

    // Prevent exit
    loop { tokio::time::sleep(tokio::time::Duration::from_secs(1)).await; }
}