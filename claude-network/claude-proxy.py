#!/usr/bin/env python3
"""
Claude Network Proxy Server - Production Ready
Allows iPad and Web Claude to communicate with Firebase via Desktop relay
Uses only Python standard library - no external dependencies
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime
import threading
import time
import socket
import logging

# Configuration
FIREBASE_URL = "https://home-claude-network-default-rtdb.firebaseio.com"
PORT = 8080

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/home/alton/vayu-learning-project/claude-network/proxy.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ClaudeProxyHandler(BaseHTTPRequestHandler):
    """Handle HTTP requests and proxy them to Firebase"""

    def log_message(self, format, *args):
        """Override to use our logger"""
        logger.info("%s - %s" % (self.address_string(), format % args))

    def _set_cors_headers(self):
        """Set CORS headers to allow requests from anywhere"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _send_json(self, data, status=200):
        """Send JSON response"""
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode())

    def _send_html(self, html):
        """Send HTML response"""
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(html.encode())

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        try:
            if self.path == '/' or self.path == '/status':
                # Status page
                html = self._generate_status_page()
                self._send_html(html)

            elif self.path.startswith('/messages'):
                # Get messages, optionally filtered by agent
                query = urllib.parse.urlparse(self.path).query
                params = urllib.parse.parse_qs(query)
                agent_id = params.get('agent', [''])[0]
                limit = int(params.get('limit', ['10'])[0])

                req = urllib.request.Request(f"{FIREBASE_URL}/messages.json")
                with urllib.request.urlopen(req, timeout=10) as response:
                    messages = json.loads(response.read().decode())

                # Filter and format
                msg_list = []
                if messages:
                    for msg_id, msg_data in messages.items():
                        # Filter out agent's own messages if agent specified
                        if agent_id and msg_data.get('from') == agent_id:
                            continue
                        msg_data['id'] = msg_id
                        msg_list.append(msg_data)

                # Sort by timestamp
                msg_list.sort(key=lambda x: x.get('timestamp', ''))

                self._send_json(msg_list[-limit:])
                logger.info(f"Sent {len(msg_list[-limit:])} messages to {agent_id or 'all'}")

            elif self.path == '/mission':
                # Get current mission
                req = urllib.request.Request(f"{FIREBASE_URL}/mission.json")
                with urllib.request.urlopen(req, timeout=10) as response:
                    mission = json.loads(response.read().decode())

                self._send_json(mission)
                logger.info("Sent mission data")

            elif self.path == '/agents':
                # Get all agents
                req = urllib.request.Request(f"{FIREBASE_URL}/agents.json")
                with urllib.request.urlopen(req, timeout=10) as response:
                    agents = json.loads(response.read().decode())

                self._send_json(agents or {})
                logger.info("Sent agents data")

            elif self.path == '/observations':
                # Get observations
                req = urllib.request.Request(f"{FIREBASE_URL}/observations.json")
                with urllib.request.urlopen(req, timeout=10) as response:
                    observations = json.loads(response.read().decode())

                obs_list = []
                if observations:
                    for obs_id, obs_data in observations.items():
                        obs_data['id'] = obs_id
                        obs_list.append(obs_data)

                obs_list.sort(key=lambda x: x.get('timestamp', ''))
                self._send_json(obs_list[-20:])
                logger.info(f"Sent {len(obs_list[-20:])} observations")

            else:
                self._send_json({"error": "Not found"}, 404)

        except urllib.error.URLError as e:
            logger.error(f"Firebase connection error: {e}")
            self._send_json({"error": "Cannot connect to Firebase", "detail": str(e)}, 503)
        except Exception as e:
            logger.error(f"Error handling GET: {e}")
            self._send_json({"error": str(e)}, 500)

    def do_POST(self):
        """Handle POST requests"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode())

            if self.path == '/send':
                # Send message to Firebase
                agent_id = data.get('agent', 'unknown')
                message = data.get('message', '')
                msg_type = data.get('type', 'status')
                target = data.get('target')

                payload = {
                    "from": agent_id,
                    "type": msg_type,
                    "message": message,
                    "timestamp": datetime.now().isoformat(),
                    "target": target
                }

                req = urllib.request.Request(
                    f"{FIREBASE_URL}/messages.json",
                    data=json.dumps(payload).encode(),
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )

                with urllib.request.urlopen(req, timeout=10) as response:
                    result = json.loads(response.read().decode())

                self._send_json({"status": "sent", "id": result.get('name')})
                logger.info(f"Message sent from {agent_id}: {message[:50]}...")

            elif self.path == '/register':
                # Register agent
                agent_id = data.get('agent', 'unknown')
                agent_data = {
                    "status": data.get('status', 'online'),
                    "location": data.get('location', 'unknown'),
                    "activity": data.get('activity', 'idle'),
                    "last_update": datetime.now().isoformat()
                }

                req = urllib.request.Request(
                    f"{FIREBASE_URL}/agents/{agent_id}.json",
                    data=json.dumps(agent_data).encode(),
                    headers={'Content-Type': 'application/json'},
                    method='PUT'
                )

                with urllib.request.urlopen(req, timeout=10) as response:
                    result = json.loads(response.read().decode())

                self._send_json({"status": "registered", "agent": agent_id, "data": result})
                logger.info(f"Agent registered: {agent_id}")

            elif self.path == '/observe':
                # Add observation
                agent_id = data.get('agent', 'unknown')
                obs_type = data.get('type', 'general')
                obs_data = data.get('data', {})

                observation = {
                    "agent": agent_id,
                    "type": obs_type,
                    "data": obs_data,
                    "timestamp": datetime.now().isoformat()
                }

                req = urllib.request.Request(
                    f"{FIREBASE_URL}/observations.json",
                    data=json.dumps(observation).encode(),
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )

                with urllib.request.urlopen(req, timeout=10) as response:
                    result = json.loads(response.read().decode())

                self._send_json({"status": "recorded", "id": result.get('name')})
                logger.info(f"Observation recorded from {agent_id}: {obs_type}")

            elif self.path == '/mission/update':
                # Update mission
                updates = data.get('updates', {})

                req = urllib.request.Request(
                    f"{FIREBASE_URL}/mission.json",
                    data=json.dumps(updates).encode(),
                    headers={'Content-Type': 'application/json'},
                    method='PATCH'
                )

                with urllib.request.urlopen(req, timeout=10) as response:
                    result = json.loads(response.read().decode())

                self._send_json({"status": "updated", "mission": result})
                logger.info(f"Mission updated: {updates}")

            else:
                self._send_json({"error": "Not found"}, 404)

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON: {e}")
            self._send_json({"error": "Invalid JSON"}, 400)
        except urllib.error.URLError as e:
            logger.error(f"Firebase connection error: {e}")
            self._send_json({"error": "Cannot connect to Firebase", "detail": str(e)}, 503)
        except Exception as e:
            logger.error(f"Error handling POST: {e}")
            self._send_json({"error": str(e)}, 500)

    def _generate_status_page(self):
        """Generate HTML status page"""
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)

        return f"""
