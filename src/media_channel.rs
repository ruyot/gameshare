use std::{error::Error, sync::Arc};
use webrtc::{media_stream::{Track, track_local::TrackLocal}};
use webrtc::media_stream::track_local::static_sample::TrackLocalStaticSample;
use bytes::BytesMut;
use rtc::{media_stream::MediaStreamTrackState, shared::marshal::Unmarshal};
use rtc::rtp;

pub async fn media_channel_helper(track : Arc<TrackLocalStaticSample>, ssrc : u32) -> Result<(), Box<dyn Error + Send + Sync>>{
    
    let track_status = track.ready_state().await;

    match track_status {
        MediaStreamTrackState::Unspecified => {
            println!("Media Channel Unknown");
        }

        MediaStreamTrackState::Live => {
            println!("Media Channel Created!");

            // Listening for incoming rtp packets from ffmpeg via udp listener
            let addr = "";

            let socket = std::net::UdpSocket::bind(addr);

            match socket { 
                Ok(socket) => {
                    println!("binded to socket address successfully");

                    let mut buf = [0u8 ; 1500];
                    
                    loop {
                        let listener = socket.recv(&mut buf);

                        match listener {
                            Ok(packet_size) => {
                                // Retain only the message itself from the buffer through slicing
                                let mut message = BytesMut::from(&buf[..packet_size]);

                                match rtp::packet::Packet::unmarshal(&mut message) { 
                                    Ok(mut message) => {
                                        message.header.ssrc = ssrc;
                                        if let Err(_) = track.write_rtp(message).await {
                                            return Err("write rtp error".into())
                                        }
                                    }

                                    Err(_) => {
                                        return Err("rtp unmarshal error".into())
                                    }

                                };
                            }

                            Err(_) =>  {
                                return Err("failed to read incoming packet on the socket address".into());
                                }
                            };
                        }
                    }

                    Err(_) => {
                        return Err("failed to bind to socket address".into())
                    }
                };
            }

        MediaStreamTrackState::Ended => {
            println!("Media Channel Ended");
        }
    };

    Ok(())
}