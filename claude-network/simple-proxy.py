#!/usr/bin/env python3
"""
Simple HTTP Proxy Server - No external dependencies
Allows iPad/Web Claude to communicate with Firebase via Desktop Claude
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.request
import urllib.parse
from datetime import datetime

FIREBASE_URL = "https://home-claude-network-default-rtdb.firebaseio.com"

class ProxyHandler(BaseHTTPRequestHandler):

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            html = """
            <h1>Claude Network Proxy</h1>
            <p>Status: Running</p>
            <p>Use curl to interact:</p>
            <pre>
# Send message
curl -X POST http://THISIP:8080/send -d '{"agent":"ipad","message":"Hello!"}'

# Read messages
curl http://THISIP:8080/messages?agent=ipad

# Get mission
curl http://THISIP:8080/mission
            </pre>
            """
            self.wfile.write(html.encode())

        elif self.path.startswith('/messages'):
            # Parse query params
            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            agent_id = params.get('agent', ['unknown'])[0]

            # Get messages from Firebase
            req = urllib.request.Request(f"{FIREBASE_URL}/messages.json")
            with urllib.request.urlopen(req) as response:
                messages = json.loads(response.read().decode())

            # Filter and format
            msg_list = []
            if messages:
                for msg_id, msg_data in messages.items():
                    if msg_data.get('from') != agent_id:
                        msg_list.append(msg_data)

            self._send_json(msg_list[-10:])

        elif self.path == '/mission':
            # Get mission from Firebase
            req = urllib.request.Request(f"{FIREBASE_URL}/mission.json")
            with urllib.request.urlopen(req) as response:
                mission = json.loads(response.read().decode())

            self._send_json(mission)

    def do_POST(self):
        """Handle POST requests"""
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data.decode())

        if self.path == '/send':
            # Send message to Firebase
            agent_id = data.get('agent', 'unknown')
            message = data.get('message', '')

            payload = {
                "from": agent_id,
                "message": message,
                "timestamp": datetime.now().isoformat()
            }

            req = urllib.request.Request(
                f"{FIREBASE_URL}/messages.json",
                data=json.dumps(payload).encode(),
                headers={'Content-Type': 'application/json'},
                method='POST'
            )

            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode())

            self._send_json({"status": "sent", "id": result.get('name')})

        elif self.path == '/register':
            # Register agent via Firebase
            agent_id = data.get('agent', 'unknown')
            agent_data = {
                "status": "online",
                "location": data.get('location', 'mobile'),
                "activity": data.get('activity', 'exploring'),
                "last_update": datetime.now().isoformat()
            }

            req = urllib.request.Request(
                f"{FIREBASE_URL}/agents/{agent_id}.json",
                data=json.dumps(agent_data).encode(),
                headers={'Content-Type': 'application/json'},
                method='PUT'
            )

            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode())

            self._send_json({"status": "registered", "agent": agent_id})

if __name__ == '__main__':
    import socket

    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)

    print("=" * 60)
    print("Claude Network Proxy Server")
    print("=" * 60)
    print(f"\nAccess from:")
    print(f"  This machine: http://localhost:8080")
    print(f"  iPad/Network: http://{local_ip}:8080")
    print()
    print("Starting server...")
    print("=" * 60)

    server = HTTPServer(('0.0.0.0', 8080), ProxyHandler)
    server.serve_forever()
