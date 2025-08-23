#!/bin/bash

echo "🚀 OHW Mobile Application - Installation Script"
echo "================================================"
echo ""

# Check if running in Termux
if [ ! -d "/data/data/com.termux" ]; then
    echo "❌ This script is designed for Termux on Android"
    echo "📱 Please install Termux from F-Droid or Google Play Store"
    exit 1
fi

echo "✅ Termux detected"
echo ""

# Update packages
echo "📦 Updating system packages..."
pkg update -y && pkg upgrade -y

# Install required packages
echo "🔧 Installing dependencies..."
pkg install -y nodejs git curl wget

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js installation failed"
    exit 1
fi

echo "✅ Node.js $(node --version) installed"
echo "✅ npm $(npm --version) installed"
echo ""

# Create project directory
PROJECT_DIR="$HOME/ohwMobile"
echo "📁 Creating project directory: $PROJECT_DIR"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Clone repository
echo "📥 Cloning OHW Mobile repository..."
git clone https://github.com/haryowl/ohwMobile.git .
if [ $? -ne 0 ]; then
    echo "❌ Failed to clone repository"
    exit 1
fi

echo "✅ Repository cloned successfully"
echo ""

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install npm dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Create startup scripts
echo "📝 Creating startup scripts..."

# Main startup script
cat > start-ohw.sh << 'EOF'
#!/bin/bash
cd ~/ohwMobile
echo "🚀 Starting OHW Mobile Application..."
echo "📱 Mobile Interface: http://localhost:3001/mobile"
echo "🌐 API Server: http://localhost:3001"
echo "📊 Press Ctrl+C to stop"
echo ""
npm start
EOF

# Status script
cat > status-ohw.sh << 'EOF'
#!/bin/bash
echo "📊 OHW Mobile Application Status"
echo "================================"
echo ""
echo "🔍 Checking processes..."
ps aux | grep -E "(node|npm)" | grep -v grep
echo ""
echo "🌐 Checking ports..."
netstat -tlnp 2>/dev/null | grep -E "(3001|3002)" || echo "No active ports found"
echo ""
echo "📁 Project directory: ~/ohwMobile"
echo "📱 Mobile Interface: http://localhost:3001/mobile"
EOF

# Stop script
cat > stop-ohw.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping OHW Mobile Application..."
pkill -f "node.*server.js" 2>/dev/null
pkill -f "npm.*start" 2>/dev/null
echo "✅ Application stopped"
EOF

# Update script
cat > update-ohw.sh << 'EOF'
#!/bin/bash
echo "🔄 Updating OHW Mobile Application..."
cd ~/ohwMobile
git pull origin main
npm install
echo "✅ Application updated successfully"
EOF

# Make scripts executable
chmod +x start-ohw.sh status-ohw.sh stop-ohw.sh update-ohw.sh

echo "✅ Startup scripts created"
echo ""

# Create README for user
cat > README-MOBILE.md << 'EOF'
# 📱 OHW Mobile Application

## 🚀 Quick Start

```bash
# Start the application
./start-ohw.sh

# Check status
./status-ohw.sh

# Stop the application
./stop-ohw.sh

# Update the application
./update-ohw.sh
```

## 📱 Access Points

- **Mobile Interface:** http://localhost:3001/mobile
- **Alternative URL:** http://localhost:3001/mobile-frontend.html
- **API Server:** http://localhost:3001

## 🎯 Features

- 📍 **Live Tracking** - Real-time device location tracking
- 📊 **Device Management** - Add, edit, delete devices
- 📈 **Data Export** - Export data in CSV/PFSL/JSON formats
- 🔄 **Peer Sync** - Synchronize data between devices
- 💾 **Backup Management** - Backup and restore data
- ⚡ **Performance Monitoring** - Real-time system metrics
- 🗺️ **Tracking History** - View device path history on map

## 🔧 Troubleshooting

**If you get permission errors:**
```bash
chmod +x *.sh
```

**If Node.js is not found:**
```bash
pkg install -y nodejs
```

**If npm is not found:**
```bash
pkg install -y nodejs npm
```

## 📞 Support

- **Repository:** https://github.com/haryowl/ohwMobile.git
- **Mobile Interface:** http://localhost:3001/mobile
EOF

echo "✅ Installation completed successfully!"
echo ""
echo "🎯 Next Steps:"
echo "1. Start the application: ./start-ohw.sh"
echo "2. Open browser: http://localhost:3001/mobile"
echo "3. Check status: ./status-ohw.sh"
echo ""
echo "📱 Mobile Interface Features:"
echo "- 📍 Live Tracking with device path history"
echo "- 📊 Full Device Management (CRUD operations)"
echo "- 📈 Data Export with custom templates"
echo "- 🔄 Peer-to-Peer Synchronization"
echo "- 💾 Backup and Restore functionality"
echo "- ⚡ Real-time Performance Monitoring"
echo ""
echo "🚀 Ready to use! Run './start-ohw.sh' to begin." 