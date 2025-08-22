// Performance Optimization Service for Mobile Devices
class PerformanceOptimizer {
  constructor() {
    this.performanceMode = 'balanced'; // power_save, balanced, performance
    this.metrics = {
      fps: 0,
      memoryUsage: 0,
      batteryLevel: 100,
      networkSpeed: 0,
      cpuUsage: 0,
      lastUpdate: Date.now()
    };
    
    this.optimizationSettings = {
      power_save: {
        mapUpdateInterval: 10000, // 10 seconds
        dataPollingInterval: 30000, // 30 seconds
        maxCachedItems: 1000,
        enableAnimations: false,
        enableRealTimeUpdates: false,
        mapQuality: 'low',
        maxConcurrentRequests: 2,
        enableWebSocket: false,
        enableNotifications: false,
        enableBackgroundSync: false
      },
      balanced: {
        mapUpdateInterval: 5000, // 5 seconds
        dataPollingInterval: 15000, // 15 seconds
        maxCachedItems: 5000,
        enableAnimations: true,
        enableRealTimeUpdates: true,
        mapQuality: 'medium',
        maxConcurrentRequests: 5,
        enableWebSocket: true,
        enableNotifications: true,
        enableBackgroundSync: true
      },
      performance: {
        mapUpdateInterval: 2000, // 2 seconds
        dataPollingInterval: 5000, // 5 seconds
        maxCachedItems: 10000,
        enableAnimations: true,
        enableRealTimeUpdates: true,
        mapQuality: 'high',
        maxConcurrentRequests: 10,
        enableWebSocket: true,
        enableNotifications: true,
        enableBackgroundSync: true
      }
    };
    
    this.monitoringInterval = null;
    this.optimizationInterval = null;
    this.eventListeners = new Map();
    
    this.init();
  }

  init() {
    this.startMonitoring();
    this.startOptimization();
    this.setupEventListeners();
    this.loadSettings();
  }

