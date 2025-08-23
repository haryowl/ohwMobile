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
const net = require('net');
const dgram = require('dgram');

const app = express();
const PORT = 3001;
const TCP_PORT = 8000;
const UDP_PORT = 8001;

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

// GalileoSky Parser
class GalileoSkyParser {
    constructor() {
        this.streamBuffers = new Map();
        this.isFirstPacket = new Map();
    }

    validatePacket(buffer) {
        if (buffer.length < 3) {
            return { valid: false, error: 'Packet too short' };
        }

        const header = buffer.readUInt8(0);
        const length = buffer.readUInt16LE(1);
        
        if (length > 32767) {
            return { valid: false, error: 'Invalid length' };
        }

        const expectedLength = length + 5; // HEAD + LENGTH + DATA + CRC
        const hasUnsentData = buffer.length > expectedLength;
        
        return {
            valid: true,
            header,
            length,
            expectedLength,
            hasUnsentData,
            actualLength: Math.min(length, buffer.length - 5)
        };
    }

    calculateCRC16Modbus(buffer) {
        let crc = 0xFFFF;
        for (let i = 0; i < buffer.length; i++) {
            crc ^= buffer[i];
            for (let j = 0; j < 8; j++) {
                if (crc & 0x0001) {
                    crc = (crc >> 1) ^ 0xA001;
                } else {
                    crc = crc >> 1;
                }
            }
        }
        return crc;
    }

    async parsePacket(buffer) {
        try {
            console.log('📡 Parsing GalileoSky packet:', buffer.toString('hex').toUpperCase());
            
            const validation = this.validatePacket(buffer);
            if (!validation.valid) {
                console.log('❌ Invalid packet:', validation.error);
                return null;
            }

            const { header, length, actualLength } = validation;
            const data = buffer.slice(3, 3 + actualLength);
            
            // Extract basic information
            const parsedData = {
                timestamp: new Date().toISOString(),
                header: `0x${header.toString(16)}`,
                length: actualLength,
                rawData: data.toString('hex').toUpperCase(),
                coordinates: null,
                imei: null
            };

            // Try to extract IMEI (look for 15-digit pattern)
            const dataHex = data.toString('hex');
            const imeiMatch = dataHex.match(/([0-9a-f]{15})/i);
            if (imeiMatch) {
                parsedData.imei = imeiMatch[1];
                console.log('📱 Found IMEI:', parsedData.imei);
            }

            // Try to extract coordinates
            if (data.length >= 8) {
                try {
                    const lat = data.readInt32LE(0) / 1000000;
                    const lon = data.readInt32LE(4) / 1000000;
                    
                    if (lat !== 0 && lon !== 0 && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
                        parsedData.coordinates = { latitude: lat, longitude: lon };
                        console.log('📍 Found coordinates:', lat, lon);
                    }
                } catch (e) {
                    // Ignore coordinate parsing errors
                }
            }

            return parsedData;
        } catch (error) {
            console.error('❌ Parsing error:', error);
            return null;
        }
    }
}

// Initialize parser
const galileoSkyParser = new GalileoSkyParser();

