#!/bin/bash

echo "🛑 Stopping OHW Mobile Application..."
echo "===================================="
echo ""

# Check if we're in Termux
if [ ! -d "/data/data/com.termux" ]; then
    echo "❌ This script is designed for Termux on Android"
    exit 1
fi

# Set working directory
cd ~/ohwMobile 2>/dev/null || cd ~/ohw 2>/dev/null || cd ~

echo "🔍 Finding running processes..."

# Find Node.js processes
NODE_PIDS=$(ps aux | grep -E "(node.*server\.js|npm.*start)" | grep -v grep | awk '{print $2}')

if [ -n "$NODE_PIDS" ]; then
    echo "📋 Found Node.js processes:"
    ps aux | grep -E "(node.*server\.js|npm.*start)" | grep -v grep | while read line; do
        echo "   $line"
    done
    
    echo ""
    echo "🛑 Stopping processes..."
    
    # Stop processes gracefully
    for pid in $NODE_PIDS; do
        echo "   Stopping PID $pid..."
        kill $pid 2>/dev/null
    done
    
    # Wait a moment
    sleep 2
    
    # Force kill if still running
    REMAINING_PIDS=$(ps aux | grep -E "(node.*server\.js|npm.*start)" | grep -v grep | awk '{print $2}')
    if [ -n "$REMAINING_PIDS" ]; then
        echo "⚠️  Force stopping remaining processes..."
        for pid in $REMAINING_PIDS; do
            echo "   Force stopping PID $pid..."
            kill -9 $pid 2>/dev/null
        done
    fi
    
    echo "✅ All processes stopped"
else
    echo "ℹ️  No Node.js processes found"
fi

echo ""

# Check if ports are still in use
echo "🔍 Checking ports..."
if netstat -tlnp 2>/dev/null | grep -q ":3001 "; then
    echo "⚠️  Port 3001 still in use"
else
    echo "✅ Port 3001 freed"
fi

if netstat -tlnp 2>/dev/null | grep -q ":3002 "; then
    echo "⚠️  Port 3002 still in use"
else
    echo "✅ Port 3002 freed"
fi

if netstat -tlnp 2>/dev/null | grep -q ":3003 "; then
    echo "⚠️  Port 3003 still in use"
else
    echo "✅ Port 3003 freed"
fi

if netstat -tlnp 2>/dev/null | grep -q ":3004 "; then
    echo "⚠️  Port 3004 still in use"
else
    echo "✅ Port 3004 freed"
fi

echo ""

# Update status file
if [ -f "logs/status.txt" ]; then
    echo "📄 Updating status file..."
    echo "Stopped at: $(date)" >> logs/status.txt
    echo "Status: STOPPED" >> logs/status.txt
fi

echo "🎉 OHW Mobile Application stopped successfully!"
echo ""
echo "🔧 To restart: ./ohw-start.sh"
