#!/data/data/com.termux/files/usr/bin/bash

echo "🚀 OHW Mobile Application - Termux Quick Install"
echo "================================================"

# Update packages
echo "📦 Updating packages..."
pkg update -y

# Install required packages
echo "🔧 Installing required packages..."
pkg install -y git nodejs

# Clone repository
echo "📥 Cloning repository..."
if [ -d "ohw-enhance" ]; then
    echo "Repository already exists, updating..."
    cd ohw-enhance
    git pull origin main
else
    git clone https://github.com/haryowl/ohw-enhance.git
    cd ohw-enhance
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install frontend dependencies
echo "🎨 Installing frontend dependencies..."
cd frontend
npm install

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Install serve globally
echo "🌐 Installing serve..."
npm install -g serve

# Start server
echo "🚀 Starting server..."
echo "================================================"
echo "✅ Installation complete!"
echo "📱 Open your browser and go to:"
echo "   http://localhost:3000"
echo ""
echo "🔗 Or access from other devices on same network:"
echo "   http://[YOUR_PHONE_IP]:3000"
echo ""
echo "📋 To find your phone's IP address, run:"
echo "   ip addr show wlan0"
echo ""
echo "🔄 To stop the server, press Ctrl+C"
echo "================================================"

# Start the server
serve -s build -l 3000
