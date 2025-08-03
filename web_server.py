#!/usr/bin/env python3
"""
Simple HTTP server that binds to all interfaces for network access
"""

import http.server
import socketserver
import os
import sys

# Change to the script directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

PORT = 8080
HOST = '0.0.0.0'  # Bind to all interfaces

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for cross-origin requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

print(f"Starting HTTP server on {HOST}:{PORT}")
print(f"Server will be accessible at:")
print(f"  - http://localhost:{PORT}")
print(f"  - http://127.0.0.1:{PORT}")

# Get all IP addresses
import socket
hostname = socket.gethostname()
try:
    # Get all IPs
    ips = socket.gethostbyname_ex(hostname)[2]
    for ip in ips:
        if not ip.startswith("127."):
            print(f"  - http://{ip}:{PORT}")
except:
    pass

print("\nPress Ctrl+C to stop the server")

try:
    with socketserver.TCPServer((HOST, PORT), MyHTTPRequestHandler) as httpd:
        httpd.serve_forever()
except OSError as e:
    if e.errno == 10013:  # Windows permission denied
        print(f"\nError: Port {PORT} is already in use or requires admin privileges")
        print("Try closing other applications using this port or run as administrator")
    else:
        print(f"\nError: {e}")
except KeyboardInterrupt:
    print("\nServer stopped.")