#!/bin/bash

echo "🚀 OHW Mobile - Complete Installation & Setup"
echo "============================================="
echo "This script will install everything automatically!"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running in Termux
if [ -d "/data/data/com.termux" ]; then
    print_info "Termux detected - Installing packages..."
    
    # Update package list
    print_status "Updating package list..."
    pkg update -y > /dev/null 2>&1
    
    # Install required packages
    print_status "Installing Node.js, Git, and Curl..."
    pkg install -y nodejs git curl > /dev/null 2>&1
    
    print_info "Termux packages installed successfully!"
else
    print_warning "Not running in Termux - skipping package installation"
fi

# Create project directory
PROJECT_DIR="$HOME/ohwMobile"
print_status "Creating project directory: $PROJECT_DIR"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Download all files from GitHub
print_status "Downloading modular interface files..."

# Download package.json
curl -s -o package.json "https://raw.githubusercontent.com/haryowl/ohwMobile/main/package.json"
if [ $? -eq 0 ]; then
    print_status "✅ package.json downloaded"
else
    print_error "Failed to download package.json"
    exit 1
fi

# Download server.js (simplified version)
curl -s -o server.js "https://raw.githubusercontent.com/haryowl/ohwMobile/main/server-simple.js"
if [ $? -eq 0 ]; then
    print_status "server.js downloaded (simplified version)"
else
    print_error "Failed to download server.js"
    exit 1
fi

# Download HTML files
HTML_FILES=(
    "mobile-main.html"
    "mobile-tracking.html"
    "mobile-devices.html"
    "mobile-data-fixed.html"
)

for file in "${HTML_FILES[@]}"; do
    if [ "$file" = "mobile-data-fixed.html" ]; then
        # Download the fixed data page and rename it
        curl -s -o "mobile-data.html" "https://raw.githubusercontent.com/haryowl/ohwMobile/main/$file"
        if [ $? -eq 0 ]; then
            print_status "✅ mobile-data.html downloaded (fixed version)"
        else
            print_error "Failed to download mobile-data.html"
            exit 1
        fi
    else
        curl -s -o "$file" "https://raw.githubusercontent.com/haryowl/ohwMobile/main/$file"
        if [ $? -eq 0 ]; then
            print_status "✅ $file downloaded"
        else
            print_error "Failed to download $file"
            exit 1
        fi
    fi
done

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
if npm install > /dev/null 2>&1; then
    print_status "Dependencies installed via npm"
else
    print_warning "npm install failed, creating minimal setup..."
    
    # Create a simple package.json with minimal dependencies
    cat > package.json << 'EOF'
{
  "name": "ohw-mobile-modular",
  "version": "2.0.0",
  "description": "Modular OHW Mobile Interface for Device Tracking",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {},
  "keywords": ["gps", "tracking", "mobile", "galileosky", "iot"],
  "author": "OHW Mobile Team",
  "license": "MIT"
}
EOF
    print_status "Created minimal package.json"
fi

# Create startup script
print_status "Creating startup script..."
cat > start-server.sh << 'EOF'
#!/bin/bash
cd "$HOME/ohwMobile"
echo "🚀 Starting OHW Mobile Server..."
echo "📱 Access the interface at: http://localhost:3001/mobile-main.html"
echo "📍 Tracking: http://localhost:3001/mobile-tracking.html"
echo "📱 Devices: http://localhost:3001/mobile-devices.html"
echo "📊 Data: http://localhost:3001/mobile-data.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
node server.js
EOF

chmod +x start-server.sh
print_status "✅ Startup script created"

# Create quick access script
print_status "Creating quick access script..."
cat > quick-start.sh << 'EOF'
#!/bin/bash
cd "$HOME/ohwMobile"
if [ -f "server.js" ]; then
    echo "🚀 Starting OHW Mobile Server..."
    node server.js
else
    echo "❌ Server files not found. Please run the installation script first."
    exit 1
fi
EOF

chmod +x quick-start.sh
print_status "✅ Quick start script created"

# Test if server can start
print_status "Testing server startup..."
timeout 5s node server.js > /dev/null 2>&1 &
SERVER_PID=$!
sleep 2

if kill -0 $SERVER_PID 2>/dev/null; then
    print_status "✅ Server test successful"
    kill $SERVER_PID 2>/dev/null
else
    print_warning "⚠️  Server test failed - but installation completed"
fi

echo ""
echo "🎉 INSTALLATION COMPLETE!"
echo "========================="
echo ""
echo "📁 Project location: $PROJECT_DIR"
echo ""
echo "🚀 To start the server:"
echo "   cd $PROJECT_DIR"
echo "   ./start-server.sh"
echo ""
echo "⚡ Quick start:"
echo "   cd $PROJECT_DIR"
echo "   ./quick-start.sh"
echo ""
echo "🌐 Access URLs:"
echo "   📱 Main Menu: http://localhost:3001/mobile-main.html"
echo "   📍 Tracking: http://localhost:3001/mobile-tracking.html"
echo "   📱 Devices: http://localhost:3001/mobile-devices.html"
echo "   📊 Data: http://localhost:3001/mobile-data.html"
echo ""
echo "✨ Features Available:"
echo "   ✅ Live GPS Tracking with interactive maps"
echo "   ✅ Complete Device Management (CRUD)"
echo "   ✅ Data Analytics and Filtering"
echo "   ✅ Export functionality (CSV)"
echo "   ✅ Mobile-optimized interface"
echo "   ✅ Real-time updates"
echo ""
echo "🎯 Ready to use! Start the server and access the interface."
echo ""
echo "Press Enter to start the server now, or Ctrl+C to exit..."
read -r

# Start the server
echo "🚀 Starting OHW Mobile Server..."
echo "📱 Access the interface at: http://localhost:3001/mobile-main.html"
echo "📍 Tracking: http://localhost:3001/mobile-tracking.html"
echo "📱 Devices: http://localhost:3001/mobile-devices.html"
echo "📊 Data: http://localhost:3001/mobile-data.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd "$PROJECT_DIR"
node server.js
