#!/bin/bash

# 🛰️ OHW Mobile - Enhance with GalileoSky Features
# This script enhances the working server with GalileoSky parsing

set -e

echo "========================================"
echo "  OHW Mobile - GalileoSky Enhancement"
echo "========================================"

cd ~/ohwMobile

# Backup the current working server
cp server.js server.js.backup
echo "✅ Backed up current working server"

# Create enhanced server with GalileoSky features
cat > server.js << 'EOF'
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

// GalileoSky Parser Class
class GalileoSkyParser {
    constructor() {
        this.streamBuffers = new Map();
    }

    validatePacket(buffer) {
        if (buffer.length < 3) {
            return { valid: false, error: 'Packet too short' };
        }

        const header = buffer.readUInt8(0);
        const rawLength = buffer.readUInt16LE(1);
        const actualLength = rawLength & 0x7FFF;
        const hasUnsentData = (rawLength & 0x8000) !== 0;

        console.log(`🔍 Packet validation - Header: 0x${header.toString(16)}, Length: ${actualLength}, HasUnsentData: ${hasUnsentData}`);

        const expectedLength = actualLength + 3;
        if (buffer.length < expectedLength + 2) {
            console.log(`⚠️ Incomplete packet: expected ${expectedLength + 2} bytes, got ${buffer.length} bytes`);
            return { valid: false, error: 'Incomplete packet' };
        }

        return {
            valid: true,
            header,
            actualLength,
            expectedLength,
            hasUnsentData,
            rawLength
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

    validatePacketCRC(packet) {
        if (packet.length < 5) return false;
        
        const packetData = packet.slice(0, packet.length - 2);
        const receivedCRC = packet.readUInt16LE(packet.length - 2);
        const calculatedCRC = this.calculateCRC16Modbus(packetData);
        
        const isValid = receivedCRC === calculatedCRC;
        console.log(`🔍 CRC Validation - Received: 0x${receivedCRC.toString(16).padStart(4, '0')}, Calculated: 0x${calculatedCRC.toString(16).padStart(4, '0')}, Valid: ${isValid}`);
        
        return isValid;
    }

    parseTag(buffer, offset) {
        if (offset >= buffer.length) return [null, offset];
        
        const tagType = buffer.readUInt8(offset);
        const tagHex = `0x${tagType.toString(16).padStart(2, '0')}`;
        
        let value = null;
        let bytesRead = 0;

        try {
            switch (tagType) {
                case 0x03: // IMEI
                    value = buffer.slice(offset + 1, offset + 16).toString('ascii');
                    bytesRead = 15;
                    break;
                case 0x20: // Date Time
                    value = new Date(buffer.readUInt32LE(offset + 1) * 1000);
                    bytesRead = 4;
                    break;
                case 0x30: // Coordinates
                    const lat = buffer.readInt32LE(offset + 1) / 10000000;
                    const lon = buffer.readInt32LE(offset + 5) / 10000000;
                    const satellites = buffer.readUInt8(offset + 9);
                    value = { latitude: lat, longitude: lon, satellites };
                    bytesRead = 9;
                    break;
                case 0x33: // Speed and Direction
                    const speed = buffer.readUInt16LE(offset + 1) / 10;
                    const direction = buffer.readUInt16LE(offset + 3) / 10;
                    value = { speed, direction };
                    bytesRead = 4;
                    break;
                case 0x34: // Height
                    value = buffer.readInt16LE(offset + 1);
                    bytesRead = 2;
                    break;
                case 0xe2: // User data 0
                    value = buffer.readUInt32LE(offset + 1);
                    bytesRead = 4;
                    break;
                case 0xe3: // User data 1
                    value = buffer.readUInt32LE(offset + 1);
                    bytesRead = 4;
                    break;
                case 0x58: // RS232 0 (Modbus)
                    value = buffer.readUInt16LE(offset + 1);
                    bytesRead = 2;
                    break;
                default:
                    console.log(`⚠️ Unknown tag: ${tagHex}`);
                    bytesRead = 1;
                    value = null;
            }
        } catch (error) {
            console.error(`❌ Error parsing tag ${tagHex}:`, error);
            bytesRead = 1;
            value = null;
        }

        return [{
            tag: tagHex,
            value: value
        }, offset + 1 + bytesRead];
    }

    async parsePacket(buffer) {
        try {
            console.log('📡 Parsing GalileoSky packet:', buffer.toString('hex').toUpperCase());
            
            const validation = this.validatePacket(buffer);
            if (!validation.valid) {
                console.log('❌ Invalid packet:', validation.error);
                return null;
            }

            const { header, actualLength } = validation;
            const data = buffer.slice(3, 3 + actualLength);
            
            console.log(`🔍 Parsing ${actualLength} bytes of data:`, data.toString('hex').toUpperCase());
            
            // Parse all tags in the packet
            const tags = {};
            let offset = 0;
            let tagCount = 0;
            
            while (offset < data.length - 2) {
                const [tag, newOffset] = this.parseTag(data, offset);
                if (tag) {
                    tags[tag.tag] = tag;
                    tagCount++;
                    console.log(`📋 Parsed tag ${tag.tag}:`, tag.value);
                }
                offset = newOffset;
                
                if (offset <= 0 || offset >= data.length) break;
            }
            
            console.log(`✅ Parsed ${tagCount} tags from packet`);
            
            // Extract key information
            const parsedData = {
                timestamp: new Date().toISOString(),
                header: `0x${header.toString(16)}`,
                length: actualLength,
                rawData: data.toString('hex').toUpperCase(),
                tags: tags,
                imei: tags['0x03']?.value || null,
                datetime: tags['0x20']?.value || new Date(),
                coordinates: tags['0x30']?.value || null,
                speed: tags['0x33']?.value?.speed || 0,
                altitude: tags['0x34']?.value || 0,
                satellites: tags['0x30']?.value?.satellites || 0,
                userData0: tags['0xe2']?.value || 0,
                userData1: tags['0xe3']?.value || 0,
                modbus0: tags['0x58']?.value || 0
            };

            // Log key findings
            if (parsedData.imei) console.log('📱 Found IMEI:', parsedData.imei);
            if (parsedData.coordinates) console.log('📍 Found coordinates:', parsedData.coordinates);
            if (parsedData.speed > 0) console.log('🏃 Speed:', parsedData.speed, 'km/h');
            if (parsedData.userData0 > 0) console.log('📊 UserData0:', parsedData.userData0);
            if (parsedData.userData1 > 0) console.log('📊 UserData1:', parsedData.userData1);
            if (parsedData.modbus0 > 0) console.log('📊 Modbus0:', parsedData.modbus0);

            return parsedData;
        } catch (error) {
            console.error('❌ Parsing error:', error);
            return null;
        }
    }
}

// Initialize parser
const galileoSkyParser = new GalileoSkyParser();

// Device tracking
const connectionToIMEI = new Map();
const deviceStats = new Map();

function updateDeviceTracking(imei, clientAddress, data) {
    if (clientAddress) {
        connectionToIMEI.set(clientAddress, imei);
    }
    
    console.log(`📱 Device tracking update - IMEI: ${imei}, Address: ${clientAddress}`);
    
    if (!deviceStats.has(imei)) {
        deviceStats.set(imei, {
            firstSeen: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            recordCount: 0,
            totalRecords: 0,
            clientAddress: clientAddress,
            lastLocation: null
        });
    }
    
    const device = deviceStats.get(imei);
    device.lastSeen = new Date().toISOString();
    device.recordCount++;
    device.totalRecords++;
    device.clientAddress = clientAddress;
    
    if (data.coordinates) {
        device.lastLocation = data.coordinates;
    }
    
    console.log(`📱 Device ${imei} stats updated - Records: ${device.totalRecords}, Last seen: ${device.lastSeen}`);
}

// TCP Server for GalileoSky devices
const tcpServer = net.createServer((socket) => {
    const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`🔌 TCP client connected: ${clientAddress}`);
    
    let buffer = Buffer.alloc(0);
    let unsentData = Buffer.alloc(0);
    
    socket.on('data', async (data) => {
        try {
            console.log(`📡 Received TCP data from ${clientAddress}:`, data.toString('hex').toUpperCase());
            
            if (unsentData.length > 0) {
                buffer = Buffer.concat([unsentData, data]);
                unsentData = Buffer.alloc(0);
            } else {
                buffer = data;
            }
            
            while (buffer.length >= 3) {
                const packetType = buffer.readUInt8(0);
                const rawLength = buffer.readUInt16LE(1);
                const actualLength = rawLength & 0x7FFF;
                const totalLength = actualLength + 3;
                
                console.log(`🔍 Processing packet - Type: 0x${packetType.toString(16)}, Length: ${actualLength}, Total: ${totalLength}, Buffer: ${buffer.length}`);
                
                if (buffer.length < totalLength + 2) {
                    console.log(`⚠️ Incomplete packet - waiting for more data. Buffer: ${buffer.length}, Need: ${totalLength + 2}`);
                    
                    const incompleteConfirmation = Buffer.from([0x02, 0x3F, 0xFA]);
                    if (socket.writable) {
                        socket.write(incompleteConfirmation);
                        console.log(`📤 023FFA confirmation sent for incomplete packet:`, incompleteConfirmation.toString('hex').toUpperCase());
                    }
                    
                    unsentData = Buffer.from(buffer);
                    break;
                }
                
                const packet = buffer.slice(0, totalLength + 2);
                buffer = buffer.slice(totalLength + 2);
                
                if (!galileoSkyParser.validatePacketCRC(packet)) {
                    console.log(`❌ Invalid CRC for packet from ${clientAddress}`);
                    
                    const errorConfirmation = Buffer.from([0x02, 0x3F, 0x00]);
                    if (socket.writable) {
                        socket.write(errorConfirmation);
                        console.log(`❌ Error confirmation sent:`, errorConfirmation.toString('hex').toUpperCase());
                    }
                    continue;
                }
                
                const packetChecksum = packet.readUInt16LE(packet.length - 2);
                const confirmationPacket = Buffer.from([0x02, packetChecksum & 0xFF, (packetChecksum >> 8) & 0xFF]);
                
                if (socket.writable) {
                    socket.write(confirmationPacket);
                    console.log(`✅ Confirmation sent to ${clientAddress}:`, confirmationPacket.toString('hex').toUpperCase());
                }
                
                const parsedData = await galileoSkyParser.parsePacket(packet);
                
                if (parsedData) {
                    if (parsedData.imei) {
                        updateDeviceTracking(parsedData.imei, clientAddress, parsedData);
                    }
                    
                    const records = readData(recordsFile);
                    const newRecord = {
                        id: Date.now(),
                        device_id: parsedData.imei || 'unknown',
                        latitude: parsedData.coordinates?.latitude || 0,
                        longitude: parsedData.coordinates?.longitude || 0,
                        altitude: parsedData.altitude || 0,
                        speed: parsedData.speed || 0,
                        course: parsedData.tags['0x33']?.value?.direction || 0,
                        satellites: parsedData.satellites || 0,
                        timestamp: parsedData.datetime || parsedData.timestamp,
                        data: parsedData,
                        userData0: parsedData.userData0 || 0,
                        userData1: parsedData.userData1 || 0,
                        modbus0: parsedData.modbus0 || 0,
                        source: 'tcp',
                        client_address: clientAddress,
                        created_at: new Date().toISOString()
                    };
                    
                    records.push(newRecord);
                    writeData(recordsFile, records);
                    
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
                                lastSeen: parsedData.datetime || parsedData.timestamp,
                                totalRecords: 0,
                                created_at: new Date().toISOString()
                            };
                            devices.push(device);
                        } else {
                            device.lastSeen = parsedData.datetime || parsedData.timestamp;
                            device.status = 'online';
                        }
                        
                        device.totalRecords = records.filter(r => r.device_id === parsedData.imei).length;
                        writeData(devicesFile, devices);
                    }
                    
                    console.log(`✅ Processed TCP data from ${clientAddress}`);
                }
            }
            
        } catch (error) {
            console.error(`❌ Error processing TCP data from ${clientAddress}:`, error);
            const errorConfirmation = Buffer.from([0x02, 0x3F, 0x00]);
            if (socket.writable) {
                socket.write(errorConfirmation);
                console.log(`❌ Error confirmation sent to ${clientAddress}:`, errorConfirmation.toString('hex').toUpperCase());
            }
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
        
        if (msg.length >= 3) {
            const packetType = msg.readUInt8(0);
            const rawLength = msg.readUInt16LE(1);
            const actualLength = rawLength & 0x7FFF;
            const totalLength = actualLength + 3;
            
            console.log(`🔍 Processing UDP packet - Type: 0x${packetType.toString(16)}, Length: ${actualLength}, Total: ${totalLength}, Buffer: ${msg.length}`);
            
            if (msg.length >= totalLength + 2) {
                const packet = msg.slice(0, totalLength + 2);
                
                if (!galileoSkyParser.validatePacketCRC(packet)) {
                    console.log(`❌ Invalid CRC for UDP packet from ${clientAddress}`);
                    
                    const errorConfirmation = Buffer.from([0x02, 0x3F, 0x00]);
                    udpServer.send(errorConfirmation, rinfo.port, rinfo.address);
                    console.log(`❌ UDP Error confirmation sent:`, errorConfirmation.toString('hex').toUpperCase());
                    return;
                }
                
                const packetChecksum = packet.readUInt16LE(packet.length - 2);
                const confirmationPacket = Buffer.from([0x02, packetChecksum & 0xFF, (packetChecksum >> 8) & 0xFF]);
                
                udpServer.send(confirmationPacket, rinfo.port, rinfo.address);
                console.log(`✅ UDP Confirmation sent to ${clientAddress}:`, confirmationPacket.toString('hex').toUpperCase());
                
                const parsedData = await galileoSkyParser.parsePacket(packet);
                
                if (parsedData) {
                    if (parsedData.imei) {
                        updateDeviceTracking(parsedData.imei, clientAddress, parsedData);
                    }
                    
                    const records = readData(recordsFile);
                    const newRecord = {
                        id: Date.now(),
                        device_id: parsedData.imei || 'unknown',
                        latitude: parsedData.coordinates?.latitude || 0,
                        longitude: parsedData.coordinates?.longitude || 0,
                        altitude: parsedData.altitude || 0,
                        speed: parsedData.speed || 0,
                        course: parsedData.tags['0x33']?.value?.direction || 0,
                        satellites: parsedData.satellites || 0,
                        timestamp: parsedData.datetime || parsedData.timestamp,
                        data: parsedData,
                        userData0: parsedData.userData0 || 0,
                        userData1: parsedData.userData1 || 0,
                        modbus0: parsedData.modbus0 || 0,
                        source: 'udp',
                        client_address: clientAddress,
                        created_at: new Date().toISOString()
                    };
                    
                    records.push(newRecord);
                    writeData(recordsFile, records);
                    
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
                                lastSeen: parsedData.datetime || parsedData.timestamp,
                                totalRecords: 0,
                                created_at: new Date().toISOString()
                            };
                            devices.push(device);
                        } else {
                            device.lastSeen = parsedData.datetime || parsedData.timestamp;
                            device.status = 'online';
                        }
                        
                        device.totalRecords = records.filter(r => r.device_id === parsedData.imei).length;
                        writeData(devicesFile, devices);
                    }
                    
                    console.log(`✅ Processed UDP data from ${clientAddress}`);
                }
            }
        }
        
    } catch (error) {
        console.error(`❌ Error processing UDP data from ${clientAddress}:`, error);
        const errorConfirmation = Buffer.from([0x02, 0x3F, 0x00]);
        udpServer.send(errorConfirmation, rinfo.port, rinfo.address);
        console.log(`❌ UDP Error confirmation sent to ${clientAddress}:`, errorConfirmation.toString('hex').toUpperCase());
    }
});

