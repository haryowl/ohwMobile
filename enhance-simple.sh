#!/bin/bash

echo "🛰️ Enhancing working server with GalileoSky features..."

cd ~/ohwMobile

# Backup current server
cp server.js server.js.backup

# Add GalileoSky parser and TCP/UDP servers
cat > server-enhanced.js << 'EOF'
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const net = require('net');
const dgram = require('dgram');

const app = express();
const PORT = 3001;
const TCP_PORT = 8000;
const UDP_PORT = 8001;

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

// Simple GalileoSky Parser
class GalileoSkyParser {
    parsePacket(buffer) {
        try {
            console.log('📡 Parsing GalileoSky packet:', buffer.toString('hex').toUpperCase());
            
            if (buffer.length < 3) {
                console.log('❌ Packet too short');
                return null;
            }

            const header = buffer.readUInt8(0);
            const rawLength = buffer.readUInt16LE(1);
            const actualLength = rawLength & 0x7FFF;
            
            console.log(`🔍 Packet - Header: 0x${header.toString(16)}, Length: ${actualLength}`);
            
            const data = buffer.slice(3, 3 + actualLength);
            
            // Simple parsing - extract IMEI if present
            let imei = null;
            let coordinates = null;
            let speed = 0;
            let altitude = 0;
            
            // Look for IMEI tag (0x03)
            for (let i = 0; i < data.length - 15; i++) {
                if (data.readUInt8(i) === 0x03) {
                    imei = data.slice(i + 1, i + 16).toString('ascii');
                    console.log('📱 Found IMEI:', imei);
                    break;
                }
            }
            
            // Look for coordinates tag (0x30)
            for (let i = 0; i < data.length - 9; i++) {
                if (data.readUInt8(i) === 0x30) {
                    const lat = data.readInt32LE(i + 1) / 10000000;
                    const lon = data.readInt32LE(i + 5) / 10000000;
                    const satellites = data.readUInt8(i + 9);
                    coordinates = { latitude: lat, longitude: lon, satellites };
                    console.log('📍 Found coordinates:', coordinates);
                    break;
                }
            }
            
            // Look for speed tag (0x33)
            for (let i = 0; i < data.length - 4; i++) {
                if (data.readUInt8(i) === 0x33) {
                    speed = data.readUInt16LE(i + 1) / 10;
                    console.log('🏃 Found speed:', speed, 'km/h');
                    break;
                }
            }
            
            // Look for altitude tag (0x34)
            for (let i = 0; i < data.length - 2; i++) {
                if (data.readUInt8(i) === 0x34) {
                    altitude = data.readInt16LE(i + 1);
                    console.log('📏 Found altitude:', altitude, 'm');
                    break;
                }
            }

            return {
                timestamp: new Date().toISOString(),
                header: `0x${header.toString(16)}`,
                length: actualLength,
                rawData: data.toString('hex').toUpperCase(),
                imei: imei,
                coordinates: coordinates,
                speed: speed,
                altitude: altitude
            };
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
            
            // Send confirmation (simple 0x02 response)
            const confirmation = Buffer.from([0x02]);
            socket.write(confirmation);
            console.log(`✅ Confirmation sent to ${clientAddress}`);
            
            // Parse the packet
            const parsedData = galileoSkyParser.parsePacket(data);
            
            if (parsedData) {
                // Add to records
                const records = readData(recordsFile);
                const newRecord = {
                    id: Date.now(),
                    device_id: parsedData.imei || 'unknown',
                    latitude: parsedData.coordinates?.latitude || 0,
                    longitude: parsedData.coordinates?.longitude || 0,
                    altitude: parsedData.altitude || 0,
                    speed: parsedData.speed || 0,
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
                
                console.log(`✅ Processed TCP data from ${clientAddress}`);
            }
            
        } catch (error) {
            console.error(`❌ Error processing TCP data from ${clientAddress}:`, error);
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
        
        // Send confirmation
        const confirmation = Buffer.from([0x02]);
        udpServer.send(confirmation, rinfo.port, rinfo.address);
        console.log(`✅ UDP Confirmation sent to ${clientAddress}`);
        
        // Parse the packet
        const parsedData = galileoSkyParser.parsePacket(msg);
        
        if (parsedData) {
            // Add to records
            const records = readData(recordsFile);
            const newRecord = {
                id: Date.now(),
                device_id: parsedData.imei || 'unknown',
                latitude: parsedData.coordinates?.latitude || 0,
                longitude: parsedData.coordinates?.longitude || 0,
                altitude: parsedData.altitude || 0,
                speed: parsedData.speed || 0,
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
            
            console.log(`✅ Processed UDP data from ${clientAddress}`);
        }
        
    } catch (error) {
        console.error(`❌ Error processing UDP data from ${clientAddress}:`, error);
    }
});

udpServer.on('error', (error) => {
    console.error('❌ UDP server error:', error);
});

// API Routes (same as before)
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
    res.json(records.slice(-100));
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
        dataRecords: records.length,
        tcp_port: TCP_PORT,
        udp_port: UDP_PORT
    });
});

app.get('/api/management', (req, res) => {
    const devices = readData(devicesFile);
    const records = readData(recordsFile);
    
    res.json({
        totalRecords: records.length,
        activeDevices: devices.filter(d => d.status === 'online').length,
        storageUsed: Math.round((JSON.stringify(devices).length + JSON.stringify(records).length) / 1024) + ' KB',
        lastBackup: null,
        tcp_port: TCP_PORT,
        udp_port: UDP_PORT
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
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Enhanced OHW Mobile Server: http://localhost:${PORT}`);
    console.log(`📱 Mobile Interface: http://localhost:${PORT}/mobile`);
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
EOF

# Replace the current server with the enhanced version
mv server-enhanced.js server.js

echo "✅ Enhanced server created with GalileoSky features"

# Restart the server
echo "🔄 Restarting server with GalileoSky features..."
pkill -f "node server.js" 2>/dev/null
sleep 2
nohup node server.js > server.log 2>&1 &
echo $! > ~/ohw-server.pid

echo "🎉 GalileoSky Enhancement Complete!"
echo ""
echo "🚀 Enhanced Server Features:"
echo "- 📡 TCP Server on port 8000 for GalileoSky devices"
echo "- 📡 UDP Server on port 8001 for GalileoSky devices"
echo "- 🛰️ Basic GalileoSky packet parsing"
echo "- 📱 Device auto-detection"
echo "- 📊 Real-time data processing"
echo ""
echo "📱 Access: http://localhost:3001/mobile"
echo "📊 API: http://localhost:3001/api"
echo "📡 TCP: Port 8000 (for GalileoSky devices)"
echo "📡 UDP: Port 8001 (for GalileoSky devices)"
echo ""
echo "🔍 Monitor: tail -f ~/ohwMobile/server.log"

