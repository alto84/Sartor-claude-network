#!/usr/bin/env python3
"""
Claude Network Proxy Server
Runs on Desktop, allows iPad/Web Claude to communicate via local network
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Allow requests from any origin

FIREBASE_URL = "https://home-claude-network-default-rtdb.firebaseio.com"

@app.route('/send', methods=['POST'])
def send_message():
    """Receive message from iPad/Web Claude and relay to Firebase"""
    data = request.json
    agent_id = data.get('agent_id')
    message = data.get('message')
    msg_type = data.get('type', 'status')

    payload = {
        "from": agent_id,
        "type": msg_type,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }

    r = requests.post(f"{FIREBASE_URL}/messages.json", json=payload)
    return jsonify({"status": "sent", "firebase_response": r.json()})

@app.route('/read', methods=['GET'])
def read_messages():
    """Get messages from Firebase and return to iPad/Web Claude"""
    agent_id = request.args.get('agent_id')

    r = requests.get(f"{FIREBASE_URL}/messages.json")
    messages = r.json() or {}

    # Convert to list and filter
    msg_list = []
    for msg_id, msg_data in messages.items():
        # Don't return agent's own messages
        if msg_data.get('from') != agent_id:
            msg_data['id'] = msg_id
            msg_list.append(msg_data)

    # Sort by timestamp and return recent messages
    msg_list.sort(key=lambda x: x.get('timestamp', ''))
    return jsonify(msg_list[-10:])

@app.route('/mission', methods=['GET'])
def get_mission():
    """Get current mission from Firebase"""
    r = requests.get(f"{FIREBASE_URL}/mission.json")
    return jsonify(r.json())

@app.route('/register', methods=['POST'])
def register_agent():
    """Register an agent via proxy"""
    data = request.json
    agent_id = data.get('agent_id')

    agent_data = {
        "status": "online",
        "location": data.get('location', 'unknown'),
        "activity": data.get('activity', 'exploring'),
        "last_update": datetime.now().isoformat()
    }

    r = requests.put(f"{FIREBASE_URL}/agents/{agent_id}.json", json=agent_data)
    return jsonify({"status": "registered", "agent_id": agent_id})

@app.route('/')
def home():
    """Simple status page"""
    return """
    <h1>Claude Network Proxy Server</h1>
    <p>Status: Running</p>
    <p>Endpoints:</p>
    <ul>
        <li>POST /send - Send message to network</li>
        <li>GET /read?agent_id=X - Read messages</li>
        <li>GET /mission - Get current mission</li>
        <li>POST /register - Register agent</li>
    </ul>
    """

if __name__ == '__main__':
    print("=" * 60)
    print("Claude Network Proxy Server Starting...")
    print("=" * 60)
    print("\nThis server allows iPad and Web Claude to communicate")
    print("with Firebase through Desktop Claude as a relay.")
    print()

    import socket
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)

    print(f"Server will be accessible at:")
    print(f"  http://localhost:5000")
    print(f"  http://{local_ip}:5000")
    print()
    print("iPad/Web Claude can now connect via these URLs!")
    print("=" * 60)
    print()

    app.run(host='0.0.0.0', port=5000, debug=True)
