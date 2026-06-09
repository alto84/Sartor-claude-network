#!/bin/bash
# Start Claude Network Proxy Server

cd /home/alton/vayu-learning-project/claude-network

# Check if already running
if [ -f proxy.pid ]; then
    PID=$(cat proxy.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "Proxy server already running (PID: $PID)"
        exit 0
    fi
fi

# Start proxy in background
echo "Starting Claude Network Proxy Server..."
nohup python3 claude-proxy.py > proxy-output.log 2>&1 &
echo $! > proxy.pid

sleep 2

# Check if started successfully
if ps -p $(cat proxy.pid) > /dev/null 2>&1; then
    echo "✓ Proxy server started successfully!"
    echo "  PID: $(cat proxy.pid)"
    echo "  Status: http://localhost:8080/status"

    # Get IP address
    IP=$(hostname -I | awk '{print $1}')
    echo "  Network URL: http://$IP:8080"
    echo ""
    echo "Logs: tail -f /home/alton/vayu-learning-project/claude-network/proxy.log"
else
    echo "✗ Failed to start proxy server"
    exit 1
fi
