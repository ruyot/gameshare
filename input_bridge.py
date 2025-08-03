#!/usr/bin/env python3
"""
GameShare Input Bridge - Simulates keyboard and mouse input on Windows
This bridges between the browser WebRTC client and actual system input
"""

import asyncio
import websockets
import json
import sys
import logging
from typing import Dict, Any

# Platform-specific imports
if sys.platform == "win32":
    import win32api
    import win32con
    import ctypes
    from ctypes import wintypes
    
    # Windows virtual key codes
    VK_CODES = {
        'Enter': win32con.VK_RETURN,
        'Escape': win32con.VK_ESCAPE,
        'Tab': win32con.VK_TAB,
        'Backspace': win32con.VK_BACK,
        'Delete': win32con.VK_DELETE,
        'ArrowUp': win32con.VK_UP,
        'ArrowDown': win32con.VK_DOWN,
        'ArrowLeft': win32con.VK_LEFT,
        'ArrowRight': win32con.VK_RIGHT,
        'Home': win32con.VK_HOME,
        'End': win32con.VK_END,
        'PageUp': win32con.VK_PRIOR,
        'PageDown': win32con.VK_NEXT,
        'Shift': win32con.VK_SHIFT,
        'Control': win32con.VK_CONTROL,
        'Alt': win32con.VK_MENU,
        ' ': win32con.VK_SPACE,
        'a': ord('A'), 'b': ord('B'), 'c': ord('C'), 'd': ord('D'),
        'e': ord('E'), 'f': ord('F'), 'g': ord('G'), 'h': ord('H'),
        'i': ord('I'), 'j': ord('J'), 'k': ord('K'), 'l': ord('L'),
        'm': ord('M'), 'n': ord('N'), 'o': ord('O'), 'p': ord('P'),
        'q': ord('Q'), 'r': ord('R'), 's': ord('S'), 't': ord('T'),
        'u': ord('U'), 'v': ord('V'), 'w': ord('W'), 'x': ord('X'),
        'y': ord('Y'), 'z': ord('Z'),
        '0': ord('0'), '1': ord('1'), '2': ord('2'), '3': ord('3'),
        '4': ord('4'), '5': ord('5'), '6': ord('6'), '7': ord('7'),
        '8': ord('8'), '9': ord('9'),
    }
    
    # Mouse button mappings
    MOUSE_BUTTONS = {
        0: (win32con.MOUSEEVENTF_LEFTDOWN, win32con.MOUSEEVENTF_LEFTUP),
        1: (win32con.MOUSEEVENTF_MIDDLEDOWN, win32con.MOUSEEVENTF_MIDDLEUP),
        2: (win32con.MOUSEEVENTF_RIGHTDOWN, win32con.MOUSEEVENTF_RIGHTUP),
    }
    
else:
    # For other platforms, we'll need different libraries
    # For now, just log
    VK_CODES = {}
    MOUSE_BUTTONS = {}

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class InputBridge:
    def __init__(self):
        self.screen_width = 1920  # Default, will be updated
        self.screen_height = 1080
        self.update_screen_size()
    
    def update_screen_size(self):
        """Update screen dimensions"""
        if sys.platform == "win32":
            user32 = ctypes.windll.user32
            self.screen_width = user32.GetSystemMetrics(0)
            self.screen_height = user32.GetSystemMetrics(1)
            logger.info(f"Screen size: {self.screen_width}x{self.screen_height}")
    
    def simulate_key(self, action: str, key: str, code: str = None, key_code: int = None):
        """Simulate keyboard input"""
        if sys.platform != "win32":
            logger.warning("Keyboard simulation not supported on this platform")
            return
        
        # Get virtual key code
        vk_code = VK_CODES.get(key)
        if not vk_code and key_code:
            vk_code = key_code
        if not vk_code and len(key) == 1:
            vk_code = ord(key.upper())
        
        if not vk_code:
            logger.warning(f"Unknown key: {key}")
            return
        
        # Simulate key press/release
        if action == "keydown":
            win32api.keybd_event(vk_code, 0, 0, 0)
            logger.debug(f"Key down: {key} (VK: {vk_code})")
        elif action == "keyup":
            win32api.keybd_event(vk_code, 0, win32con.KEYEVENTF_KEYUP, 0)
            logger.debug(f"Key up: {key} (VK: {vk_code})")
    
    def simulate_mouse_move(self, movement_x: float, movement_y: float):
        """Simulate relative mouse movement"""
        if sys.platform != "win32":
            logger.warning("Mouse simulation not supported on this platform")
            return
        
        # Get current position
        point = wintypes.POINT()
        ctypes.windll.user32.GetCursorPos(ctypes.byref(point))
        
        # Calculate new position
        new_x = point.x + int(movement_x)
        new_y = point.y + int(movement_y)
        
        # Set new position
        ctypes.windll.user32.SetCursorPos(new_x, new_y)
        logger.debug(f"Mouse move: {movement_x}, {movement_y}")
    
    def simulate_mouse_click(self, action: str, button: int, x: float = None, y: float = None):
        """Simulate mouse click"""
        if sys.platform != "win32":
            logger.warning("Mouse simulation not supported on this platform")
            return
        
        # If coordinates provided (normalized 0-1), convert to screen coordinates
        if x is not None and y is not None:
            screen_x = int(x * self.screen_width)
            screen_y = int(y * self.screen_height)
            ctypes.windll.user32.SetCursorPos(screen_x, screen_y)
        
        # Get button events
        button_events = MOUSE_BUTTONS.get(button)
        if not button_events:
            logger.warning(f"Unknown mouse button: {button}")
            return
        
        down_event, up_event = button_events
        
        # Simulate click
        if action == "mousedown":
            win32api.mouse_event(down_event, 0, 0, 0, 0)
            logger.debug(f"Mouse down: button {button}")
        elif action == "mouseup":
            win32api.mouse_event(up_event, 0, 0, 0, 0)
            logger.debug(f"Mouse up: button {button}")
    
    async def handle_input(self, message: Dict[str, Any]):
        """Handle input message from WebSocket"""
        input_type = message.get('type')
        
        if input_type in ('keydown', 'keyup'):
            self.simulate_key(
                input_type,
                message.get('key', ''),
                message.get('code'),
                message.get('keyCode')
            )
        
        elif input_type == 'mousemove':
            self.simulate_mouse_move(
                message.get('movementX', 0),
                message.get('movementY', 0)
            )
        
        elif input_type in ('mousedown', 'mouseup'):
            self.simulate_mouse_click(
                input_type,
                message.get('button', 0),
                message.get('x'),
                message.get('y')
            )


async def handle_connection(websocket, path):
    """Handle WebSocket connection"""
    bridge = InputBridge()
    logger.info(f"Client connected from {websocket.remote_address}")
    
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                await bridge.handle_input(data)
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON: {message}")
            except Exception as e:
                logger.error(f"Error handling input: {e}")
    
    except websockets.exceptions.ConnectionClosed:
        logger.info("Client disconnected")
    except Exception as e:
        logger.error(f"Connection error: {e}")


async def main():
    """Start the input bridge server"""
    port = 8765
    logger.info(f"Starting GameShare Input Bridge on port {port}")
    
    if sys.platform != "win32":
        logger.warning("This platform is not fully supported. Input simulation may not work.")
    
    # Start WebSocket server
    async with websockets.serve(handle_connection, "localhost", port):
        logger.info(f"Input bridge ready at ws://localhost:{port}")
        logger.info("Waiting for connections...")
        await asyncio.Future()  # Run forever


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Input bridge stopped")