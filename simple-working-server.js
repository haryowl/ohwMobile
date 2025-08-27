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
