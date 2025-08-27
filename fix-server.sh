#!/bin/bash

echo "🔧 Fixing broken server.js..."

# Go to the ohwMobile directory
cd ~/ohwMobile

# Backup the broken server.js
mv server.js server.js.broken

# Create a simple working server.js
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

app.get('/api/data/latest', (req, res) => {
    const records = readData(recordsFile);
    res.json(records.slice(-50));
});

app.get('/api/performance', (req, res) => {
    const devices = readData(devicesFile);
    const records = readData(recordsFile);
    
    res.json({
        devices_count: devices.length,
        records_count: records.length,
        active_devices: devices.filter(d => d.status === 'online').length,
        last_update: new Date().toISOString(),
        cpu: 25,
        memory: 50,
        network: 'Connected',
        battery: '100%',
        activeConnections: 0,
        dataRecords: records.length,
        tcp_port: 8000,
        udp_port: 8001
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

// Mobile interface route
app.get('/mobile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mobile-frontend.html'));
});

// Root route
app.get('/', (req, res) => res.redirect('/mobile'));

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 OHW Mobile Server: http://localhost:${PORT}`);
    console.log(`📱 Mobile Interface: http://localhost:${PORT}/mobile`);
    console.log(`🌐 API Server: http://localhost:${PORT}/api`);
});
EOF

echo "✅ Server.js fixed!"
echo "🚀 Now try: ~/ohw-start.sh"
