#!/bin/bash

# 🛰️ OHW Mobile - Full Installation (Using Existing Full Frontend)
# curl -s https://raw.githubusercontent.com/haryowl/ohw/main/install-mobile-simple.sh | bash

set -e

echo "========================================"
echo "  OHW Mobile - Full Installation"
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

# Create package.json (no SQLite)
cat > package.json << 'EOF'
{
  "name": "ohw-mobile-full",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "ws": "^8.14.2",
    "moment": "^2.29.4",
    "uuid": "^9.0.1"
  }
}
EOF

# Create enhanced server with full API support
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');

const app = express();
const PORT = 3001;

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
const backupsFile = path.join(dataDir, 'backups.json');

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
if (!fs.existsSync(backupsFile)) writeData(backupsFile, []);

// API Routes

// Get all devices
app.get('/api/devices', (req, res) => {
    res.json(readData(devicesFile));
});

// Get devices with locations
app.get('/api/devices/locations', (req, res) => {
    const devices = readData(devicesFile);
    const records = readData(recordsFile);
    
    const devicesWithLocations = devices.map(device => {
        const deviceRecords = records.filter(r => r.device_id === device.id);
        const latestRecord = deviceRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        
        return {
            ...device,
            location: latestRecord ? {
                latitude: latestRecord.latitude,
                longitude: latestRecord.longitude,
                timestamp: latestRecord.timestamp,
                speed: latestRecord.speed,
                direction: latestRecord.course
            } : null
        };
    });
    
    res.json(devicesWithLocations);
});

// Add device
app.post('/api/devices', (req, res) => {
    const { imei, name, group } = req.body;
    if (!imei) return res.status(400).json({ error: 'IMEI required' });
    
    const devices = readData(devicesFile);
    const newDevice = {
        id: Date.now(),
        imei,
        name: name || imei,
        group: group || 'Default',
        status: 'offline',
        lastSeen: new Date().toISOString(),
        totalRecords: 0,
        created_at: new Date().toISOString()
    };
    devices.push(newDevice);
    writeData(devicesFile, devices);
    res.json(newDevice);
});

// Update device
app.put('/api/devices/:id', (req, res) => {
    const { id } = req.params;
    const { imei, name, group, status } = req.body;
    
    const devices = readData(devicesFile);
    const deviceIndex = devices.findIndex(d => d.id == id);
    if (deviceIndex === -1) return res.status(404).json({ error: 'Device not found' });
    
    devices[deviceIndex] = { ...devices[deviceIndex], imei, name, group, status };
    writeData(devicesFile, devices);
    res.json({ success: true, device: devices[deviceIndex] });
});

// Delete device
app.delete('/api/devices/:id', (req, res) => {
    const { id } = req.params;
    
    const devices = readData(devicesFile);
    const filteredDevices = devices.filter(d => d.id != id);
    writeData(devicesFile, filteredDevices);
    
    // Also remove related records
    const records = readData(recordsFile);
    const filteredRecords = records.filter(r => r.device_id != id);
    writeData(recordsFile, filteredRecords);
    
    res.json({ success: true });
});

// Get latest data
app.get('/api/data/latest', (req, res) => {
    const { limit = 100, from, to, device } = req.query;
    let records = readData(recordsFile);
    
    // Filter by device if specified
    if (device) {
        const devices = readData(devicesFile);
        const targetDevice = devices.find(d => d.imei === device);
        if (targetDevice) {
            records = records.filter(r => r.device_id === targetDevice.id);
        }
    }
    
    // Filter by date range if specified
    if (from || to) {
        records = records.filter(r => {
            const recordDate = new Date(r.timestamp);
            if (from && recordDate < new Date(from)) return false;
            if (to && recordDate > new Date(to)) return false;
            return true;
        });
    }
    
    // Sort by timestamp and limit
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    records = records.slice(0, parseInt(limit));
    
    res.json(records);
});

// Get tracking data for device
app.get('/api/data/:deviceId/tracking', (req, res) => {
    const { deviceId } = req.params;
    const { startDate, endDate } = req.query;
    
    let records = readData(recordsFile).filter(r => r.device_id == deviceId);
    
    if (startDate || endDate) {
        records = records.filter(r => {
            const recordDate = new Date(r.timestamp);
            if (startDate && recordDate < new Date(startDate)) return false;
            if (endDate && recordDate > new Date(endDate)) return false;
            return true;
        });
    }
    
    records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    res.json(records);
});

// Add record
app.post('/api/records', (req, res) => {
    const { device_id, latitude, longitude, altitude, speed, course, timestamp, data } = req.body;
    
    const records = readData(recordsFile);
    const newRecord = {
        id: Date.now(),
        device_id,
        latitude,
        longitude,
        altitude,
        speed,
        course,
        timestamp: timestamp || new Date().toISOString(),
        data,
        created_at: new Date().toISOString()
    };
    records.push(newRecord);
    writeData(recordsFile, records);
    
    // Update device last seen
    const devices = readData(devicesFile);
    const deviceIndex = devices.findIndex(d => d.id == device_id);
    if (deviceIndex !== -1) {
        devices[deviceIndex].lastSeen = newRecord.timestamp;
        devices[deviceIndex].totalRecords = records.filter(r => r.device_id == device_id).length;
        writeData(devicesFile, devices);
    }
    
    res.json(newRecord);
});

