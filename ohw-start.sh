#!/bin/bash

echo "🚀 Starting OHW Mobile Application..."
echo "====================================="
echo ""

# Check if we're in Termux
if [ ! -d "/data/data/com.termux" ]; then
    echo "❌ This script is designed for Termux on Android"
    echo "📱 Please install Termux from F-Droid or Google Play Store"
    exit 1
fi

# Set working directory
cd ~/ohwMobile 2>/dev/null || cd ~/ohw 2>/dev/null || cd ~

# Check if backend files exist
if [ ! -f "backend/src/server.js" ] && [ ! -f "src/server.js" ]; then
    echo "❌ Backend server not found"
    echo "📥 Please run the installation script first:"
    echo "   curl -s https://raw.githubusercontent.com/haryowl/ohwMobile/main/install-mobile.sh | bash"
    exit 1
fi

# Install required packages if not present
echo "📦 Checking dependencies..."
if ! command -v ip &> /dev/null; then
    echo "📥 Installing iproute2..."
    pkg install -y iproute2 2>/dev/null || echo "⚠️  iproute2 not available, using alternative method"
fi

# Get IP address (with fallback)
get_ip_address() {
    # Try multiple methods to get IP address
    local ip_address=""
    
    # Method 1: Try ip command
    if command -v ip &> /dev/null; then
        ip_address=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}' | head -n1)
    fi
    
    # Method 2: Try ifconfig
    if [ -z "$ip_address" ] && command -v ifconfig &> /dev/null; then
        ip_address=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n1)
    fi
    
    # Method 3: Try hostname
    if [ -z "$ip_address" ]; then
        ip_address=$(hostname -I 2>/dev/null | awk '{print $1}')
    fi
    
    # Method 4: Default to localhost
    if [ -z "$ip_address" ]; then
        ip_address="localhost"
    fi
    
    echo "$ip_address"
}

# Get network information
IP_ADDRESS=$(get_ip_address)
echo "🌐 IP Address: $IP_ADDRESS"

# Check if ports are available
check_port() {
    local port=$1
    if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
        return 1
    else
        return 0
    fi
}

# Kill existing processes
echo "🛑 Stopping existing processes..."
pkill -f "node.*server.js" 2>/dev/null
pkill -f "npm.*start" 2>/dev/null
sleep 2

# Start the backend server
echo "🔧 Starting backend server..."
if [ -f "backend/src/server.js" ]; then
    cd backend
    nohup node src/server.js > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
elif [ -f "src/server.js" ]; then
    nohup node src/server.js > logs/backend.log 2>&1 &
    BACKEND_PID=$!
else
    echo "❌ Backend server file not found"
    exit 1
fi

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 3

# Check if server started successfully
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend server started successfully (PID: $BACKEND_PID)"
else
    echo "❌ Failed to start backend server"
    echo "📋 Check logs: tail -f logs/backend.log"
    exit 1
fi

# Check server status
echo "🔍 Checking server status..."
sleep 2

# Test if server is responding
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Server is responding on http://localhost:3001"
else
    echo "⚠️  Server may not be fully started yet"
fi

# Display access information
echo ""
echo "🎉 OHW Mobile Application Started!"
echo "=================================="
echo ""
echo "📱 Mobile Interface URLs:"
echo "   • Local: http://localhost:3001/mobile"
echo "   • Network: http://$IP_ADDRESS:3001/mobile"
echo "   • Alternative: http://localhost:3001/mobile-frontend.html"
echo ""
echo "🌐 API Server:"
echo "   • Local: http://localhost:3001"
echo "   • Network: http://$IP_ADDRESS:3001"
echo ""
echo "📊 Management:"
echo "   • Status: ./ohw-status.sh"
echo "   • Stop: ./ohw-stop.sh"
echo "   • Logs: tail -f logs/backend.log"
echo ""
echo "🔧 Troubleshooting:"
echo "   • If mobile interface doesn't load, try: http://$IP_ADDRESS:3001/mobile"
echo "   • If you get connection errors, check firewall settings"
echo "   • For logs: tail -f logs/backend.log"
echo ""
echo "📱 To access from other devices on the same network:"
echo "   http://$IP_ADDRESS:3001/mobile"
echo ""

# Create status file
mkdir -p logs
echo "Started at: $(date)" > logs/status.txt
echo "Backend PID: $BACKEND_PID" >> logs/status.txt
echo "IP Address: $IP_ADDRESS" >> logs/status.txt
echo "Port: 3001" >> logs/status.txt

echo "🚀 Server is running! Open the mobile interface in your browser."