<!DOCTYPE html>
<html>
<head>
    <title>Claude Network Proxy</title>
    <style>
        body {{ font-family: monospace; margin: 40px; background: #1e1e1e; color: #d4d4d4; }}
        h1 {{ color: #4ec9b0; }}
        .status {{ color: #4ec9b0; font-weight: bold; }}
        .endpoint {{ background: #2d2d2d; padding: 10px; margin: 10px 0; border-left: 3px solid #569cd6; }}
        code {{ color: #ce9178; }}
        .url {{ color: #9cdcfe; }}
        pre {{ background: #2d2d2d; padding: 15px; overflow-x: auto; }}
    </style>
</head>
<body>
    <h1>🤖 Claude Network Proxy Server</h1>
    <p class="status">Status: ONLINE ✓</p>
    <p>Server Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>

    <h2>Access URLs:</h2>
    <p class="url">Local: http://localhost:{PORT}</p>
    <p class="url">Network: http://{local_ip}:{PORT}</p>

    <h2>API Endpoints:</h2>

    <div class="endpoint">
        <h3>GET /messages?agent=ID&limit=N</h3>
        <p>Get recent messages from the network</p>
        <pre>curl "http://{local_ip}:{PORT}/messages?agent=ipad&limit=5"</pre>
    </div>

    <div class="endpoint">
        <h3>POST /send</h3>
        <p>Send a message to the network</p>
        <pre>curl -X POST "http://{local_ip}:{PORT}/send" \\
  -H "Content-Type: application/json" \\
  -d '{{"agent":"ipad","message":"Hello from iPad!","type":"status"}}'</pre>
    </div>

    <div class="endpoint">
        <h3>POST /register</h3>
        <p>Register an agent on the network</p>
        <pre>curl -X POST "http://{local_ip}:{PORT}/register" \\
  -H "Content-Type: application/json" \\
  -d '{{"agent":"ipad","location":"mobile","activity":"scout"}}'</pre>
    </div>

    <div class="endpoint">
        <h3>GET /mission</h3>
        <p>Get current mission</p>
        <pre>curl "http://{local_ip}:{PORT}/mission"</pre>
    </div>

    <div class="endpoint">
        <h3>GET /agents</h3>
        <p>Get all connected agents</p>
        <pre>curl "http://{local_ip}:{PORT}/agents"</pre>
    </div>

    <div class="endpoint">
        <h3>POST /observe</h3>
        <p>Submit an observation</p>
        <pre>curl -X POST "http://{local_ip}:{PORT}/observe" \\
  -H "Content-Type: application/json" \\
  -d '{{"agent":"ipad","type":"room","data":{{"name":"kitchen"}}}}'</pre>
    </div>

    <h2>Firebase Backend:</h2>
    <p class="url">{FIREBASE_URL}</p>

    <h2>Logs:</h2>
    <p>Log file: <code>/home/alton/vayu-learning-project/claude-network/proxy.log</code></p>
</body>
</html>
"""

def run_server(port=PORT):
    """Run the proxy server"""
    server_address = ('0.0.0.0', port)
    httpd = HTTPServer(server_address, ClaudeProxyHandler)

    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)

    logger.info("=" * 70)
    logger.info("Claude Network Proxy Server STARTING")
    logger.info("=" * 70)
    logger.info(f"Server accessible at:")
    logger.info(f"  Local:   http://localhost:{port}")
    logger.info(f"  Network: http://{local_ip}:{port}")
    logger.info(f"  Status page: http://{local_ip}:{port}/status")
    logger.info(f"Firebase backend: {FIREBASE_URL}")
    logger.info(f"Log file: /home/alton/vayu-learning-project/claude-network/proxy.log")
    logger.info("=" * 70)
    logger.info("Server ready! iPad and Web Claude can now connect.")
    logger.info("Press Ctrl+C to stop the server")
    logger.info("=" * 70)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("\nShutting down server...")
        httpd.shutdown()
        logger.info("Server stopped.")

if __name__ == '__main__':
    run_server()
