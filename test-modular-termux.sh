#!/bin/bash

echo "🧪 Testing Modular OHW Mobile Interface in Termux"
echo "================================================="

# Create test directory
mkdir -p ~/ohwMobile-test
cd ~/ohwMobile-test

echo "📥 Downloading modular interface files..."

# Download package.json
curl -s -o package.json https://raw.githubusercontent.com/haryowl/ohwMobile/main/package.json

# Download server.js
curl -s -o server.js https://raw.githubusercontent.com/haryowl/ohwMobile/main/server.js

# Download HTML files
curl -s -o mobile-main.html https://raw.githubusercontent.com/haryowl/ohwMobile/main/mobile-main.html
curl -s -o mobile-tracking.html https://raw.githubusercontent.com/haryowl/ohwMobile/main/mobile-tracking.html
curl -s -o mobile-devices.html https://raw.githubusercontent.com/haryowl/ohwMobile/main/mobile-devices.html
curl -s -o mobile-data.html https://raw.githubusercontent.com/haryowl/ohwMobile/main/mobile-data.html

echo "📦 Installing dependencies..."
npm install

echo "🚀 Starting server..."
echo "📱 Access the interface at: http://localhost:3001/mobile-main.html"
echo "📍 Tracking: http://localhost:3001/mobile-tracking.html"
echo "📱 Devices: http://localhost:3001/mobile-devices.html"
echo "📊 Data: http://localhost:3001/mobile-data.html"

# Start the server
node server.js
