#!/bin/bash

echo "🔄 Updating server configuration for modular interface..."

# Update server.js to serve the new modular pages
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
app.use(express.static('.'));

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

// Basic API routes
app.get('/api/devices', (req, res) => {
    res.json(readData(devicesFile));
});

app.post('/api/devices', (req, res) => {
    try {
        const devices = readData(devicesFile);
        const newDevice = {
            id: Date.now(),
            ...req.body,
            status: 'offline',
            lastSeen: new Date().toISOString(),
            totalRecords: 0
        };
        devices.push(newDevice);
        writeData(devicesFile, devices);
        res.json(newDevice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/devices/:id', (req, res) => {
    try {
        const devices = readData(devicesFile);
        const deviceIndex = devices.findIndex(d => d.id == req.params.id);
        if (deviceIndex !== -1) {
            devices[deviceIndex] = { ...devices[deviceIndex], ...req.body };
            writeData(devicesFile, devices);
            res.json(devices[deviceIndex]);
        } else {
            res.status(404).json({ error: 'Device not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/devices/:id', (req, res) => {
    try {
        const devices = readData(devicesFile);
        const filteredDevices = devices.filter(d => d.id != req.params.id);
        writeData(devicesFile, filteredDevices);
        res.json({ message: 'Device deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/data/latest', (req, res) => {
    const records = readData(recordsFile);
    const limit = parseInt(req.query.limit) || 50;
    res.json(records.slice(-limit));
});

app.get('/api/performance', (req, res) => {
    const devices = readData(devicesFile);
    const records = readData(recordsFile);
    
    res.json({
        devices_count: devices.length,
        records_count: records.length,
        activeDevices: devices.filter(d => d.status === 'online').length,
        last_update: new Date().toISOString(),
        cpu: Math.floor(Math.random() * 30) + 20,
        memory: Math.floor(Math.random() * 40) + 30,
        network: 'Connected',
        battery: '100%',
        activeConnections: Math.floor(Math.random() * 5),
        dataRecords: records.length,
        tcp_port: 8000,
        udp_port: 8001,
        storageUsed: Math.round((JSON.stringify(devices).length + JSON.stringify(records).length) / 1024) + ' KB'
    });
});

app.get('/api/management', (req, res) => {
    const devices = readData(devicesFile);
    const records = readData(recordsFile);
    const backups = readData(backupsFile);
    
    res.json({
        totalRecords: records.length,
        activeDevices: devices.filter(d => d.status === 'online').length,
        storageUsed: Math.round((JSON.stringify(devices).length + JSON.stringify(records).length) / 1024) + ' KB',
        lastBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
        tcp_port: 8000,
        udp_port: 8001
    });
});

app.get('/api/peer/status', (req, res) => {
    res.json({
        status: 'standalone',
        message: 'Peer sync not configured',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/data/backups', (req, res) => {
    res.json(readData(backupsFile));
});

app.get('/api/data/sm/auto-export', (req, res) => {
    res.json([]);
});

// Serve modular pages
app.get('/', (req, res) => res.redirect('/mobile-main.html'));
app.get('/mobile', (req, res) => res.redirect('/mobile-main.html'));

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 OHW Mobile Server: http://localhost:${PORT}`);
    console.log(`📱 Main Interface: http://localhost:${PORT}/mobile-main.html`);
    console.log(`📍 Tracking: http://localhost:${PORT}/mobile-tracking.html`);
    console.log(`📱 Devices: http://localhost:${PORT}/mobile-devices.html`);
    console.log(`📊 Data: http://localhost:${PORT}/mobile-data.html`);
    console.log(`🌐 API Server: http://localhost:${PORT}/api`);
});
EOF

echo "✅ Server configuration updated!"
echo "🚀 Starting server..."

# Start the server
node server.js
