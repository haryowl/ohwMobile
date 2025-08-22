// Enhanced API Service with Offline Support
import offlineSyncService from './offlineSync';

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || '';
    this.isOnline = navigator.onLine;
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Enhanced fetch with offline support
  async fetch(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      // Try online request first
      if (this.isOnline) {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });

        if (response.ok) {
          // Cache successful responses
          const data = await response.clone().json();
          await this.cacheResponse(endpoint, data);
          return response;
        }
      }
    } catch (error) {
      console.log('Online request failed, trying offline cache:', error.message);
    }

    // Fallback to offline cache
    const cachedData = await this.getCachedData(endpoint);
    if (cachedData) {
      return new Response(JSON.stringify(cachedData), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // No cached data available
    throw new Error('No data available offline');
  }

  // Cache API response
  async cacheResponse(endpoint, data) {
    try {
      await offlineSyncService.cacheApiData(endpoint, data);
    } catch (error) {
      console.error('Failed to cache response:', error);
    }
  }

  // Get cached data
  async getCachedData(endpoint) {
    try {
      return await offlineSyncService.getCachedData(endpoint);
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  // Add to pending sync
  async addToPendingSync(operation) {
    try {
      await offlineSyncService.addToPendingSync(operation);
    } catch (error) {
      console.error('Failed to add to pending sync:', error);
    }
  }

  // Sync pending data
  async syncPendingData() {
    try {
      await offlineSyncService.syncPendingData();
    } catch (error) {
      console.error('Failed to sync pending data:', error);
    }
  }

  // Device Management API
  async getDevices() {
    return this.fetch('/api/devices');
  }

  async getDevice(id) {
    return this.fetch(`/api/devices/${id}`);
  }

  async createDevice(deviceData) {
    if (this.isOnline) {
      const response = await fetch(`${this.baseURL}/api/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceData)
      });
      return response;
    } else {
      // Add to pending sync
      await this.addToPendingSync({
        type: 'CREATE_DEVICE',
        data: deviceData
      });
      
      // Return optimistic response
      return new Response(JSON.stringify({
        ...deviceData,
        id: `temp-${Date.now()}`,
        pending: true
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 202
      });
    }
  }

  async updateDevice(id, deviceData) {
    if (this.isOnline) {
      const response = await fetch(`${this.baseURL}/api/devices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceData)
      });
      return response;
    } else {
      // Add to pending sync
      await this.addToPendingSync({
        type: 'UPDATE_DEVICE',
        data: { id, ...deviceData }
      });
      
      // Return optimistic response
      return new Response(JSON.stringify({
        ...deviceData,
        id,
        pending: true
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 202
      });
    }
  }

  async deleteDevice(id) {
    if (this.isOnline) {
      const response = await fetch(`${this.baseURL}/api/devices/${id}`, {
        method: 'DELETE'
      });
      return response;
    } else {
      // Add to pending sync
      await this.addToPendingSync({
        type: 'DELETE_DEVICE',
        data: { id }
      });
      
      // Return optimistic response
      return new Response(JSON.stringify({ success: true, pending: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 202
      });
    }
  }

  // Data Management API
  async getData(deviceId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/data${deviceId ? `/${deviceId}` : ''}${queryString ? `?${queryString}` : ''}`;
    return this.fetch(endpoint);
  }

  async getRecords(deviceId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/records${deviceId ? `/${deviceId}` : ''}${queryString ? `?${queryString}` : ''}`;
    return this.fetch(endpoint);
  }

  async createRecord(recordData) {
    if (this.isOnline) {
      const response = await fetch(`${this.baseURL}/api/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData)
      });
      return response;
    } else {
      // Add to pending sync
      await this.addToPendingSync({
        type: 'CREATE_RECORD',
        data: recordData
      });
      
      // Return optimistic response
      return new Response(JSON.stringify({
        ...recordData,
        id: `temp-${Date.now()}`,
        pending: true
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 202
      });
    }
  }

  // Mobile Status API
  async getMobileStatus() {
    return this.fetch('/api/mobile/status');
  }

  async getMobileInfo() {
    return this.fetch('/api/mobile/info');
  }

  async optimizeMobile(level) {
    if (this.isOnline) {
      const response = await fetch(`${this.baseURL}/api/mobile/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level })
      });
      return response;
    } else {
      // Add to pending sync
      await this.addToPendingSync({
        type: 'UPDATE_SETTINGS',
        data: { mobileOptimization: level }
      });
      
      return new Response(JSON.stringify({ 
        message: 'Optimization queued for sync',
        pending: true 
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 202
      });
    }
  }

  // Settings API
  async getSettings() {
    return this.fetch('/api/settings');
  }

  async updateSettings(settingsData) {
    if (this.isOnline) {
      const response = await fetch(`${this.baseURL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      });
      return response;
    } else {
      // Add to pending sync
      await this.addToPendingSync({
        type: 'UPDATE_SETTINGS',
        data: settingsData
      });
      
      return new Response(JSON.stringify({
        ...settingsData,
        pending: true
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 202
      });
    }
  }

  // Alerts API
  async getAlerts() {
    return this.fetch('/api/alerts');
  }

  async createAlert(alertData) {
    if (this.isOnline) {
      const response = await fetch(`${this.baseURL}/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData)
      });
      return response;
    } else {
      // Add to pending sync
      await this.addToPendingSync({
        type: 'CREATE_ALERT',
        data: alertData
      });
      
      return new Response(JSON.stringify({
        ...alertData,
        id: `temp-${Date.now()}`,
        pending: true
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 202
      });
    }
  }

  // Export API
  async exportData(format = 'csv', params = {}) {
    const queryString = new URLSearchParams({ format, ...params }).toString();
    const endpoint = `/api/data/export?${queryString}`;
    
    if (this.isOnline) {
      return fetch(`${this.baseURL}${endpoint}`);
    } else {
      // For offline export, return cached data
      const cachedData = await this.getCachedData('/api/data');
      if (cachedData) {
        // Convert to requested format
        const exportData = this.convertToFormat(cachedData, format);
        return new Response(exportData, {
          headers: { 
            'Content-Type': format === 'csv' ? 'text/csv' : 'application/json',
            'Content-Disposition': `attachment; filename="galileosky-data-${new Date().toISOString().split('T')[0]}.${format}"`
          }
        });
      }
      
      throw new Error('No data available for export');
    }
  }

  // Convert data to different formats
  convertToFormat(data, format) {
    switch (format) {
      case 'csv':
        return this.convertToCSV(data);
      case 'json':
        return JSON.stringify(data, null, 2);
      default:
        return JSON.stringify(data);
    }
  }

  // Convert data to CSV
  convertToCSV(data) {
    if (!data || !Array.isArray(data)) {
      return '';
    }

    if (data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  // Get sync status
  getSyncStatus() {
    return offlineSyncService.getStatus();
  }

  // Clear pending sync
  async clearPendingSync() {
    await offlineSyncService.clearPendingSync();
  }

  // Export offline data
  exportOfflineData() {
    return offlineSyncService.exportOfflineData();
  }

  // Import offline data
  async importOfflineData(data) {
    return offlineSyncService.importOfflineData(data);
  }

  // Check if currently online
  isCurrentlyOnline() {
    return this.isOnline;
  }

  // Force sync
  async forceSync() {
    await this.syncPendingData();
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
