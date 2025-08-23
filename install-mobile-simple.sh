#!/bin/bash

# 🛰️ OHW Mobile - Simple Installation (No SQLite Issues)
# curl -s https://raw.githubusercontent.com/haryowl/ohw/main/install-mobile-simple.sh | bash

set -e

echo "========================================"
echo "  OHW Mobile - Simple Installation"
echo "========================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}🎉 $1${NC}"; }

# Check Termux
if [ ! -d "/data/data/com.termux" ]; then
    echo "❌ This script must be run in Termux on Android"
    exit 1
fi

print_status "Termux detected"

# Fix package issues
echo "N" | dpkg --configure -a 2>/dev/null || true
pkg update -y
pkg install -y nodejs git wget curl

print_status "Packages installed"

# Clean up
cd ~
rm -rf ohwMobile ohw
rm -f ~/ohw-*.sh

# Create project
mkdir -p ~/ohwMobile
cd ~/ohwMobile

# Create package.json (no SQLite)
cat > package.json << 'EOF'
{
  "name": "ohw-mobile-simple",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2"
  }
}
EOF

# Create simple server
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// File-based storage
const dataFile = path.join(__dirname, 'data', 'devices.json');
fs.mkdirSync(path.dirname(dataFile), { recursive: true });

function readData() {
    try {
        return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    } catch {
        return [];
    }
}

function writeData(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// API Routes
app.get('/api/devices', (req, res) => {
    res.json(readData());
});

app.post('/api/devices', (req, res) => {
    const { imei, name } = req.body;
    if (!imei) return res.status(400).json({ error: 'IMEI required' });
    
    const devices = readData();
    const newDevice = {
        id: Date.now(),
        imei,
        name: name || imei,
        status: 'offline',
        created_at: new Date().toISOString()
    };
    devices.push(newDevice);
    writeData(devices);
    res.json(newDevice);
});

app.delete('/api/devices/:id', (req, res) => {
    const { id } = req.params;
    const devices = readData().filter(d => d.id != id);
    writeData(devices);
    res.json({ success: true });
});

app.get('/api/status', (req, res) => {
    res.json({
        server: 'running',
        port: PORT,
        devices_count: readData().length,
        timestamp: new Date().toISOString()
    });
});

app.get('/mobile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mobile.html'));
});

app.get('/', (req, res) => res.redirect('/mobile'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 OHW Mobile Server: http://localhost:${PORT}`);
    console.log(`📱 Mobile Interface: http://localhost:${PORT}/mobile`);
});
EOF

# Create mobile interface
mkdir -p public
cat > public/mobile.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OHW Mobile</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { background: white; color: #333; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .btn { background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px; }
        .device-item { padding: 10px; border-bottom: 1px solid #eee; }
        .status { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 10px; }
        .online { background: #4CAF50; }
        .offline { background: #f44336; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛰️ OHW Mobile</h1>
        <div class="card">
            <h3>📊 System Status</h3>
            <div id="status">Loading...</div>
        </div>
        <div class="card">
            <h3>📱 Devices</h3>
            <div id="devices">Loading...</div>
            <button class="btn" onclick="addDevice()">➕ Add Device</button>
            <button class="btn" onclick="loadDevices()">🔄 Refresh</button>
        </div>
    </div>

    <script>
        async function loadStatus() {
            try {
                const response = await fetch('/api/status');
                const status = await response.json();
                document.getElementById('status').innerHTML = `
                    <p>🟢 Server Running on Port ${status.port}</p>
                    <p>📱 Devices: ${status.devices_count}</p>
                    <p>⏰ ${new Date(status.timestamp).toLocaleString()}</p>
                `;
            } catch (error) {
                document.getElementById('status').innerHTML = 'Error loading status';
            }
        }

        async function loadDevices() {
            try {
                const response = await fetch('/api/devices');
                const devices = await response.json();
                
                if (devices.length === 0) {
                    document.getElementById('devices').innerHTML = 'No devices found. Add your first device!';
                    return;
                }
                
                const html = devices.map(device => `
                    <div class="device-item">
                        <span class="status ${device.status === 'online' ? 'online' : 'offline'}"></span>
                        <strong>${device.name}</strong> (${device.imei})
                        <button class="btn" onclick="deleteDevice(${device.id})">🗑️</button>
                    </div>
                `).join('');
                
                document.getElementById('devices').innerHTML = html;
            } catch (error) {
                document.getElementById('devices').innerHTML = 'Error loading devices';
            }
        }

        function addDevice() {
            const imei = prompt('Enter device IMEI:');
            if (!imei) return;
            
            const name = prompt('Enter device name (optional):') || imei;
            
            fetch('/api/devices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imei, name })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert('Error: ' + data.error);
                } else {
                    alert('Device added successfully!');
                    loadDevices();
                    loadStatus();
                }
            })
            .catch(error => alert('Error: ' + error.message));
        }

        function deleteDevice(id) {
            if (!confirm('Delete this device?')) return;
            
            fetch(`/api/devices/${id}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                alert('Device deleted!');
                loadDevices();
                loadStatus();
            })
            .catch(error => alert('Error: ' + error.message));
        }

        // Load on page load
        loadStatus();
        loadDevices();
        
        // Refresh every 30 seconds
        setInterval(() => {
            loadStatus();
            loadDevices();
        }, 30000);
    </script>
</body>
</html>
EOF

# Install dependencies
npm install --no-optional --ignore-scripts

# Create management scripts
cat > ~/ohw-start.sh << 'EOF'
#!/bin/bash
cd ~/ohwMobile
nohup node server.js > server.log 2>&1 &
echo $! > ~/ohw-server.pid
echo "✅ Server started: http://localhost:3001/mobile"
EOF

cat > ~/ohw-stop.sh << 'EOF'
#!/bin/bash
if [ -f ~/ohw-server.pid ]; then
    kill $(cat ~/ohw-server.pid) 2>/dev/null
    rm ~/ohw-server.pid
fi
pkill -f "node server.js" 2>/dev/null
echo "✅ Server stopped"
EOF

cat > ~/ohw-status.sh << 'EOF'
#!/bin/bash
if [ -f ~/ohw-server.pid ] && kill -0 $(cat ~/ohw-server.pid) 2>/dev/null; then
    echo "✅ Server running: http://localhost:3001/mobile"
else
    echo "❌ Server not running"
fi
EOF

chmod +x ~/ohw-*.sh

print_success "Installation completed!"
echo ""
echo "🚀 Start: ~/ohw-start.sh"
echo "📱 Access: http://localhost:3001/mobile"
echo "🛑 Stop: ~/ohw-stop.sh"
echo "📊 Status: ~/ohw-status.sh"
