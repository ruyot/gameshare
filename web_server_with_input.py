#!/usr/bin/env python3
"""
Web server with input handling - no WebSocket needed
"""

import http.server
import socketserver
import os
import json
from pathlib import Path
from urllib.parse import urlparse

PORT = 8080
HOST = '0.0.0.0'

# Input directory for file-based IPC
INPUT_DIR = Path("gameshare_input")
INPUT_FILE = INPUT_DIR / "commands.txt"

# Ensure input directory exists
INPUT_DIR.mkdir(exist_ok=True)

class InputHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        """Handle POST requests for input commands"""
        if self.path == '/api/input':
            try:
                # Read the request body
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data)
                
                # Write commands to file
                commands = data.get('commands', '')
                if commands:
                    # Append to input file
                    with open(INPUT_FILE, 'a') as f:
                        f.write(commands)
                
                # Send success response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'ok'}).encode())
                
            except Exception as e:
                # Send error response
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            # Not found
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def end_headers(self):
        """Add CORS headers to all responses"""
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

print(f"Starting HTTP server on {HOST}:{PORT}")
print(f"Server will be accessible at:")
print(f"  - http://localhost:{PORT}")
print(f"  - http://127.0.0.1:{PORT}")

# Get all IP addresses
import socket
hostname = socket.gethostname()
try:
    ips = socket.gethostbyname_ex(hostname)[2]
    for ip in ips:
        if not ip.startswith("127."):
            print(f"  - http://{ip}:{PORT}")
except:
    pass

print("\nThis server includes input handling for GameShare")
print("No WebSocket needed - uses file-based IPC")
print("\nPress Ctrl+C to stop the server")

try:
    with socketserver.TCPServer((HOST, PORT), InputHandler) as httpd:
        httpd.serve_forever()
except OSError as e:
    if e.errno == 10013:
        print(f"\nError: Port {PORT} is already in use")
        print("Try closing other applications using this port")
    else:
        print(f"\nError: {e}")
except KeyboardInterrupt:
    print("\nServer stopped.")