// backend/src/routes/data.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const asyncHandler = require('../utils/asyncHandler'); // Import your async error handler
const dataAggregator = require('../services/dataAggregator'); // Import your data service
const dataSMService = require('../services/dataSMService'); // Import Data SM service
const { Record, Device } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Get device data
router.get('/:deviceId', asyncHandler(async (req, res) => {
    const { deviceId } = req.params;
    const data = await dataAggregator.getDeviceData(deviceId); // Call your data service
    res.json(data);
}));

// Get tracking data for a device (using device datetime for filtering)
router.get('/:deviceId/tracking', asyncHandler(async (req, res) => {
    const { deviceId } = req.params;
    const { startDate, endDate } = req.query;
    
    const where = {
        deviceImei: deviceId,
        latitude: { [Op.ne]: null },
        longitude: { [Op.ne]: null }
    };
    
    if (startDate && endDate) {
        // Use device datetime field for filtering instead of server timestamp
        where.datetime = {
            [Op.between]: [new Date(startDate), new Date(endDate)]
        };
    }
    
    const trackingData = await Record.findAll({
        where,
        attributes: ['timestamp', 'datetime', 'latitude', 'longitude', 'speed', 'direction', 'height', 'satellites'],
        order: [['datetime', 'ASC']] // Order by device datetime instead of server timestamp
    });
    
    res.json(trackingData);
}));

// Get export data for a device (using device datetime for filtering)
router.get('/:deviceId/export', asyncHandler(async (req, res) => {
    const { deviceId } = req.params;
    const { startDate, endDate } = req.query;
    
    const where = {
        deviceImei: deviceId
    };
    
    if (startDate && endDate) {
        // Use device datetime field for filtering instead of server timestamp
        where.datetime = {
            [Op.between]: [new Date(startDate), new Date(endDate)]
        };
    }
    
    const exportData = await Record.findAll({
        where,
        attributes: [
            'timestamp', 'datetime', 'latitude', 'longitude', 'speed', 'direction', 
            'height', 'satellites', 'status', 'supplyVoltage', 'batteryVoltage',
            'input0', 'input1', 'input2', 'input3',
            'inputVoltage0', 'inputVoltage1', 'inputVoltage2', 'inputVoltage3',
            'inputVoltage4', 'inputVoltage5', 'inputVoltage6',
            'userData0', 'userData1', 'userData2', 'userData3',
            'userData4', 'userData5', 'userData6', 'userData7',
            'modbus0', 'modbus1', 'modbus2', 'modbus3', 'modbus4', 'modbus5',
            'modbus6', 'modbus7', 'modbus8', 'modbus9', 'modbus10', 'modbus11',
            'modbus12', 'modbus13', 'modbus14', 'modbus15'
        ],
        order: [['datetime', 'ASC']] // Order by device datetime instead of server timestamp
    });
    
    res.json(exportData);
}));

// Get Data SM export data with specific field mapping
router.get('/sm/export', asyncHandler(async (req, res) => {
    const { from, to, deviceId, fields } = req.query;
    
    const data = await dataSMService.exportData({ from, to, deviceId, fields });
    res.json(data);
}));

// Schedule auto-export for Data SM
router.post('/sm/auto-export', asyncHandler(async (req, res) => {
    const { deviceId, template } = req.body;
    
    const jobId = await dataSMService.scheduleAutoExport(deviceId, template);
    res.json({ success: true, jobId });
}));

// Cancel auto-export for Data SM
router.delete('/sm/auto-export/:jobId', asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    
    const cancelled = dataSMService.cancelAutoExport(jobId);
    res.json({ success: cancelled });
}));

// Get active auto-export jobs
router.get('/sm/auto-export', asyncHandler(async (req, res) => {
    const jobs = dataSMService.getActiveJobs();
    res.json({ jobs });
}));

// Get dashboard data
router.get('/dashboard', asyncHandler(async (req, res) => {
    const stats = await dataAggregator.getDashboardData();
    const realtimeData = await dataAggregator.getRealtimeData(); // Example
    res.json({ stats, realtimeData });
}));

// Get latest device data for mobile interface
router.get('/latest', asyncHandler(async (req, res) => {
    try {
        const latestRecords = await Record.findAll({
            attributes: [
                'deviceImei', 'datetime', 'latitude', 'longitude', 'speed', 
                'direction', 'height', 'satellites', 'status', 'supplyVoltage',
                'userData0', 'userData1', 'userData2', 'modbus0'
            ],
            order: [['datetime', 'DESC']],
            limit: 50
        });
        
        res.json(latestRecords);
    } catch (error) {
        logger.error('Error fetching latest data:', error);
        res.status(500).json({ error: 'Failed to fetch latest data' });
    }
}));