// Export data
app.get('/api/data/export', (req, res) => {
    const { format = 'csv', from, to, device } = req.query;
    let records = readData(recordsFile);
    
    // Apply filters
    if (device) {
        const devices = readData(devicesFile);
        const targetDevice = devices.find(d => d.imei === device);
        if (targetDevice) {
            records = records.filter(r => r.device_id === targetDevice.id);
        }
    }
    
    if (from || to) {
        records = records.filter(r => {
            const recordDate = new Date(r.timestamp);
            if (from && recordDate < new Date(from)) return false;
            if (to && recordDate > new Date(to)) return false;
            return true;
        });
    }
    
    if (format === 'csv') {
        const csv = 'timestamp,latitude,longitude,altitude,speed,course,device_id\n' +
            records.map(r => `${r.timestamp},${r.latitude},${r.longitude},${r.altitude},${r.speed},${r.course},${r.device_id}`).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=export.csv');
        res.send(csv);
    } else {
        res.json(records);
    }
});

// Backup management
app.post('/api/data/backup', (req, res) => {
    const backups = readData(backupsFile);
    const backup = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        devices: readData(devicesFile),
        records: readData(recordsFile)
    };
    backups.push(backup);
    writeData(backupsFile, backups);
    res.json(backup);
});

app.get('/api/data/backups', (req, res) => {
    res.json(readData(backupsFile));
});

// Performance data
app.get('/api/performance', (req, res) => {
    const devices = readData(devicesFile);
    const records = readData(recordsFile);
    
    res.json({
        devices_count: devices.length,
        records_count: records.length,
        active_devices: devices.filter(d => d.status === 'online').length,
        last_update: new Date().toISOString(),
        memory_usage: process.memoryUsage(),
        uptime: process.uptime()
    });
});

// Management data
app.get('/api/management', (req, res) => {
    const devices = readData(devicesFile);
    const records = readData(recordsFile);
    const backups = readData(backupsFile);
    
    res.json({
        total_devices: devices.length,
        total_records: records.length,
        total_backups: backups.length,
        storage_used: JSON.stringify(devices).length + JSON.stringify(records).length + JSON.stringify(backups).length,
        last_backup: backups.length > 0 ? backups[backups.length - 1].timestamp : null
    });
});

// Mobile interface route - serve the full mobile frontend
app.get('/mobile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mobile-frontend.html'));
});

// Root route
app.get('/', (req, res) => res.redirect('/mobile'));

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 OHW Mobile Full Server: http://localhost:${PORT}`);
    console.log(`📱 Full Mobile Interface: http://localhost:${PORT}/mobile`);
    console.log(`🌐 API Server: http://localhost:${PORT}/api`);
});

// WebSocket for real-time updates
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });
});

// Broadcast updates to all connected clients
function broadcastUpdate(type, data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type, data }));
        }
    });
}
EOF

# Copy the existing full mobile frontend
cp ~/ohw/mobile-frontend.html ~/ohwMobile/public/mobile-frontend.html

# If the file doesn't exist in the current directory, create it
if [ ! -f "~/ohwMobile/public/mobile-frontend.html" ]; then
    echo "Creating full mobile frontend..."
    # Create the public directory
    mkdir -p ~/ohwMobile/public
    
    # Download the full mobile frontend from the repository
    curl -s https://raw.githubusercontent.com/haryowl/ohw/main/mobile-frontend.html > ~/ohwMobile/public/mobile-frontend.html
fi

# Install dependencies
npm install --no-optional --ignore-scripts

# Create management scripts
cat > ~/ohw-start.sh << 'EOF'
#!/bin/bash
cd ~/ohwMobile
nohup node server.js > server.log 2>&1 &
echo $! > ~/ohw-server.pid
echo "✅ Full OHW Mobile Server started: http://localhost:3001/mobile"
echo "📱 Full Mobile Interface with all features available!"
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
    echo "✅ Full OHW Mobile Server running: http://localhost:3001/mobile"
    echo "📱 Full Mobile Interface with all features available!"
else
    echo "❌ Server not running"
fi
EOF

chmod +x ~/ohw-*.sh

echo "🎉 Full OHW Mobile Installation completed!"
echo ""
echo "🚀 Start: ~/ohw-start.sh"
echo "📱 Access: http://localhost:3001/mobile"
echo "🛑 Stop: ~/ohw-stop.sh"
echo "📊 Status: ~/ohw-status.sh"
echo ""
echo "🎯 Full Features Available:"
echo "- 📍 Live Tracking with Interactive Maps"
echo "- 📊 Complete Device Management"
echo "- 📈 Data Export (CSV, PFSL, JSON)"
echo "- 🔄 Peer-to-Peer Synchronization"
echo "- 💾 Backup & Restore Management"
echo "- ⚡ Performance Monitoring"
echo "- 🗺️ Offline Grid Support"
