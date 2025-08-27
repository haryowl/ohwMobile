#!/bin/bash

echo "🚀 Pushing Modular OHW Mobile Interface to GitHub"
echo "=================================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
    git remote add origin https://github.com/haryowl/ohwMobile.git
fi

# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    echo "📦 Creating package.json..."
    cat > package.json << 'EOF'
{
  "name": "ohw-mobile-modular",
  "version": "2.0.0",
  "description": "Modular OHW Mobile Interface for Device Tracking",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "echo \"No tests specified\" && exit 0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2"
  },
  "keywords": [
    "gps",
    "tracking",
    "mobile",
    "galileosky",
    "iot"
  ],
  "author": "OHW Mobile Team",
  "license": "MIT"
}
EOF
fi

# Create README.md
echo "📝 Creating README.md..."
cat > README.md << 'EOF'
# 🛰️ OHW Mobile - Modular Interface

Complete device tracking and management platform with modular HTML interface.

## 🚀 Features

- **📱 Modular Design** - Separate pages for each feature
- **📍 Live GPS Tracking** - Interactive maps with real-time updates
- **📊 Device Management** - Complete CRUD operations
- **📈 Data Analytics** - Advanced filtering and export
- **🔄 Peer Sync** - Device synchronization
- **💾 Backup & Restore** - Data management
- **⚡ Performance Monitor** - System monitoring
- **🗺️ Offline Grid** - Offline navigation support

## 📁 Modular Pages

1. **`mobile-main.html`** - Main navigation hub
2. **`mobile-tracking.html`** - Live GPS tracking with maps
3. **`mobile-devices.html`** - Device management (CRUD)
4. **`mobile-data.html`** - Data analytics and filtering
5. **`mobile-export.html`** - Data export functionality
6. **`mobile-peer.html`** - Peer synchronization
7. **`mobile-backup.html`** - Backup and restore
8. **`mobile-performance.html`** - System monitoring
9. **`mobile-offline.html`** - Offline grid support

## 🛠️ Installation

### Quick Start (Termux)
```bash
curl -s https://raw.githubusercontent.com/haryowl/ohwMobile/main/install-mobile-modular.sh | bash
```

### Manual Installation
```bash
# Clone repository
git clone https://github.com/haryowl/ohwMobile.git
cd ohwMobile

# Install dependencies
npm install

# Start server
npm start
```

## 🌐 Access Interface

- **Main Menu**: http://localhost:3001/mobile-main.html
- **Tracking**: http://localhost:3001/mobile-tracking.html
- **Devices**: http://localhost:3001/mobile-devices.html
- **Data**: http://localhost:3001/mobile-data.html

## 🔧 API Endpoints

- `GET /api/devices` - List all devices
- `POST /api/devices` - Add new device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device
- `GET /api/data/latest` - Get latest data
- `GET /api/performance` - System performance
- `GET /api/management` - System management info

## 📱 Mobile Optimized

All pages are optimized for mobile devices with:
- Responsive design
- Touch-friendly interface
- Fast loading times
- Offline capability

## 🎯 Benefits

- **No Timeouts** - Modular design prevents large file issues
- **Easy Debugging** - Focus on one feature at a time
- **Better Performance** - Load only what you need
- **Maintainable** - Easy to update individual features
- **Scalable** - Add new pages without affecting others

## 🔄 Updates

This is version 2.0 with modular interface architecture.

## 📄 License

MIT License - See LICENSE file for details.
EOF

# Create installation script
echo "📜 Creating installation script..."
cat > install-mobile-modular.sh << 'EOF'
#!/bin/bash

echo "🚀 Installing OHW Mobile Modular Interface"
echo "=========================================="

# Update package list
pkg update -y

# Install required packages
pkg install -y nodejs git curl

# Create project directory
mkdir -p ~/ohwMobile
cd ~/ohwMobile

# Download files from GitHub
echo "📥 Downloading files from GitHub..."

# Download package.json
curl -s -o package.json https://raw.githubusercontent.com/haryowl/ohwMobile/main/package.json

# Download server.js
curl -s -o server.js https://raw.githubusercontent.com/haryowl/ohwMobile/main/server.js

# Download HTML files
curl -s -o mobile-main.html https://raw.githubusercontent.com/haryowl/ohwMobile/main/mobile-main.html
curl -s -o mobile-tracking.html https://raw.githubusercontent.com/haryowl/ohwMobile/main/mobile-tracking.html
curl -s -o mobile-devices.html https://raw.githubusercontent.com/haryowl/ohwMobile/main/mobile-devices.html
curl -s -o mobile-data.html https://raw.githubusercontent.com/haryowl/ohwMobile/main/mobile-data.html

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create startup script
cat > start-server.sh << 'STARTEOF'
#!/bin/bash
cd ~/ohwMobile
echo "🚀 Starting OHW Mobile Server..."
node server.js
STARTEOF

chmod +x start-server.sh

echo "✅ Installation complete!"
echo ""
echo "🌐 To start the server:"
echo "   cd ~/ohwMobile"
echo "   ./start-server.sh"
echo ""
echo "📱 Access the interface at:"
echo "   http://localhost:3001/mobile-main.html"
echo ""
echo "🎉 Modular interface is ready!"
EOF

# Add all files to git
echo "📁 Adding files to git..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "🚀 Add Modular OHW Mobile Interface v2.0

✨ New Features:
- Modular HTML interface design
- Separate pages for each feature
- Mobile-optimized responsive design
- Complete CRUD operations for devices
- Advanced data filtering and analytics
- Real-time tracking with interactive maps
- Export functionality (CSV, JSON)
- Performance monitoring
- Backup and restore capabilities

📱 Modular Pages:
- mobile-main.html - Main navigation hub
- mobile-tracking.html - Live GPS tracking
- mobile-devices.html - Device management
- mobile-data.html - Data analytics

🔧 Technical Improvements:
- No more timeout issues with large files
- Better performance and maintainability
- Easy debugging and feature updates
- Scalable architecture

🎯 Benefits:
- Solves previous timeout problems
- Improved user experience
- Better code organization
- Enhanced mobile compatibility"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Successfully pushed to GitHub!"
echo ""
echo "🌐 Repository: https://github.com/haryowl/ohwMobile"
echo "📥 Installation: curl -s https://raw.githubusercontent.com/haryowl/ohwMobile/main/install-mobile-modular.sh | bash"
echo ""
echo "🎉 Your modular interface is now available for testing!"
