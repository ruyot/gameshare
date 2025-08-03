#!/usr/bin/env python3
"""
Web server for Fly.io deployment
"""

import http.server
import socketserver
import os
import json
from pathlib import Path
from urllib.parse import urlparse

# Get port from environment variable (Fly.io sets this)
PORT = int(os.environ.get('PORT', 8080))
HOST = '0.0.0.0'

class FlyHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        """Handle POST requests"""
        if self.path == '/api/input':
            # On Fly.io, we can't actually control local input
            # Just return success to avoid errors
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'ok',
                'message': 'Input commands received (no local processing on Fly.io)'
            }).encode())
        else:
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
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

print(f"Starting HTTP server on {HOST}:{PORT}")
print("Running on Fly.io platform")
print(f"Server will be accessible at the Fly.io URL")

try:
    with socketserver.TCPServer((HOST, PORT), FlyHandler) as httpd:
        httpd.serve_forever()
except OSError as e:
    print(f"Error: {e}")
except KeyboardInterrupt:
    print("Server stopped.")