// Data export with template support
router.get('/export', asyncHandler(async (req, res) => {
    const { format, from, to, deviceId, template } = req.query;
    
    try {
        let where = {};
        
        if (from && to) {
            where.datetime = {
                [Op.between]: [new Date(from), new Date(to)]
            };
        }
        
        if (deviceId && deviceId !== 'all') {
            where.deviceImei = deviceId;
        }
        
        const records = await Record.findAll({
            where,
            order: [['datetime', 'ASC']]
        });
        
        let csvContent = '';
        let filename = 'data_export.csv';
        
        if (format === 'pfsl') {
            // Data SM format with custom headers
            const headers = [
                'Name', 'IMEI', 'Timestamp', 'Lat', 'Lon', 'Speed', 'Alt', 'Satellite',
                'Sensor Kiri', 'Sensor Kanan', 'Sensor Serial ( Ultrasonic )', 'Uptime Seconds'
            ];
            
            csvContent = headers.join(',') + '\n';
            csvContent += records.map(record => [
                record.deviceImei, // Name (using IMEI as fallback)
                record.deviceImei, // IMEI
                record.datetime, // Timestamp
                record.latitude, // Lat
                record.longitude, // Lon
                record.speed, // Speed
                record.height, // Alt
                record.satellites, // Satellite
                record.userData0, // Sensor Kiri
                record.userData1, // Sensor Kanan
                record.modbus0, // Sensor Serial ( Ultrasonic )
                record.userData2 // Uptime Seconds
            ].join(',')).join('\n');
            
            filename = template ? 
                template.replace('{date}', new Date().toISOString().split('T')[0])
                       .replace('{time}', new Date().toISOString().split('T')[1].split('.')[0])
                       .replace('{device}', deviceId || 'all') + '.pfsl' :
                `data_sm_${new Date().toISOString().split('T')[0]}.pfsl`;
        } else if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"}`);
            return res.json(records);
        } else {
            // Default CSV format
            const headers = Object.keys(records[0]?.dataValues || {});
            csvContent = headers.join(',') + '\n';
            csvContent += records.map(record => 
                Object.values(record.dataValues).join(',')
            ).join('\n');
            
            filename = template ? 
                template.replace('{date}', new Date().toISOString().split('T')[0])
                       .replace('{time}', new Date().toISOString().split('T')[1].split('.')[0])
                       .replace('{device}', deviceId || 'all') + '.csv' :
                `data_export_${new Date().toISOString().split('T')[0]}.csv`;
        }
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"}`);
        res.send(csvContent);
        
    } catch (error) {
        logger.error('Error exporting data:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
}));

// Performance metrics endpoint
router.get('/performance', asyncHandler(async (req, res) => {
    try {
        const os = require('os');
        
        // Get system performance metrics
        const cpuUsage = Math.round((1 - os.loadavg()[0] / os.cpus().length) * 100);
        const memoryUsage = Math.round((1 - os.freemem() / os.totalmem()) * 100);
        
        // Get database statistics
        const totalRecords = await Record.count();
        const activeDevices = await Record.count({
            distinct: true,
            col: 'deviceImei',
            where: {
                datetime: {
                    [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
            }
        });
        
        // Get network status (simplified)
        const networkStatus = 'Connected'; // This could be enhanced with actual network checks
        
        // Get battery level (simplified - would need actual battery monitoring)
        const batteryLevel = 85; // Placeholder
        
        // Get active connections (WebSocket clients)
        const activeConnections = global.wss ? global.wss.clients.size : 0;
        
        res.json({
            cpu: cpuUsage,
            memory: memoryUsage,
            network: networkStatus,
            battery: batteryLevel,
            activeConnections,
            dataRecords: totalRecords,
            activeDevices
        });
    } catch (error) {
        logger.error('Error fetching performance metrics:', error);
        res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
}));

// Data management info
router.get('/management', asyncHandler(async (req, res) => {
    try {
        const totalRecords = await Record.count();
        const activeDevices = await Record.count({
            distinct: true,
            col: 'deviceImei',
            where: {
                datetime: {
                    [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
            }
        });
        
        // Calculate storage usage (simplified)
        const storageUsed = Math.round(totalRecords * 0.5); // Rough estimate: 0.5KB per record
        
        // Get last backup info (placeholder)
        const lastBackup = 'Never'; // This would be implemented with actual backup system
        
        res.json({
            totalRecords,
            activeDevices,
            storageUsed: `${storageUsed} KB`,
            lastBackup
        });
    } catch (error) {
        logger.error('Error fetching data management info:', error);
        res.status(500).json({ error: 'Failed to fetch data management info' });
    }
}));

// Backup management endpoints
router.post('/backup', asyncHandler(async (req, res) => {
    try {
        const backupDir = path.join(__dirname, '../../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupDir, `data_backup_${timestamp}.json`);
        
        // Export all data to JSON
        const records = await Record.findAll();
        const devices = await Device.findAll();
        
        const backupData = {
            timestamp: new Date().toISOString(),
            records: records.map(r => r.toJSON()),
            devices: devices.map(d => d.toJSON())
        };
        
        fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
        
        res.json({ 
            success: true, 
            message: 'Backup created successfully',
            backupFile: path.basename(backupFile)
        });
    } catch (error) {
        logger.error('Error creating backup:', error);
        res.status(500).json({ error: 'Failed to create backup' });
    }
}));

router.get('/backups', asyncHandler(async (req, res) => {
    try {
        const backupDir = path.join(__dirname, '../../backups');
        if (!fs.existsSync(backupDir)) {
            return res.json([]);
        }
        
        const backupFiles = fs.readdirSync(backupDir)
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(backupDir, file);
                const stats = fs.statSync(filePath);
                return {
                    id: file.replace('.json', ''),
                    filename: file,
                    createdAt: stats.birthtime.toISOString(),
                    size: `${Math.round(stats.size / 1024)} KB`,
                    records: 'Unknown' // Would need to read file to get actual count
                };
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json(backupFiles);
    } catch (error) {
        logger.error('Error listing backups:', error);
        res.status(500).json({ error: 'Failed to list backups' });
    }
}));

router.post('/backups/:backupId/restore', asyncHandler(async (req, res) => {
    try {
        const { backupId } = req.params;
        const backupDir = path.join(__dirname, '../../backups');
        const backupFile = path.join(backupDir, `${backupId}.json`);
        
        if (!fs.existsSync(backupFile)) {
            return res.status(404).json({ error: 'Backup not found' });
        }
        
        const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
        
        // Clear existing data
        await Record.destroy({ where: {} });
        await Device.destroy({ where: {} });
        
        // Restore data
        if (backupData.records) {
            await Record.bulkCreate(backupData.records);
        }
        if (backupData.devices) {
            await Device.bulkCreate(backupData.devices);
        }
        
        res.json({ success: true, message: 'Backup restored successfully' });
    } catch (error) {
        logger.error('Error restoring backup:', error);
        res.status(500).json({ error: 'Failed to restore backup' });
    }
}));

router.delete('/backups/:backupId', asyncHandler(async (req, res) => {
    try {
        const { backupId } = req.params;
        const backupDir = path.join(__dirname, '../../backups');
        const backupFile = path.join(backupDir, `${backupId}.json`);
        
        if (!fs.existsSync(backupFile)) {
            return res.status(404).json({ error: 'Backup not found' });
        }
        
        fs.unlinkSync(backupFile);
        res.json({ success: true, message: 'Backup deleted successfully' });
    } catch (error) {
        logger.error('Error deleting backup:', error);
        res.status(500).json({ error: 'Failed to delete backup' });
    }
}));

router.post('/restore', asyncHandler(async (req, res) => {
    try {
        const backupDir = path.join(__dirname, '../../backups');
        const backupFiles = fs.readdirSync(backupDir)
            .filter(file => file.endsWith('.json'))
            .sort()
            .reverse();
        
        if (backupFiles.length === 0) {
            return res.status(404).json({ error: 'No backups available' });
        }
        
        const latestBackup = backupFiles[0];
        const backupFile = path.join(backupDir, latestBackup);
        const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
        
        // Clear existing data
        await Record.destroy({ where: {} });
        await Device.destroy({ where: {} });
        
        // Restore data
        if (backupData.records) {
            await Record.bulkCreate(backupData.records);
        }
        if (backupData.devices) {
            await Device.bulkCreate(backupData.devices);
        }
        
        res.json({ success: true, message: 'Latest backup restored successfully' });
    } catch (error) {
        logger.error('Error restoring latest backup:', error);
        res.status(500).json({ error: 'Failed to restore backup' });
    }
}));

router.post('/clear', asyncHandler(async (req, res) => {
    try {
        await Record.destroy({ where: {} });
        await Device.destroy({ where: {} });
        
        res.json({ success: true, message: 'All data cleared successfully' });
    } catch (error) {
        logger.error('Error clearing data:', error);
        res.status(500).json({ error: 'Failed to clear data' });
    }
}));

// Get device-specific data
router.get('/device/:deviceId', asyncHandler(async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { limit = 100 } = req.query;
        
        const records = await Record.findAll({
            where: { deviceImei: deviceId },
            order: [['datetime', 'DESC']],
            limit: parseInt(limit),
            attributes: [
                'datetime', 'latitude', 'longitude', 'speed', 'direction',
                'height', 'satellites', 'status', 'supplyVoltage',
                'userData0', 'userData1', 'userData2', 'modbus0'
            ]
        });
        
        res.json(records);
    } catch (error) {
        logger.error('Error fetching device data:', error);
        res.status(500).json({ error: 'Failed to fetch device data' });
    }
}));

module.exports = router;
