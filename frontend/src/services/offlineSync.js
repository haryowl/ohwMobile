// Enhanced Offline Synchronization Service
class OfflineSyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingSync = [];
    this.syncInProgress = false;
    this.lastSyncTime = null;
    this.syncInterval = null;
    this.retryAttempts = 0;
    this.maxRetryAttempts = 5;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadPendingSync();
    this.startPeriodicSync();
    this.registerServiceWorker();
  }

  setupEventListeners() {
    // Online/offline status changes
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onConnectionRestored();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.onConnectionLost();
    });

    // Before page unload, save pending sync
    window.addEventListener('beforeunload', () => {
      this.savePendingSync();
    });
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        
        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              this.showUpdateNotification();
            }
          });
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Cache API data for offline use
  async cacheApiData(endpoint, data) {
    try {
      // Store in localStorage for immediate access
      const cacheKey = `galileosky-cache-${endpoint}`;
      const cacheData = {
        data,
        timestamp: new Date().toISOString(),
        endpoint
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      // Also store in service worker if available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_API_DATA',
          endpoint,
          data
        });
      }
      
      console.log(`Cached data for ${endpoint}:`, data.length || 'N/A', 'items');
    } catch (error) {
      console.error('Failed to cache API data:', error);
    }
  }

  // Get cached data
  async getCachedData(endpoint) {
    try {
      const cacheKey = `galileosky-cache-${endpoint}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const cacheData = JSON.parse(cached);
        
        // Check if cache is still valid (24 hours)
        const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (cacheAge < maxAge) {
          return cacheData.data;
        } else {
          // Remove expired cache
          localStorage.removeItem(cacheKey);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  // Add data to pending sync queue
  async addToPendingSync(operation) {
    const syncItem = {
      id: this.generateId(),
      operation,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };
    
    this.pendingSync.push(syncItem);
    await this.savePendingSync();
    
    console.log('Added to pending sync:', syncItem);
    
    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPendingData();
    }
  }

  // Sync pending data when connection is restored
  async onConnectionRestored() {
    console.log('Connection restored, syncing pending data...');
    
    if (this.pendingSync.length > 0) {
      await this.syncPendingData();
    }
    
    // Update UI to show online status
    this.updateOnlineStatus(true);
  }

  // Handle connection loss
  onConnectionLost() {
    console.log('Connection lost, switching to offline mode');
    this.updateOnlineStatus(false);
  }

  // Sync all pending data
  async syncPendingData() {
    if (this.syncInProgress || this.pendingSync.length === 0) {
      return;
    }
    
    this.syncInProgress = true;
    console.log(`Syncing ${this.pendingSync.length} pending items...`);
    
    const successfulSyncs = [];
    const failedSyncs = [];
    
    for (const item of this.pendingSync) {
      try {
        const success = await this.syncItem(item);
        if (success) {
          successfulSyncs.push(item);
        } else {
          failedSyncs.push(item);
        }
      } catch (error) {
        console.error('Sync item failed:', item, error);
        failedSyncs.push(item);
      }
    }
    
    // Remove successful syncs
    this.pendingSync = failedSyncs;
    await this.savePendingSync();
    
    this.syncInProgress = false;
    this.lastSyncTime = new Date().toISOString();
    
    console.log(`Sync completed: ${successfulSyncs.length} successful, ${failedSyncs.length} failed`);
    
    // Show sync results
    this.showSyncResults(successfulSyncs.length, failedSyncs.length);
  }

  // Sync individual item
  async syncItem(item) {
    try {
      const { operation } = item;
      
      switch (operation.type) {
        case 'CREATE_DEVICE':
          return await this.syncCreateDevice(operation.data);
        case 'UPDATE_DEVICE':
          return await this.syncUpdateDevice(operation.data);
        case 'DELETE_DEVICE':
          return await this.syncDeleteDevice(operation.data);
        case 'CREATE_RECORD':
          return await this.syncCreateRecord(operation.data);
        case 'UPDATE_SETTINGS':
          return await this.syncUpdateSettings(operation.data);
        default:
          console.warn('Unknown sync operation type:', operation.type);
          return false;
      }
    } catch (error) {
      console.error('Sync item error:', error);
      return false;
    }
  }

  // Sync device creation
  async syncCreateDevice(deviceData) {
    const response = await fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceData)
    });
    return response.ok;
  }

  // Sync device update
  async syncUpdateDevice(deviceData) {
    const response = await fetch(`/api/devices/${deviceData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deviceData)
    });
    return response.ok;
  }

  // Sync device deletion
  async syncDeleteDevice(deviceData) {
    const response = await fetch(`/api/devices/${deviceData.id}`, {
      method: 'DELETE'
    });
    return response.ok;
  }

  // Sync record creation
  async syncCreateRecord(recordData) {
    const response = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recordData)
    });
    return response.ok;
  }

  // Sync settings update
  async syncUpdateSettings(settingsData) {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData)
    });
    return response.ok;
  }

  // Start periodic sync
  startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Sync every 5 minutes if online and there's pending data
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.pendingSync.length > 0) {
        this.syncPendingData();
      }
    }, 5 * 60 * 1000);
  }

  // Save pending sync to localStorage
  async savePendingSync() {
    try {
      localStorage.setItem('galileosky-pending-sync', JSON.stringify(this.pendingSync));
    } catch (error) {
      console.error('Failed to save pending sync:', error);
    }
  }

  // Load pending sync from localStorage
  async loadPendingSync() {
    try {
      const saved = localStorage.getItem('galileosky-pending-sync');
      if (saved) {
        this.pendingSync = JSON.parse(saved);
        console.log(`Loaded ${this.pendingSync.length} pending sync items`);
      }
    } catch (error) {
      console.error('Failed to load pending sync:', error);
      this.pendingSync = [];
    }
  }

  // Update online status in UI
  updateOnlineStatus(isOnline) {
    // Dispatch custom event for components to listen to
    const event = new CustomEvent('connectionStatusChanged', {
      detail: { isOnline }
    });
    window.dispatchEvent(event);
  }

  // Show sync results notification
  showSyncResults(successCount, failCount) {
    if (successCount > 0 || failCount > 0) {
      const message = `Sync completed: ${successCount} successful, ${failCount} failed`;
      
      // Show notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Galileosky Parser', {
          body: message,
          icon: '/favicon.ico'
        });
      }
      
      // Also show toast or alert
      console.log(message);
    }
  }

  // Show update notification
  showUpdateNotification() {
    const message = 'New version available. Refresh to update.';
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Galileosky Parser', {
        body: message,
        icon: '/favicon.ico',
        requireInteraction: true
      });
    }
  }

  // Generate unique ID for sync items
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get sync status
  getStatus() {
    return {
      isOnline: this.isOnline,
      pendingSyncCount: this.pendingSync.length,
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress
    };
  }

  // Clear all pending sync data
  async clearPendingSync() {
    this.pendingSync = [];
    await this.savePendingSync();
    console.log('Cleared all pending sync data');
  }

  // Export offline data
  exportOfflineData() {
    const exportData = {
      timestamp: new Date().toISOString(),
      cachedData: {},
      pendingSync: this.pendingSync,
      lastSyncTime: this.lastSyncTime
    };
    
    // Get all cached data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('galileosky-cache-')) {
        try {
          exportData.cachedData[key] = JSON.parse(localStorage.getItem(key));
        } catch (error) {
          console.error('Failed to parse cached data:', key, error);
        }
      }
    }
    
    return exportData;
  }

  // Import offline data
  async importOfflineData(data) {
    try {
      // Import cached data
      if (data.cachedData) {
        for (const [key, value] of Object.entries(data.cachedData)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      }
      
      // Import pending sync
      if (data.pendingSync) {
        this.pendingSync = data.pendingSync;
        await this.savePendingSync();
      }
      
      // Import last sync time
      if (data.lastSyncTime) {
        this.lastSyncTime = data.lastSyncTime;
      }
      
      console.log('Offline data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import offline data:', error);
      return false;
    }
  }
}

// Create singleton instance
const offlineSyncService = new OfflineSyncService();

export default offlineSyncService;

