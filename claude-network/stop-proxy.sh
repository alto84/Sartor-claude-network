#!/bin/bash
# Stop Claude Network Proxy Server

cd /home/alton/vayu-learning-project/claude-network

if [ ! -f proxy.pid ]; then
    echo "Proxy server is not running (no PID file found)"
    exit 0
fi

PID=$(cat proxy.pid)

if ps -p $PID > /dev/null 2>&1; then
    echo "Stopping proxy server (PID: $PID)..."
    kill $PID
    sleep 1

    # Force kill if still running
    if ps -p $PID > /dev/null 2>&1; then
        echo "Force stopping..."
        kill -9 $PID
    fi

    rm proxy.pid
    echo "✓ Proxy server stopped"
else
    echo "Proxy server is not running (PID $PID not found)"
    rm proxy.pid
fi
