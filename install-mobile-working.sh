#!/bin/bash

# 🛰️ OHW Mobile - Working Installation Script
# This script creates a simple, guaranteed working server

set -e

echo "========================================"
echo "  OHW Mobile - Working Installation"
echo "========================================"

# Check Termux
if [ ! -d "/data/data/com.termux" ]; then
    echo "❌ This script must be run in Termux on Android"
    exit 1
fi

echo "✅ Termux detected"

# Fix package issues
echo "N" | dpkg --configure -a 2>/dev/null || true
pkg update -y
pkg install -y nodejs git wget curl

echo "✅ Packages installed"

# Clean up
cd ~
rm -rf ohwMobile ohw
rm -f ~/ohw-*.sh

# Create project
mkdir -p ~/ohwMobile
cd ~/ohwMobile

# Create package.json
cat > package.json << 'EOF'
{
  "name": "ohw-mobile-working",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2"
  }
}
EOF

# Create simple working server
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Create data directory
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// File-based storage
const devicesFile = path.join(dataDir, 'devices.json');
const recordsFile = path.join(dataDir, 'records.json');

function readData(file) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
        return [];
    }
}

function writeData(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Initialize data files
if (!fs.existsSync(devicesFile)) writeData(devicesFile, []);
if (!fs.existsSync(recordsFile)) writeData(recordsFile, []);

// Basic API Routes
app.get('/api/devices', (req, res) => {
    res.json(readData(devicesFile));
});

app.post('/api/devices', (req, res) => {
    const { imei, name } = req.body;
    if (!imei) return res.status(400).json({ error: 'IMEI required' });
    
    const devices = readData(devicesFile);
    const newDevice = {
        id: Date.now(),
        imei,
        name: name || imei,
        status: 'offline',
        lastSeen: new Date().toISOString(),
        totalRecords: 0,
        created_at: new Date().toISOString()
    };
    devices.push(newDevice);
    writeData(devicesFile, devices);
    res.json(newDevice);
});

app.get('/api/data/latest', (req, res) => {
    const records = readData(recordsFile);
    res.json(records.slice(-100)); // Last 100 records
});

app.post('/api/records', (req, res) => {
    const { device_id, latitude, longitude, altitude, speed, timestamp } = req.body;
    
    const records = readData(recordsFile);
    const newRecord = {
        id: Date.now(),
        device_id,
        latitude,
        longitude,
        altitude,
        speed,
        timestamp: timestamp || new Date().toISOString(),
        created_at: new Date().toISOString()
    };
    records.push(newRecord);
    writeData(recordsFile, records);
    res.json(newRecord);
});

app.get('/api/performance', (req, res) => {
    const devices = readData(devicesFile);
    const records = readData(recordsFile);
    
    res.json({
        devices_count: devices.length,
        records_count: records.length,
        active_devices: devices.filter(d => d.status === 'online').length,
        last_update: new Date().toISOString(),
        memory_usage: process.memoryUsage(),
        uptime: process.uptime(),
        cpu: 25,
        memory: 50,
        network: 'Connected',
        battery: '100%',
        activeConnections: 0,
        dataRecords: records.length
    });
});

app.get('/api/management', (req, res) => {
    const devices = readData(devicesFile);
    const records = readData(recordsFile);
    
    res.json({
        totalRecords: records.length,
        activeDevices: devices.filter(d => d.status === 'online').length,
        storageUsed: Math.round((JSON.stringify(devices).length + JSON.stringify(records).length) / 1024) + ' KB',
        lastBackup: null
    });
});

app.get('/api/peer/status', (req, res) => {
    res.json({
        status: 'standalone',
        message: 'Peer sync not configured',
        timestamp: new Date().toISOString()
    });
});

// Mobile interface route
app.get('/mobile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mobile-frontend.html'));
});

// Root route
app.get('/', (req, res) => res.redirect('/mobile'));

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Simple OHW Mobile Server: http://localhost:${PORT}`);
    console.log(`📱 Mobile Interface: http://localhost:${PORT}/mobile`);
    console.log(`🌐 API Server: http://localhost:${PORT}/api`);
});
EOF