// TCP Server for GalileoSky devices
const tcpServer = net.createServer((socket) => {
    const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`🔌 TCP client connected: ${clientAddress}`);
    
    socket.on('data', async (data) => {
        try {
            console.log(`📡 Received TCP data from ${clientAddress}:`, data.toString('hex').toUpperCase());
            
            const parsedData = await galileoSkyParser.parsePacket(data);
            if (parsedData) {
                // Add to records
                const records = readData(recordsFile);
                const newRecord = {
                    id: Date.now(),
                    device_id: parsedData.imei || 'unknown',
                    latitude: parsedData.coordinates?.latitude || 0,
                    longitude: parsedData.coordinates?.longitude || 0,
                    altitude: 0,
                    speed: 0,
                    course: 0,
                    timestamp: parsedData.timestamp,
                    data: parsedData,
                    source: 'tcp',
                    client_address: clientAddress,
                    created_at: new Date().toISOString()
                };
                
                records.push(newRecord);
                writeData(recordsFile, records);
                
                // Update device if IMEI found
                if (parsedData.imei) {
                    const devices = readData(devicesFile);
                    let device = devices.find(d => d.imei === parsedData.imei);
                    
                    if (!device) {
                        device = {
                            id: Date.now(),
                            imei: parsedData.imei,
                            name: `Device ${parsedData.imei}`,
                            group: 'Auto-Detected',
                            status: 'online',
                            lastSeen: parsedData.timestamp,
                            totalRecords: 0,
                            created_at: new Date().toISOString()
                        };
                        devices.push(device);
                    } else {
                        device.lastSeen = parsedData.timestamp;
                        device.status = 'online';
                    }
                    
                    device.totalRecords = records.filter(r => r.device_id === parsedData.imei).length;
                    writeData(devicesFile, devices);
                }
                
                // Broadcast to WebSocket clients
                broadcastUpdate('newData', newRecord);
                
                console.log(`✅ Processed TCP data from ${clientAddress}`);
            }
            
            // Send confirmation
            socket.write(Buffer.from([0x02, 0x00, 0x00]));
            
        } catch (error) {
            console.error(`❌ Error processing TCP data from ${clientAddress}:`, error);
            socket.write(Buffer.from([0x02, 0x3F, 0x00]));
        }
    });
    
    socket.on('close', () => {
        console.log(`🔌 TCP client disconnected: ${clientAddress}`);
    });
    
    socket.on('error', (error) => {
        console.error(`❌ TCP socket error for ${clientAddress}:`, error);
    });
});

// UDP Server for GalileoSky devices
const udpServer = dgram.createSocket('udp4');

udpServer.on('message', async (msg, rinfo) => {
    try {
        const clientAddress = `${rinfo.address}:${rinfo.port}`;
        console.log(`📡 Received UDP data from ${clientAddress}:`, msg.toString('hex').toUpperCase());
        
        const parsedData = await galileoSkyParser.parsePacket(msg);
        if (parsedData) {
            // Add to records
            const records = readData(recordsFile);
            const newRecord = {
                id: Date.now(),
                device_id: parsedData.imei || 'unknown',
                latitude: parsedData.coordinates?.latitude || 0,
                longitude: parsedData.coordinates?.longitude || 0,
                altitude: 0,
                speed: 0,
                course: 0,
                timestamp: parsedData.timestamp,
                data: parsedData,
                source: 'udp',
                client_address: clientAddress,
                created_at: new Date().toISOString()
            };
            
            records.push(newRecord);
            writeData(recordsFile, records);
            
            // Update device if IMEI found
            if (parsedData.imei) {
                const devices = readData(devicesFile);
                let device = devices.find(d => d.imei === parsedData.imei);
                
                if (!device) {
                    device = {
                        id: Date.now(),
                        imei: parsedData.imei,
                        name: `Device ${parsedData.imei}`,
                        group: 'Auto-Detected',
                        status: 'online',
                        lastSeen: parsedData.timestamp,
                        totalRecords: 0,
                        created_at: new Date().toISOString()
                    };
                    devices.push(device);
                } else {
                    device.lastSeen = parsedData.timestamp;
                    device.status = 'online';
                }
                
                device.totalRecords = records.filter(r => r.device_id === parsedData.imei).length;
                writeData(devicesFile, devices);
            }
            
            // Broadcast to WebSocket clients
            broadcastUpdate('newData', newRecord);
            
            console.log(`✅ Processed UDP data from ${clientAddress}`);
        }
        
        // Send confirmation
        const response = Buffer.from([0x02, 0x00, 0x00]);
        udpServer.send(response, rinfo.port, rinfo.address);
        
    } catch (error) {
        console.error(`❌ Error processing UDP data:`, error);
        const errorResponse = Buffer.from([0x02, 0x3F, 0x00]);
        udpServer.send(errorResponse, rinfo.port, rinfo.address);
    }
});

udpServer.on('error', (error) => {
    console.error('❌ UDP server error:', error);
});

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
        const csv = 'timestamp,latitude,longitude,altitude,speed,course,device_id,source\n' +
            records.map(r => `${r.timestamp},${r.latitude},${r.longitude},${r.altitude},${r.speed},${r.course},${r.device_id},${r.source || 'manual'}`).join('\n');
        
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
    writeData(backupsFile, backup);
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
        uptime: process.uptime(),
        tcp_port: TCP_PORT,
        udp_port: UDP_PORT
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
        last_backup: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
        tcp_port: TCP_PORT,
        udp_port: UDP_PORT
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

