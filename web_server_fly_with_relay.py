#!/usr/bin/env python3
"""
Web server for Fly.io deployment with WebSocket relay proxy
"""

import http.server
import socketserver
import os
import json
import asyncio
import websockets
from urllib.parse import urlparse, parse_qs
import threading

PORT = int(os.environ.get('PORT', 8080))
HOST = '0.0.0.0'

# SocketsBay configuration
SOCKETSBAY_API_KEY = os.environ.get('SOCKETSBAY_API_KEY', 'YOUR_API_KEY_HERE')
SOCKETSBAY_URL = f'wss://socketsbay.com/wss/v2/1/{SOCKETSBAY_API_KEY}/'

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

# WebSocket relay handler
async def relay_handler(websocket, path):
    """Handle WebSocket connections and relay to SocketsBay"""
    print(f"New WebSocket connection from {websocket.remote_address}")
    
    socketsbay_ws = None
    try:
        # Connect to SocketsBay
        socketsbay_ws = await websockets.connect(SOCKETSBAY_URL)
        print("Connected to SocketsBay relay")
        
        # Send connection confirmation
        await websocket.send(json.dumps({'type': 'relay-connected'}))
        
        # Create tasks for bidirectional message forwarding
        async def forward_to_socketsbay():
            try:
                async for message in websocket:
                    await socketsbay_ws.send(message)
            except websockets.exceptions.ConnectionClosed:
                pass
        
        async def forward_from_socketsbay():
            try:
                async for message in socketsbay_ws:
                    await websocket.send(message)
            except websockets.exceptions.ConnectionClosed:
                pass
        
        # Run both forwarding tasks concurrently
        await asyncio.gather(
            forward_to_socketsbay(),
            forward_from_socketsbay()
        )
        
    except Exception as e:
        print(f"Relay error: {e}")
        try:
            await websocket.send(json.dumps({
                'type': 'relay-error',
                'error': str(e)
            }))
        except:
            pass
    finally:
        if socketsbay_ws:
            await socketsbay_ws.close()
        print("WebSocket connection closed")

# Start WebSocket server in a separate thread
def start_websocket_server():
    new_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(new_loop)
    
    ws_port = 3001
    start_server = websockets.serve(relay_handler, '0.0.0.0', ws_port)
    
    print(f"WebSocket relay server starting on port {ws_port}")
    new_loop.run_until_complete(start_server)
    new_loop.run_forever()

# Start the WebSocket server in a background thread
ws_thread = threading.Thread(target=start_websocket_server, daemon=True)
ws_thread.start()

print(f"Starting HTTP server on {HOST}:{PORT}")
print(f"Using SocketsBay API key: {SOCKETSBAY_API_KEY[:8]}...")
print("\nServer endpoints:")
print(f"  HTTP: http://localhost:{PORT}")
print(f"  WebSocket Relay: ws://localhost:3001")
print("\nEnvironment:")
print(f"  FLY_APP_NAME: {os.environ.get('FLY_APP_NAME', 'Not on Fly.io')}")
print(f"  SOCKETSBAY_API_KEY: {'Set' if SOCKETSBAY_API_KEY != 'YOUR_API_KEY_HERE' else 'Not set'}")

try:
    with socketserver.TCPServer((HOST, PORT), MyHandler) as httpd:
        httpd.serve_forever()
except OSError as e:
    if e.errno == 10013:
        print(f"\nError: Port {PORT} is already in use")
    else:
        print(f"\nError: {e}")
except KeyboardInterrupt:
    print("\nServer stopped.")