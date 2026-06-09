#!/bin/bash
# Restart Claude Network Proxy Server

cd /home/alton/vayu-learning-project/claude-network

echo "Restarting proxy server..."
./stop-proxy.sh
sleep 1
./start-proxy.sh