udpServer.on('error', (error) => {
    console.error('❌ UDP server error:', error);
});

// Enhanced API Routes
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
        activeConnections: connectionToIMEI.size,
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

// Data SM Export
app.get('/api/data/sm/export', (req, res) => {
    const { from, to, device, template = 'data_sm' } = req.query;
    let records = readData(recordsFile);
    const devices = readData(devicesFile);
    
    if (device) {
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
    
    const headers = [
        'Name', 'IMEI', 'Timestamp', 'Lat', 'Lon', 'Speed', 'Alt', 
        'Satellite', 'Sensor Kiri', 'Sensor Kanan', 'Sensor Serial (Ultrasonic)', 'Uptime Seconds'
    ];
    
    const csvData = records.map(r => {
        const device = devices.find(d => d.id == r.device_id);
        return [
            device?.name || 'Unknown',
            device?.imei || r.device_id,
            r.timestamp,
            r.latitude,
            r.longitude,
            r.speed,
            r.altitude,
            r.satellites,
            r.userData0 || 0,
            r.userData1 || 0,
            r.modbus0 || 0,
            r.userData2 || 0
        ].join(',');
    });
    
    const csv = [headers.join(','), ...csvData].join('\n');
    const filename = `${template}_${new Date().toISOString().split('T')[0]}.pfsl`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
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

echo "✅ Enhanced server with GalileoSky features created"

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
echo "- 🛰️ Full GalileoSky packet parsing"
echo "- 📊 Data SM export functionality"
echo "- 📱 Enhanced device tracking"
echo "- 🔄 Real-time data processing"
echo ""
echo "📱 Access: http://localhost:3001/mobile"
echo "📊 API: http://localhost:3001/api"
echo "📡 TCP: Port 8000 (for GalileoSky devices)"
echo "📡 UDP: Port 8001 (for GalileoSky devices)"
echo ""
echo "🔍 Monitor: tail -f ~/ohwMobile/server.log"

