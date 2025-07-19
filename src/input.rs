use anyhow::Result;
use evdev::{uinput::VirtualDeviceBuilder, AttributeSet, EventType, Key, RelativeAxisType};
use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::os::unix::fs::OpenOptionsExt;
use std::sync::Arc;
use tokio::sync::mpsc;
use tracing::{debug, error, info, warn};

use crate::config::Config;
use crate::error::GameShareError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GameInputEvent {
    MouseMove { dx: i32, dy: i32 },
    MouseButton { button: MouseButton, pressed: bool },
    MouseWheel { dx: i32, dy: i32 },
    KeyboardKey { key: u32, pressed: bool },
    KeyboardModifier { modifier: KeyModifier, pressed: bool },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MouseButton {
    Left,
    Right, 
    Middle,
    Extra1,
    Extra2,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum KeyModifier {
    Ctrl,
    Alt,
    Shift,
    Super,
}

pub struct InputHandler {
    config: Arc<Config>,
    virtual_mouse: Option<evdev::Device>,
    virtual_keyboard: Option<evdev::Device>,
    event_receiver: mpsc::Receiver<GameInputEvent>,
    event_sender: mpsc::Sender<GameInputEvent>,
}

impl InputHandler {
    pub async fn new(config: &Config) -> Result<Self> {
        let config = Arc::new(config.clone());
        let (event_sender, event_receiver) = mpsc::channel(1000);

        let mut handler = Self {
            config: config.clone(),
            virtual_mouse: None,
            virtual_keyboard: None,
            event_receiver,
            event_sender,
        };

        if config.input.enable_mouse {
            handler.initialize_virtual_mouse().await?;
        }

        if config.input.enable_keyboard {
            handler.initialize_virtual_keyboard().await?;
        }

        info!("Input handler initialized successfully");
        Ok(handler)
    }

    async fn initialize_virtual_mouse(&mut self) -> Result<()> {
        let mut mouse_keys = AttributeSet::<Key>::new();
        mouse_keys.insert(Key::BTN_LEFT);
        mouse_keys.insert(Key::BTN_RIGHT);
        mouse_keys.insert(Key::BTN_MIDDLE);
        mouse_keys.insert(Key::BTN_SIDE);
        mouse_keys.insert(Key::BTN_EXTRA);

        let mut relative_axes = AttributeSet::<RelativeAxisType>::new();
        relative_axes.insert(RelativeAxisType::REL_X);
        relative_axes.insert(RelativeAxisType::REL_Y);
        relative_axes.insert(RelativeAxisType::REL_WHEEL);
        relative_axes.insert(RelativeAxisType::REL_HWHEEL);

        let virtual_mouse = VirtualDeviceBuilder::new()?
            .name("GameShare Virtual Mouse")
            .with_keys(&mouse_keys)?
            .with_relative_axes(&relative_axes)?
            .build()?;

        info!("Virtual mouse device created: {}", virtual_mouse.name().unwrap_or("unknown"));
        self.virtual_mouse = Some(virtual_mouse);
        Ok(())
    }

    async fn initialize_virtual_keyboard(&mut self) -> Result<()> {
        let mut keyboard_keys = AttributeSet::<Key>::new();
        
        // Add all standard keys
        for key_code in 0..255u16 {
            if let Ok(key) = Key::new(key_code) {
                keyboard_keys.insert(key);
            }
        }

        let virtual_keyboard = VirtualDeviceBuilder::new()?
            .name("GameShare Virtual Keyboard")
            .with_keys(&keyboard_keys)?
            .build()?;

        info!("Virtual keyboard device created: {}", virtual_keyboard.name().unwrap_or("unknown"));
        self.virtual_keyboard = Some(virtual_keyboard);
        Ok(())
    }

    pub async fn handle_input_event(&mut self, event: GameInputEvent) -> Result<()> {
        match event {
            GameInputEvent::MouseMove { dx, dy } => {
                self.handle_mouse_move(dx, dy).await?;
            }
            GameInputEvent::MouseButton { button, pressed } => {
                self.handle_mouse_button(button, pressed).await?;
            }
            GameInputEvent::MouseWheel { dx, dy } => {
                self.handle_mouse_wheel(dx, dy).await?;
            }
            GameInputEvent::KeyboardKey { key, pressed } => {
                self.handle_keyboard_key(key, pressed).await?;
            }
            GameInputEvent::KeyboardModifier { modifier, pressed } => {
                self.handle_keyboard_modifier(modifier, pressed).await?;
            }
        }

        Ok(())
    }

    async fn handle_mouse_move(&mut self, dx: i32, dy: i32) -> Result<()> {
        if let Some(ref mut mouse) = self.virtual_mouse {
            let sensitivity = self.config.input.mouse_sensitivity;
            let adjusted_dx = (dx as f32 * sensitivity) as i32;
            let adjusted_dy = (dy as f32 * sensitivity) as i32;

            let events = [
                evdev::InputEvent::new(EventType::EV_REL, RelativeAxisType::REL_X.0, adjusted_dx),
                evdev::InputEvent::new(EventType::EV_REL, RelativeAxisType::REL_Y.0, adjusted_dy),
                evdev::InputEvent::new(EventType::EV_SYN, 0, 0),
            ];

            for event in events {
                mouse.emit(&[event]).map_err(|e| {
                    GameShareError::input(format!("Failed to emit mouse move event: {}", e))
                })?;
            }

            debug!("Mouse move: dx={}, dy={}", adjusted_dx, adjusted_dy);
        }

        Ok(())
    }

    async fn handle_mouse_button(&mut self, button: MouseButton, pressed: bool) -> Result<()> {
        if let Some(ref mut mouse) = self.virtual_mouse {
            let key = match button {
                MouseButton::Left => Key::BTN_LEFT,
                MouseButton::Right => Key::BTN_RIGHT,
                MouseButton::Middle => Key::BTN_MIDDLE,
                MouseButton::Extra1 => Key::BTN_SIDE,
                MouseButton::Extra2 => Key::BTN_EXTRA,
            };

            let value = if pressed { 1 } else { 0 };
            
            let events = [
                evdev::InputEvent::new(EventType::EV_KEY, key.code(), value),
                evdev::InputEvent::new(EventType::EV_SYN, 0, 0),
            ];

            for event in events {
                mouse.emit(&[event]).map_err(|e| {
                    GameShareError::input(format!("Failed to emit mouse button event: {}", e))
                })?;
            }

            debug!("Mouse button {:?}: {}", button, if pressed { "pressed" } else { "released" });
        }

        Ok(())
    }

    async fn handle_mouse_wheel(&mut self, dx: i32, dy: i32) -> Result<()> {
        if let Some(ref mut mouse) = self.virtual_mouse {
            let mut events = Vec::new();

            if dy != 0 {
                events.push(evdev::InputEvent::new(EventType::EV_REL, RelativeAxisType::REL_WHEEL.0, dy));
            }

            if dx != 0 {
                events.push(evdev::InputEvent::new(EventType::EV_REL, RelativeAxisType::REL_HWHEEL.0, dx));
            }

            events.push(evdev::InputEvent::new(EventType::EV_SYN, 0, 0));

            for event in events {
                mouse.emit(&[event]).map_err(|e| {
                    GameShareError::input(format!("Failed to emit mouse wheel event: {}", e))
                })?;
            }

            debug!("Mouse wheel: dx={}, dy={}", dx, dy);
        }

        Ok(())
    }

    async fn handle_keyboard_key(&mut self, key_code: u32, pressed: bool) -> Result<()> {
        if let Some(ref mut keyboard) = self.virtual_keyboard {
            let value = if pressed { 1 } else { 0 };

            let events = [
                evdev::InputEvent::new(EventType::EV_KEY, key_code, value),
                evdev::InputEvent::new(EventType::EV_SYN, 0, 0),
            ];

            for event in events {
                keyboard.emit(&[event]).map_err(|e| {
                    GameShareError::input(format!("Failed to emit keyboard event: {}", e))
                })?;
            }

            debug!("Keyboard key {}: {}", key_code, if pressed { "pressed" } else { "released" });
        }

        Ok(())
    }

    async fn handle_keyboard_modifier(&mut self, modifier: KeyModifier, pressed: bool) -> Result<()> {
        let key_code = match modifier {
            KeyModifier::Ctrl => Key::KEY_LEFTCTRL.code(),
            KeyModifier::Alt => Key::KEY_LEFTALT.code(),
            KeyModifier::Shift => Key::KEY_LEFTSHIFT.code(),
            KeyModifier::Super => Key::KEY_LEFTMETA.code(),
        };

        self.handle_keyboard_key(key_code as u32, pressed).await
    }

    pub fn get_event_sender(&self) -> mpsc::Sender<GameInputEvent> {
        self.event_sender.clone()
    }

    pub async fn process_events(&mut self) -> Result<()> {
        while let Some(event) = self.event_receiver.recv().await {
            if let Err(e) = self.handle_input_event(event).await {
                error!("Error processing input event: {}", e);
            }
        }
        Ok(())
    }
}

pub fn check_uinput_permissions() -> Result<bool> {
    // Try to open /dev/uinput for writing
    match OpenOptions::new()
        .write(true)
        .mode(0o200)
        .open("/dev/uinput")
    {
        Ok(_) => Ok(true),
        Err(e) => {
            warn!("Cannot access /dev/uinput: {}", e);
            Ok(false)
        }
    }
}

// Helper function to convert web key codes to Linux key codes
pub fn web_key_to_linux_key(web_key: &str) -> Option<u32> {
    match web_key {
        "KeyA" => Some(Key::KEY_A.code() as u32),
        "KeyB" => Some(Key::KEY_B.code() as u32),
        "KeyC" => Some(Key::KEY_C.code() as u32),
        "KeyD" => Some(Key::KEY_D.code() as u32),
        "KeyE" => Some(Key::KEY_E.code() as u32),
        "KeyF" => Some(Key::KEY_F.code() as u32),
        "KeyG" => Some(Key::KEY_G.code() as u32),
        "KeyH" => Some(Key::KEY_H.code() as u32),
        "KeyI" => Some(Key::KEY_I.code() as u32),
        "KeyJ" => Some(Key::KEY_J.code() as u32),
        "KeyK" => Some(Key::KEY_K.code() as u32),
        "KeyL" => Some(Key::KEY_L.code() as u32),
        "KeyM" => Some(Key::KEY_M.code() as u32),
        "KeyN" => Some(Key::KEY_N.code() as u32),
        "KeyO" => Some(Key::KEY_O.code() as u32),
        "KeyP" => Some(Key::KEY_P.code() as u32),
        "KeyQ" => Some(Key::KEY_Q.code() as u32),
        "KeyR" => Some(Key::KEY_R.code() as u32),
        "KeyS" => Some(Key::KEY_S.code() as u32),
        "KeyT" => Some(Key::KEY_T.code() as u32),
        "KeyU" => Some(Key::KEY_U.code() as u32),
        "KeyV" => Some(Key::KEY_V.code() as u32),
        "KeyW" => Some(Key::KEY_W.code() as u32),
        "KeyX" => Some(Key::KEY_X.code() as u32),
        "KeyY" => Some(Key::KEY_Y.code() as u32),
        "KeyZ" => Some(Key::KEY_Z.code() as u32),
        "Space" => Some(Key::KEY_SPACE.code() as u32),
        "Enter" => Some(Key::KEY_ENTER.code() as u32),
        "Escape" => Some(Key::KEY_ESC.code() as u32),
        "ArrowUp" => Some(Key::KEY_UP.code() as u32),
        "ArrowDown" => Some(Key::KEY_DOWN.code() as u32),
        "ArrowLeft" => Some(Key::KEY_LEFT.code() as u32),
        "ArrowRight" => Some(Key::KEY_RIGHT.code() as u32),
        _ => None,
    }
} 