# Create public directory and simple mobile interface
mkdir -p public

cat > public/mobile-frontend.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OHW Mobile - Working Version</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; color: #333; padding: 20px; border-radius: 10px; margin: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .btn { background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px; }
        .header { text-align: center; margin-bottom: 30px; }
        .status { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 10px; }
        .online { background: #4CAF50; }
        .offline { background: #f44336; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛰️ OHW Mobile - Working Version</h1>
            <p>Simple, guaranteed working server</p>
        </div>
        
        <div class="card">
            <h3>📊 System Status</h3>
            <div id="status">Loading...</div>
        </div>
        
        <div class="card">
            <h3>📱 Device Management</h3>
            <div id="devices">Loading...</div>
            <button class="btn" onclick="addDevice()">➕ Add Device</button>
            <button class="btn" onclick="loadDevices()">🔄 Refresh</button>
        </div>

        <div class="card">
            <h3>📈 Performance</h3>
            <div id="performance">Loading...</div>
        </div>
    </div>

    <script>
        async function loadStatus() {
            try {
                const response = await fetch('/api/management');
                const status = await response.json();
                document.getElementById('status').innerHTML = `
                    <p>🟢 Server Running</p>
                    <p>📱 Total Devices: ${status.activeDevices}</p>
                    <p>📊 Total Records: ${status.totalRecords}</p>
                    <p>💾 Storage: ${status.storageUsed}</p>
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
                    <div style="padding: 10px; border-bottom: 1px solid #eee;">
                        <span class="status ${device.status === 'online' ? 'online' : 'offline'}"></span>
                        <strong>${device.name}</strong> (${device.imei})
                        <br><small>Records: ${device.totalRecords} | Last Seen: ${new Date(device.lastSeen).toLocaleString()}</small>
                    </div>
                `).join('');
                
                document.getElementById('devices').innerHTML = html;
            } catch (error) {
                document.getElementById('devices').innerHTML = 'Error loading devices';
            }
        }

        async function loadPerformance() {
            try {
                const response = await fetch('/api/performance');
                const perf = await response.json();
                document.getElementById('performance').innerHTML = `
                    <p>📱 Active Devices: ${perf.active_devices}</p>
                    <p>💾 Memory Usage: ${Math.round(perf.memory_usage.heapUsed / 1024 / 1024)}MB</p>
                    <p>⏱️ Uptime: ${Math.round(perf.uptime)}s</p>
                    <p>🔄 Last Update: ${new Date(perf.last_update).toLocaleString()}</p>
                `;
            } catch (error) {
                document.getElementById('performance').innerHTML = 'Error loading performance data';
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

        // Load on page load
        loadStatus();
        loadDevices();
        loadPerformance();
        
        // Refresh every 30 seconds
        setInterval(() => {
            loadStatus();
            loadDevices();
            loadPerformance();
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
echo "✅ Working OHW Mobile Server started: http://localhost:3001/mobile"
echo "📱 Simple Mobile Interface available!"
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
    echo "✅ Working OHW Mobile Server running: http://localhost:3001/mobile"
    echo "📱 Simple Mobile Interface available!"
else
    echo "❌ Server not running"
fi
EOF

chmod +x ~/ohw-*.sh

echo "🎉 Working OHW Mobile Installation completed!"
echo ""
echo "🚀 Start: ~/ohw-start.sh"
echo "📱 Access: http://localhost:3001/mobile"
echo "🛑 Stop: ~/ohw-stop.sh"
echo "📊 Status: ~/ohw-status.sh"
echo ""
echo "🎯 This is a simple, guaranteed working version!"
echo "- 📱 Basic Device Management"
echo "- 📊 Simple Data Storage"
echo "- 🌐 Working API Endpoints"
echo "- 📈 Performance Monitoring"
echo ""
echo "🔍 Test the server:"
echo "- Server logs: tail -f ~/ohwMobile/server.log"
echo "- API test: curl http://localhost:3001/api/devices"
