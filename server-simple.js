const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3001;

// Simple MIME type mapping
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif'
};

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

function generateCSV(records) {
    const headers = ['Device ID', 'Latitude', 'Longitude', 'Speed', 'Timestamp'];
    const rows = records.map(record => [
        record.device_id || record.id,
        record.latitude,
        record.longitude,
        record.speed || 0,
        new Date(record.timestamp).toLocaleString()
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

// Initialize data files
if (!fs.existsSync(devicesFile)) writeData(devicesFile, []);
if (!fs.existsSync(recordsFile)) writeData(recordsFile, []);
if (!fs.existsSync(backupsFile)) writeData(backupsFile, []);

// Create HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // API routes
    if (pathname.startsWith('/api/')) {
        res.setHeader('Content-Type', 'application/json');
        
        if (pathname === '/api/devices' && req.method === 'GET') {
            res.end(JSON.stringify(readData(devicesFile)));
        }
        else if (pathname === '/api/devices' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const devices = readData(devicesFile);
                    const newDevice = {
                        id: Date.now(),
                        ...JSON.parse(body),
                        status: 'offline',
                        lastSeen: new Date().toISOString(),
                        totalRecords: 0
                    };
                    devices.push(newDevice);
                    writeData(devicesFile, devices);
                    res.end(JSON.stringify(newDevice));
                } catch (error) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: error.message }));
                }
            });
        }
        else if (pathname.startsWith('/api/devices/') && req.method === 'PUT') {
            const deviceId = pathname.split('/')[3];
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const devices = readData(devicesFile);
                    const deviceIndex = devices.findIndex(d => d.id == deviceId);
                    if (deviceIndex !== -1) {
                        devices[deviceIndex] = { ...devices[deviceIndex], ...JSON.parse(body) };
                        writeData(devicesFile, devices);
                        res.end(JSON.stringify(devices[deviceIndex]));
                    } else {
                        res.writeHead(404);
                        res.end(JSON.stringify({ error: 'Device not found' }));
                    }
                } catch (error) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: error.message }));
                }
            });
        }
        else if (pathname.startsWith('/api/devices/') && req.method === 'DELETE') {
            const deviceId = pathname.split('/')[3];
            try {
                const devices = readData(devicesFile);
                const filteredDevices = devices.filter(d => d.id != deviceId);
                writeData(devicesFile, filteredDevices);
                res.end(JSON.stringify({ message: 'Device deleted' }));
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: error.message }));
            }
        }
        else if (pathname === '/api/data/latest') {
            const records = readData(recordsFile);
            const limit = parseInt(parsedUrl.query.limit) || 50;
            res.end(JSON.stringify(records.slice(-limit)));
        }
        else if (pathname === '/api/performance') {
            const devices = readData(devicesFile);
            const records = readData(recordsFile);
            
            res.end(JSON.stringify({
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
            }));
        }
        else if (pathname === '/api/management') {
            const devices = readData(devicesFile);
            const records = readData(recordsFile);
            const backups = readData(backupsFile);
            
            res.end(JSON.stringify({
                totalRecords: records.length,
                activeDevices: devices.filter(d => d.status === 'online').length,
                storageUsed: Math.round((JSON.stringify(devices).length + JSON.stringify(records).length) / 1024) + ' KB',
                lastBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
                tcp_port: 8000,
                udp_port: 8001
            }));
        }
        else if (pathname === '/api/peer/status') {
            res.end(JSON.stringify({
                status: 'standalone',
                message: 'Peer sync not configured',
                timestamp: new Date().toISOString()
            }));
        }
        else if (pathname === '/api/data/backups') {
            res.end(JSON.stringify(readData(backupsFile)));
        }
        else if (pathname === '/api/data/sm/auto-export') {
            res.end(JSON.stringify([]));
        }
        else if (pathname === '/api/data/export') {
            const format = parsedUrl.query.format || 'csv';
            const records = readData(recordsFile);
            
            if (format === 'csv') {
                const csvContent = generateCSV(records);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="data_export.csv"');
                res.end(csvContent);
            } else if (format === 'json') {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', 'attachment; filename="data_export.json"');
                res.end(JSON.stringify(records, null, 2));
            } else {
                res.end(JSON.stringify({ message: 'Export completed', format, count: records.length }));
            }
        }
        else if (pathname === '/api/data/backup' && req.method === 'POST') {
            try {
                const devices = readData(devicesFile);
                const records = readData(recordsFile);
                const backups = readData(backupsFile);
                
                const backup = {
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    devices_count: devices.length,
                    records_count: records.length,
                    data: { devices, records }
                };
                
                backups.push(backup);
                writeData(backupsFile, backups);
                
                res.end(JSON.stringify(backup));
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: error.message }));
            }
        }
        else if (pathname === '/api/data/backups' && req.method === 'GET') {
            const backups = readData(backupsFile);
            res.end(JSON.stringify(backups));
        }
        else if (pathname.startsWith('/api/data/backups/') && pathname.includes('/restore') && req.method === 'POST') {
            const backupId = pathname.split('/')[4];
            try {
                const backups = readData(backupsFile);
                const backup = backups.find(b => b.id === backupId);
                
                if (backup && backup.data) {
                    writeData(devicesFile, backup.data.devices || []);
                    writeData(recordsFile, backup.data.records || []);
                    res.end(JSON.stringify({ message: 'Backup restored successfully' }));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Backup not found' }));
                }
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: error.message }));
            }
        }
        else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'API endpoint not found' }));
        }
        return;
    }
    
    // Serve static files
    let filePath = pathname;
    if (filePath === '/' || filePath === '/mobile') {
        filePath = '/mobile-main.html';
    }
    
    const extname = path.extname(filePath);
    const contentType = mimeTypes[extname] || 'text/plain';
    
    fs.readFile(path.join(__dirname, filePath), (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 OHW Mobile Server: http://localhost:${PORT}`);
    console.log(`📱 Main Interface: http://localhost:${PORT}/mobile-main.html`);
    console.log(`📍 Tracking: http://localhost:${PORT}/mobile-tracking.html`);
    console.log(`📱 Devices: http://localhost:${PORT}/mobile-devices.html`);
    console.log(`📊 Data: http://localhost:${PORT}/mobile-data.html`);
    console.log(`🌐 API Server: http://localhost:${PORT}/api`);
});
