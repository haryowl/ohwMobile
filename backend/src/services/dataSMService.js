const { Record } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');

class DataSMService {
  constructor() {
    this.autoExportJobs = new Map();
  }

  async exportData(params) {
    const { from, to, deviceId, fields } = params;
    
    let whereClause = {};
    
    if (deviceId && deviceId !== 'all') {
      whereClause.deviceImei = deviceId;
    }
    
    if (from || to) {
      whereClause.datetime = {};
      if (from) whereClause.datetime[Op.gte] = new Date(from);
      if (to) whereClause.datetime[Op.lte] = new Date(to);
    }
    
    const records = await Record.findAll({
      where: whereClause,
      order: [['datetime', 'ASC']],
      limit: 10000
    });
    
    // Transform data for Data SM format
    const transformedRecords = records.map(record => {
      return {
        DevicesName: record.deviceName || '',
        DeviceImei: record.deviceImei || '',
        Datetime: record.datetime || record.timestamp || '',
        Latitude: record.latitude || '',
        Longitude: record.longitude || '',
        Speed: record.speed || '',
        Altitude: record.height || '',
        Satellites: record.satellites || '',
        UserData0: record.userData0 || '',
        UserData1: record.userData1 || '',
        Modbus0: record.modbus0 || '',
        UserData2: record.userData2 || ''
      };
    });
    
    return transformedRecords;
  }

  generateCSV(data) {
    if (data.length === 0) return '';
    
    const fieldMapping = {
      DevicesName: 'Name',
      DeviceImei: 'IMEI',
      Datetime: 'Timestamp',
      Latitude: 'Lat',
      Longitude: 'Lon',
      Speed: 'Speed',
      Altitude: 'Alt',
      Satellites: 'Satellite',
      UserData0: 'Sensor Kiri',
      UserData1: 'Sensor Kanan',
      Modbus0: 'Sensor Serial ( Ultrasonic )',
      UserData2: 'Uptime Seconds'
    };
    
    const headers = Object.values(fieldMapping);
    const rows = data.map(record => 
      headers.map(header => {
        const originalField = Object.keys(fieldMapping).find(key => fieldMapping[key] === header);
        const value = record[originalField];
        
        // Handle special cases for date formatting
        if (header === 'Timestamp' && value) {
          return new Date(value).toISOString();
        }
        return value || '';
      })
    );

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  async scheduleAutoExport(deviceId, template) {
    const jobId = `auto_export_${deviceId}_${Date.now()}`;
    
    // Schedule daily export at midnight
    const job = setInterval(async () => {
      try {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const data = await this.exportData({
          from: yesterday.toISOString(),
          to: now.toISOString(),
          deviceId: deviceId
        });
        
        if (data.length > 0) {
          const csvContent = this.generateCSV(data);
          const filename = this.generateFilename(template, deviceId, yesterday);
          await this.saveFile(csvContent, filename);
          
          console.log(`Auto-export completed: ${filename} with ${data.length} records`);
        }
      } catch (error) {
        console.error('Auto-export failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // Run every 24 hours
    
    this.autoExportJobs.set(jobId, job);
    return jobId;
  }

  generateFilename(template, deviceId, date) {
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    
    let filename = template
      .replace('{date}', dateStr)
      .replace('{time}', timeStr)
      .replace('{device}', deviceId.replace(/\s+/g, '_'))
      .replace('{datetime}', `${dateStr}_${timeStr}`);
    
    if (!filename.endsWith('.pfsl')) {
      filename += '.pfsl';
    }
    
    return filename;
  }

  async saveFile(content, filename) {
    const exportDir = path.join(__dirname, '../../exports');
    
    try {
      await fs.mkdir(exportDir, { recursive: true });
      const filePath = path.join(exportDir, filename);
      await fs.writeFile(filePath, content, 'utf8');
      return filePath;
    } catch (error) {
      console.error('Failed to save export file:', error);
      throw error;
    }
  }

  cancelAutoExport(jobId) {
    const job = this.autoExportJobs.get(jobId);
    if (job) {
      clearInterval(job);
      this.autoExportJobs.delete(jobId);
      return true;
    }
    return false;
  }

  getActiveJobs() {
    return Array.from(this.autoExportJobs.keys());
  }
}

module.exports = new DataSMService();
