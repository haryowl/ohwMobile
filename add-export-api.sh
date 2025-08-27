#!/bin/bash

echo "📤 Adding Data Export API endpoints..."

cd ~/ohwMobile

# Add export API endpoints to the current server
cat >> server.js << 'EOF'

// Data Export API
app.get('/api/data/export', (req, res) => {
    const { format = 'csv', from, to, device } = req.query;
    let records = readData(recordsFile);
    const devices = readData(devicesFile);
    
    // Apply filters
    if (device && device !== 'all') {
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
    
    if (format === 'pfsl') {
        // Data SM format
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
                r.satellites || 0,
                r.userData0 || 0,
                r.userData1 || 0,
                r.modbus0 || 0,
                r.userData2 || 0
            ].join(',');
        });
        
        const csv = [headers.join(','), ...csvData].join('\n');
        const filename = `data_sm_${new Date().toISOString().split('T')[0]}.pfsl`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } else if (format === 'csv') {
        // Standard CSV format
        const csv = 'timestamp,latitude,longitude,altitude,speed,course,device_id,source,userData0,userData1,modbus0,userData2\n' +
            records.map(r => `${r.timestamp},${r.latitude},${r.longitude},${r.altitude},${r.speed},${r.course || 0},${r.device_id},${r.source || 'manual'},${r.userData0 || 0},${r.userData1 || 0},${r.modbus0 || 0},${r.userData2 || 0}`).join('\n');
        
        const filename = `data_export_${new Date().toISOString().split('T')[0]}.csv`;
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } else {
        // JSON format
        res.json(records);
    }
});

// Data SM Export
app.get('/api/data/sm/export', (req, res) => {
    const { from, to, device, template = 'data_sm' } = req.query;
    let records = readData(recordsFile);
    const devices = readData(devicesFile);
    
    // Apply filters
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
    
    // Generate Data SM format CSV
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
            r.satellites || 0,
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

// Backup management
app.post('/api/data/backup', (req, res) => {
    try {
        const backup = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            devices: readData(devicesFile),
            records: readData(recordsFile)
        };
        
        const backupsFile = path.join(dataDir, 'backups.json');
        const backups = readData(backupsFile);
        backups.push(backup);
        writeData(backupsFile, backups);
        
        res.json(backup);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create backup' });
    }
});

app.get('/api/data/backups', (req, res) => {
    const backupsFile = path.join(dataDir, 'backups.json');
    res.json(readData(backupsFile));
});

app.post('/api/data/restore', (req, res) => {
    try {
        const backupsFile = path.join(dataDir, 'backups.json');
        const backups = readData(backupsFile);
        
        if (backups.length === 0) {
            return res.status(404).json({ error: 'No backups available' });
        }
        
        // Get the most recent backup
        const latestBackup = backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        
        // Clear existing data
        writeData(devicesFile, []);
        writeData(recordsFile, []);
        
        // Restore from backup
        writeData(devicesFile, latestBackup.devices || []);
        writeData(recordsFile, latestBackup.records || []);
        
        res.json({ success: true, message: 'Latest backup restored successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to restore backup' });
    }
});

app.post('/api/data/clear', (req, res) => {
    try {
        writeData(devicesFile, []);
        writeData(recordsFile, []);
        res.json({ success: true, message: 'All data cleared successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear data' });
    }
});

// Device-specific data endpoint
app.get('/api/data/device/:deviceId', (req, res) => {
    const { deviceId } = req.params;
    const { limit = 100, from, to } = req.query;
    
    let records = readData(recordsFile).filter(r => r.device_id == deviceId);
    
    if (from || to) {
        records = records.filter(r => {
            const recordDate = new Date(r.timestamp);
            if (from && recordDate < new Date(from)) return false;
            if (to && recordDate > new Date(to)) return false;
            return true;
        });
    }
    
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    records = records.slice(0, parseInt(limit));
    
    res.json(records);
});

// Update device endpoint
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

// Delete device endpoint
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

EOF

echo "✅ Export API endpoints added"

# Restart the server
echo "🔄 Restarting server with export features..."
pkill -f "node server.js" 2>/dev/null
sleep 2
nohup node server.js > server.log 2>&1 &
echo $! > ~/ohw-server.pid

echo "🎉 Export Features Added!"
echo ""
echo "📤 New Export Features:"
echo "- Data Export (CSV, PFSL, JSON)"
echo "- Data SM Export"
echo "- Backup Management"
echo "- Device-specific data"
echo "- Device CRUD operations"
echo ""
echo "📱 Access: http://localhost:3001/mobile"
echo "🔍 Monitor: tail -f ~/ohwMobile/server.log"