  // Start performance monitoring
  startMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
    }, 5000); // Update metrics every 5 seconds
  }

  // Update performance metrics
  async updateMetrics() {
    try {
      // Get battery information
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        this.metrics.batteryLevel = Math.round(battery.level * 100);
      }

      // Get memory information
      if ('memory' in performance) {
        this.metrics.memoryUsage = Math.round(
          (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100
        );
      }

      // Calculate FPS (simplified)
      this.metrics.fps = this.calculateFPS();

      // Get network information
      if ('connection' in navigator) {
        const connection = navigator.connection;
        this.metrics.networkSpeed = connection.effectiveType || 'unknown';
      }

      // Estimate CPU usage based on performance
      this.metrics.cpuUsage = this.estimateCPUUsage();

      this.metrics.lastUpdate = Date.now();

      // Dispatch metrics update event
      this.dispatchEvent('metricsUpdated', this.metrics);

      // Auto-adjust performance mode based on metrics
      this.autoAdjustPerformanceMode();

    } catch (error) {
      console.error('Error updating performance metrics:', error);
    }
  }

  // Calculate FPS using requestAnimationFrame
  calculateFPS() {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const countFrames = (currentTime) => {
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
        return fps;
      }
      
      requestAnimationFrame(countFrames);
    };
    
    requestAnimationFrame(countFrames);
    return 60; // Default fallback
  }

  // Estimate CPU usage based on performance metrics
  estimateCPUUsage() {
    // Simple estimation based on memory usage and FPS
    const memoryFactor = this.metrics.memoryUsage / 100;
    const fpsFactor = Math.max(0, (60 - this.metrics.fps) / 60);
    
    return Math.round((memoryFactor + fpsFactor) * 50);
  }

  // Auto-adjust performance mode based on current metrics
  autoAdjustPerformanceMode() {
    const { batteryLevel, memoryUsage, fps, cpuUsage } = this.metrics;
    
    let newMode = this.performanceMode;
    
    // Switch to power save mode if:
    if (batteryLevel < 20 || memoryUsage > 80 || fps < 30 || cpuUsage > 80) {
      newMode = 'power_save';
    }
    // Switch to performance mode if:
    else if (batteryLevel > 80 && memoryUsage < 50 && fps > 55 && cpuUsage < 30) {
      newMode = 'performance';
    }
    // Default to balanced mode
    else {
      newMode = 'balanced';
    }
    
    if (newMode !== this.performanceMode) {
      this.setPerformanceMode(newMode);
    }
  }

  // Set performance mode manually
  setPerformanceMode(mode) {
    if (!this.optimizationSettings[mode]) {
      console.warn(`Invalid performance mode: ${mode}`);
      return;
    }
    
    this.performanceMode = mode;
    this.applyOptimizations();
    this.saveSettings();
    
    // Dispatch mode change event
    this.dispatchEvent('modeChanged', { mode, settings: this.getCurrentSettings() });
    
    console.log(`Performance mode changed to: ${mode}`);
  }

  // Apply current optimization settings
  applyOptimizations() {
    const settings = this.getCurrentSettings();
    
    // Apply settings to various components
    this.applyMapOptimizations(settings);
    this.applyDataOptimizations(settings);
    this.applyUIOptimizations(settings);
    this.applyNetworkOptimizations(settings);
  }

  // Apply map-specific optimizations
  applyMapOptimizations(settings) {
    // Update map update interval
    if (window.mapUpdateInterval) {
      clearInterval(window.mapUpdateInterval);
    }
    
    if (settings.enableRealTimeUpdates) {
      window.mapUpdateInterval = setInterval(() => {
        this.dispatchEvent('mapUpdate', { quality: settings.mapQuality });
      }, settings.mapUpdateInterval);
    }
    
    // Set map quality
    this.dispatchEvent('mapQualityChanged', { quality: settings.mapQuality });
  }

  // Apply data-specific optimizations
  applyDataOptimizations(settings) {
    // Update data polling interval
    if (window.dataPollingInterval) {
      clearInterval(window.dataPollingInterval);
    }
    
    window.dataPollingInterval = setInterval(() => {
      this.dispatchEvent('dataPoll', { maxItems: settings.maxCachedItems });
    }, settings.dataPollingInterval);
    
    // Limit cached items
    this.limitCachedItems(settings.maxCachedItems);
  }

  // Apply UI optimizations
  applyUIOptimizations(settings) {
    // Toggle animations
    document.body.style.setProperty('--enable-animations', settings.enableAnimations ? '1' : '0');
    
    // Toggle real-time updates
    this.dispatchEvent('realTimeUpdatesChanged', { enabled: settings.enableRealTimeUpdates });
    
    // Toggle notifications
    this.dispatchEvent('notificationsChanged', { enabled: settings.enableNotifications });
  }

  // Apply network optimizations
  applyNetworkOptimizations(settings) {
    // Limit concurrent requests
    this.dispatchEvent('concurrentRequestsChanged', { max: settings.maxConcurrentRequests });
    
    // Toggle WebSocket
    this.dispatchEvent('webSocketChanged', { enabled: settings.enableWebSocket });
    
    // Toggle background sync
    this.dispatchEvent('backgroundSyncChanged', { enabled: settings.enableBackgroundSync });
  }

  // Limit cached items to prevent memory issues
  limitCachedItems(maxItems) {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith('galileosky-cache-'));
      
      if (cacheKeys.length > maxItems) {
        // Sort by timestamp and remove oldest
        const cacheData = cacheKeys.map(key => ({
          key,
          timestamp: JSON.parse(localStorage.getItem(key))?.timestamp || 0
        })).sort((a, b) => a.timestamp - b.timestamp);
        
        const itemsToRemove = cacheData.slice(0, cacheKeys.length - maxItems);
        itemsToRemove.forEach(item => {
          localStorage.removeItem(item.key);
        });
        
        console.log(`Removed ${itemsToRemove.length} old cache items`);
      }
    } catch (error) {
      console.error('Error limiting cached items:', error);
    }
  }

  // Start optimization loop
  startOptimization() {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
    }

    this.optimizationInterval = setInterval(() => {
      this.performOptimizations();
    }, 30000); // Run optimizations every 30 seconds
  }

  // Perform periodic optimizations
  performOptimizations() {
    // Clean up memory
    this.cleanupMemory();
    
    // Optimize images
    this.optimizeImages();
    
    // Clean up event listeners
    this.cleanupEventListeners();
    
    // Optimize DOM
    this.optimizeDOM();
  }

  // Clean up memory
  cleanupMemory() {
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    // Clear unused caches
    this.clearUnusedCaches();
    
    // Clear console logs in production
    if (process.env.NODE_ENV === 'production') {
      console.clear();
    }
  }

  // Clear unused caches
  clearUnusedCaches() {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      keys.forEach(key => {
        if (key.startsWith('galileosky-cache-')) {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && (now - new Date(data.timestamp).getTime()) > maxAge) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('Error clearing unused caches:', error);
    }
  }

  // Optimize images
  optimizeImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      // Lazy load images that are not in viewport
      if (!img.loading) {
        img.loading = 'lazy';
      }
      
      // Set appropriate sizes for responsive images
      if (!img.sizes) {
        img.sizes = '(max-width: 768px) 100vw, 50vw';
      }
    });
  }

  // Clean up event listeners
  cleanupEventListeners() {
    // Remove unused event listeners
    this.eventListeners.forEach((listener, event) => {
      if (!listener.active) {
        this.eventListeners.delete(event);
      }
    });
  }

  // Optimize DOM
  optimizeDOM() {
    // Remove unused DOM elements
    const unusedElements = document.querySelectorAll('[data-unused="true"]');
    unusedElements.forEach(element => {
      element.remove();
    });
    
    // Optimize scroll performance
    const scrollContainers = document.querySelectorAll('.scroll-container');
    scrollContainers.forEach(container => {
      container.style.willChange = 'transform';
    });
  }

  // Setup event listeners
  setupEventListeners() {
    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.onPageHidden();
      } else {
        this.onPageVisible();
      }
    });
    
    // Listen for battery changes
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        battery.addEventListener('levelchange', () => {
          this.updateMetrics();
        });
      });
    }
    
    // Listen for network changes
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        this.updateMetrics();
      });
    }
  }

  // Handle page hidden
  onPageHidden() {
    // Reduce performance when page is not visible
    this.setPerformanceMode('power_save');
  }

  // Handle page visible
  onPageVisible() {
    // Restore previous performance mode
    this.autoAdjustPerformanceMode();
  }

  // Get current optimization settings
  getCurrentSettings() {
    return this.optimizationSettings[this.performanceMode];
  }

  // Get current metrics
  getMetrics() {
    return { ...this.metrics };
  }

  // Get performance mode
  getPerformanceMode() {
    return this.performanceMode;
  }

  // Add event listener
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push({ callback, active: true });
  }

  // Remove event listener
  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.findIndex(listener => listener.callback === callback);
      if (index !== -1) {
        listeners[index].active = false;
      }
    }
  }

  // Dispatch event
  dispatchEvent(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(listener => {
        if (listener.active) {
          listener.callback(data);
        }
      });
    }
  }

  // Save settings to localStorage
  saveSettings() {
    try {
      localStorage.setItem('galileosky-performance-settings', JSON.stringify({
        mode: this.performanceMode,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving performance settings:', error);
    }
  }

  // Load settings from localStorage
  loadSettings() {
    try {
      const saved = localStorage.getItem('galileosky-performance-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.mode && this.optimizationSettings[settings.mode]) {
          this.performanceMode = settings.mode;
          this.applyOptimizations();
        }
      }
    } catch (error) {
      console.error('Error loading performance settings:', error);
    }
  }

  // Get optimization recommendations
  getRecommendations() {
    const recommendations = [];
    const { batteryLevel, memoryUsage, fps, cpuUsage } = this.metrics;
    
    if (batteryLevel < 30) {
      recommendations.push({
        type: 'warning',
        message: 'Low battery detected. Consider switching to power save mode.',
        action: () => this.setPerformanceMode('power_save')
      });
    }
    
    if (memoryUsage > 70) {
      recommendations.push({
        type: 'warning',
        message: 'High memory usage detected. Clearing cache may help.',
        action: () => this.cleanupMemory()
      });
    }
    
    if (fps < 30) {
      recommendations.push({
        type: 'warning',
        message: 'Low frame rate detected. Reducing animations may help.',
        action: () => this.setPerformanceMode('power_save')
      });
    }
    
    if (cpuUsage > 70) {
      recommendations.push({
        type: 'warning',
        message: 'High CPU usage detected. Consider reducing update frequency.',
        action: () => this.setPerformanceMode('power_save')
      });
    }
    
    return recommendations;
  }

  // Destroy optimizer
  destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
    }
    if (window.mapUpdateInterval) {
      clearInterval(window.mapUpdateInterval);
    }
    if (window.dataPollingInterval) {
      clearInterval(window.dataPollingInterval);
    }
    
    this.eventListeners.clear();
  }
}

// Create singleton instance
const performanceOptimizer = new PerformanceOptimizer();

export default performanceOptimizer;

