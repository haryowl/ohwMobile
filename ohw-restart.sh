#!/bin/bash

echo "🔄 Restarting OHW Mobile Application..."
echo "======================================"
echo ""

# Check if we're in Termux
if [ ! -d "/data/data/com.termux" ]; then
    echo "❌ This script is designed for Termux on Android"
    exit 1
fi

# Set working directory
cd ~/ohwMobile 2>/dev/null || cd ~/ohw 2>/dev/null || cd ~

echo "🛑 Step 1: Stopping current processes..."
./ohw-stop.sh

echo ""
echo "⏳ Step 2: Waiting for processes to fully stop..."
sleep 3

echo ""
echo "🚀 Step 3: Starting fresh..."
./ohw-start.sh

echo ""
echo "🎉 Restart completed!"