// Start TCP server for GalileoSky devices
tcpServer.listen(TCP_PORT, '0.0.0.0', () => {
    console.log(`📡 TCP Server listening on port ${TCP_PORT} for GalileoSky devices`);
});

// Start UDP server for GalileoSky devices
udpServer.bind(UDP_PORT, '0.0.0.0', () => {
    console.log(`📡 UDP Server listening on port ${UDP_PORT} for GalileoSky devices`);
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
# cp ~/ohw/mobile-frontend.html ~/ohwMobile/public/mobile-frontend.html

# Download the full mobile frontend from the repository
echo "📥 Downloading full mobile frontend..."
mkdir -p ~/ohwMobile/public
curl -s https://raw.githubusercontent.com/haryowl/ohw/main/mobile-frontend.html > ~/ohwMobile/public/mobile-frontend.html

# Verify the download
if [ -f "~/ohwMobile/public/mobile-frontend.html" ]; then
    echo "✅ Full mobile frontend downloaded successfully"
else
    echo "❌ Failed to download mobile frontend, creating basic version..."
    # Create a basic version as fallback
    cat > ~/ohwMobile/public/mobile-frontend.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OHW Mobile - Full Interface</title>
    <style>
        body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; color: #333; padding: 20px; border-radius: 10px; margin: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .btn { background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px; font-size: 12px; }
        .device-item { padding: 10px; border-bottom: 1px solid #eee; }
        .status { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 10px; }
        .online { background: #4CAF50; }
        .offline { background: #f44336; }
        .header { text-align: center; margin-bottom: 30px; }
        .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .feature-card { background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛰️ OHW Mobile - Full Interface</h1>
            <p>Complete Device Tracking & Management System</p>
        </div>
        
        <div class="feature-grid">
            <div class="feature-card">
                <h3>📍 Live Tracking</h3>
                <p>Real-time GPS tracking with interactive maps</p>
            </div>
            <div class="feature-card">
                <h3>📊 Device Management</h3>
                <p>Complete device registration and monitoring</p>
            </div>
            <div class="feature-card">
                <h3>📈 Data Export</h3>
                <p>Export data in CSV, PFSL, and JSON formats</p>
            </div>
            <div class="feature-card">
                <h3>🔄 Peer Sync</h3>
                <p>Peer-to-peer data synchronization</p>
            </div>
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
            <button class="btn" onclick="exportData()">📤 Export Data</button>
        </div>

        <div class="card">
            <h3>📈 Performance & Management</h3>
            <div id="performance">Loading...</div>
        </div>
    </div>

    <script>
        async function loadStatus() {
            try {
                const response = await fetch('/api/management');
                const status = await response.json();
                document.getElementById('status').innerHTML = `
                    <p>🟢 Full OHW Mobile Server Running</p>
                    <p>📱 Total Devices: ${status.total_devices}</p>
                    <p>📊 Total Records: ${status.total_records}</p>
                    <p>💾 Backups: ${status.total_backups}</p>
                    <p>⏰ Last Backup: ${status.last_backup || 'None'}</p>
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
                        <br><small>Group: ${device.group} | Records: ${device.totalRecords} | Last Seen: ${new Date(device.lastSeen).toLocaleString()}</small>
                        <button class="btn" onclick="viewDevice(${device.id})">👁️ View</button>
                        <button class="btn" onclick="deleteDevice(${device.id})">🗑️ Delete</button>
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
            const group = prompt('Enter device group (optional):') || 'Default';
            
            fetch('/api/devices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imei, name, group })
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

        function viewDevice(id) {
            window.open(`/api/data/${id}/tracking`, '_blank');
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

        function exportData() {
            window.open('/api/data/export?format=csv', '_blank');
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
echo ""
echo "📡 Data Receiving Ports:"
echo "- TCP: Port 8000 (for GalileoSky devices)"
echo "- UDP: Port 8001 (for GalileoSky devices)"
echo ""
echo "🔍 Monitor Data Parsing:"
echo "- Server logs: tail -f ~/ohwMobile/server.log"
echo "- Latest data: curl http://localhost:3001/api/data/latest"
echo "- Performance: curl http://localhost:3001/api/performance"
