#!/bin/bash

echo "📊 OHW Mobile Application Status"
echo "================================"
echo ""

# Check if we're in Termux
if [ ! -d "/data/data/com.termux" ]; then
    echo "❌ This script is designed for Termux on Android"
    exit 1
fi

# Set working directory
cd ~/ohwMobile 2>/dev/null || cd ~/ohw 2>/dev/null || cd ~

# Get IP address
get_ip_address() {
    local ip_address=""
    
    if command -v ip &> /dev/null; then
        ip_address=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}' | head -n1)
    elif command -v ifconfig &> /dev/null; then
        ip_address=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n1)
    else
        ip_address=$(hostname -I 2>/dev/null | awk '{print $1}')
    fi
    
    if [ -z "$ip_address" ]; then
        ip_address="localhost"
    fi
    
    echo "$ip_address"
}

IP_ADDRESS=$(get_ip_address)

echo "🔍 Checking processes..."
echo ""

# Check for Node.js processes
NODE_PROCESSES=$(ps aux | grep -E "(node|npm)" | grep -v grep)
if [ -n "$NODE_PROCESSES" ]; then
    echo "✅ Node.js processes running:"
    echo "$NODE_PROCESSES" | while read line; do
        echo "   $line"
    done
else
    echo "❌ No Node.js processes found"
fi

echo ""

# Check ports
echo "🌐 Checking ports..."
if netstat -tlnp 2>/dev/null | grep -q ":3001 "; then
    echo "✅ Port 3001 (Backend) - ACTIVE"
else
    echo "❌ Port 3001 (Backend) - NOT ACTIVE"
fi

if netstat -tlnp 2>/dev/null | grep -q ":3002 "; then
    echo "✅ Port 3002 (Mobile Frontend) - ACTIVE"
else
    echo "❌ Port 3002 (Mobile Frontend) - NOT ACTIVE"
fi

if netstat -tlnp 2>/dev/null | grep -q ":3003 "; then
    echo "✅ Port 3003 (TCP Server) - ACTIVE"
else
    echo "❌ Port 3003 (TCP Server) - NOT ACTIVE"
fi

if netstat -tlnp 2>/dev/null | grep -q ":3004 "; then
    echo "✅ Port 3004 (Peer Sync) - ACTIVE"
else
    echo "❌ Port 3004 (Peer Sync) - NOT ACTIVE"
fi

echo ""

# Check server response
echo "🔍 Testing server response..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Backend server is responding"
else
    echo "❌ Backend server is not responding"
fi

echo ""

# Display access URLs
echo "📱 Access URLs:"
echo "   • Local Mobile: http://localhost:3001/mobile"
echo "   • Network Mobile: http://$IP_ADDRESS:3001/mobile"
echo "   • Local API: http://localhost:3001"
echo "   • Network API: http://$IP_ADDRESS:3001"
echo ""

# Check logs
echo "📋 Recent logs:"
if [ -f "logs/backend.log" ]; then
    echo "   Backend log (last 5 lines):"
    tail -5 logs/backend.log 2>/dev/null | while read line; do
        echo "   $line"
    done
else
    echo "   No backend log found"
fi

echo ""

# Check status file
if [ -f "logs/status.txt" ]; then
    echo "📄 Status file:"
    cat logs/status.txt 2>/dev/null | while read line; do
        echo "   $line"
    done
fi

echo ""
echo "🔧 Commands:"
echo "   • Start: ./ohw-start.sh"
echo "   • Stop: ./ohw-stop.sh"
echo "   • Logs: tail -f logs/backend.log"
echo "   • Restart: ./ohw-restart.sh"
