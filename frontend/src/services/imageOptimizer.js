// Image Optimization Service for Mobile Performance
class ImageOptimizer {
  constructor() {
    this.imageCache = new Map();
    this.intersectionObserver = null;
    this.performanceMode = 'balanced';
    this.networkSpeed = '4g';
    this.devicePixelRatio = window.devicePixelRatio || 1;
    
    this.qualitySettings = {
      power_save: {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.6,
        format: 'webp',
        lazyLoadDistance: 100
      },
      balanced: {
        maxWidth: 1200,
        maxHeight: 900,
        quality: 0.8,
        format: 'webp',
        lazyLoadDistance: 200
      },
      performance: {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.9,
        format: 'webp',
        lazyLoadDistance: 300
      }
    };
    
    this.init();
  }

  init() {
    this.setupIntersectionObserver();
    this.detectNetworkSpeed();
    this.setupPerformanceMonitoring();
  }

  // Setup intersection observer for lazy loading
  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadImage(entry.target);
            }
          });
        },
        {
          rootMargin: `${this.getCurrentSettings().lazyLoadDistance}px`,
          threshold: 0.1
        }
      );
    }
  }

  // Detect network speed
  detectNetworkSpeed() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      this.networkSpeed = connection.effectiveType || '4g';
      
      // Listen for network changes
      connection.addEventListener('change', () => {
        this.networkSpeed = connection.effectiveType || '4g';
        this.adjustQualitySettings();
      });
    }
  }

  // Setup performance monitoring
  setupPerformanceMonitoring() {
    // Listen for performance mode changes
    if (window.performanceOptimizer) {
      window.performanceOptimizer.addEventListener('modeChanged', (data) => {
        this.performanceMode = data.mode;
        this.adjustQualitySettings();
      });
    }
  }

  // Get current quality settings
  getCurrentSettings() {
    const baseSettings = this.qualitySettings[this.performanceMode];
    
    // Adjust based on network speed
    if (this.networkSpeed === 'slow-2g' || this.networkSpeed === '2g') {
      return {
        ...baseSettings,
        quality: Math.min(baseSettings.quality, 0.5),
        maxWidth: Math.min(baseSettings.maxWidth, 600),
        maxHeight: Math.min(baseSettings.maxHeight, 400)
      };
    } else if (this.networkSpeed === '3g') {
      return {
        ...baseSettings,
        quality: Math.min(baseSettings.quality, 0.7),
        maxWidth: Math.min(baseSettings.maxWidth, 800),
        maxHeight: Math.min(baseSettings.maxHeight, 600)
      };
    }
    
    return baseSettings;
  }

  // Adjust quality settings based on current conditions
  adjustQualitySettings() {
    const settings = this.getCurrentSettings();
    
    // Update intersection observer root margin
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.setupIntersectionObserver();
    }
    
    console.log('Image quality settings adjusted:', settings);
  }

  // Optimize image URL
  optimizeImageUrl(originalUrl, options = {}) {
    if (!originalUrl) return originalUrl;
    
    const settings = this.getCurrentSettings();
    const { width, height, quality, format } = { ...settings, ...options };
    
    // Check if URL is already optimized
    if (originalUrl.includes('optimized=true')) {
      return originalUrl;
    }
    
    // For external images, try to use image optimization services
    if (originalUrl.startsWith('http')) {
      return this.optimizeExternalImage(originalUrl, { width, height, quality, format });
    }
    
    return originalUrl;
  }

  // Optimize external image using optimization services
  optimizeExternalImage(url, options) {
    const { width, height, quality, format } = options;
    
    // Try different optimization services
    const optimizers = [
      // Cloudinary
      (url, opts) => {
        if (url.includes('cloudinary.com')) {
          const baseUrl = url.split('/upload/')[0] + '/upload/';
          const path = url.split('/upload/')[1];
          return `${baseUrl}w_${opts.width},h_${opts.height},q_${opts.quality},f_${opts.format}/${path}`;
        }
        return null;
      },
      
      // ImageKit
      (url, opts) => {
        if (url.includes('imagekit.io')) {
          return `${url}?tr=w-${opts.width},h-${opts.height},q-${opts.quality},f-${opts.format}`;
        }
        return null;
      },
      
      // Generic optimization
      (url, opts) => {
        const params = new URLSearchParams();
        params.append('w', opts.width);
        params.append('h', opts.height);
        params.append('q', opts.quality);
        params.append('f', opts.format);
        params.append('optimized', 'true');
        return `${url}?${params.toString()}`;
      }
    ];
    
    for (const optimizer of optimizers) {
      const optimizedUrl = optimizer(url, options);
      if (optimizedUrl) {
        return optimizedUrl;
      }
    }
    
    return url;
  }

  // Load image with optimization
  async loadImage(imgElement) {
    if (!imgElement || imgElement.dataset.loaded === 'true') {
      return;
    }
    
    const originalSrc = imgElement.dataset.src || imgElement.src;
    if (!originalSrc) return;
    
    try {
      // Check cache first
      if (this.imageCache.has(originalSrc)) {
        const cachedData = this.imageCache.get(originalSrc);
        this.setImageSource(imgElement, cachedData.url);
        return;
      }
      
      // Optimize URL
      const optimizedUrl = this.optimizeImageUrl(originalSrc);
      
      // Load image
      const imageData = await this.fetchImage(optimizedUrl);
      
      // Cache the result
      this.imageCache.set(originalSrc, {
        url: optimizedUrl,
        data: imageData,
        timestamp: Date.now()
      });
      
      // Set image source
      this.setImageSource(imgElement, optimizedUrl);
      
      // Clean up old cache entries
      this.cleanupCache();
      
    } catch (error) {
      console.error('Error loading image:', error);
      // Fallback to original URL
      this.setImageSource(imgElement, originalSrc);
    }
  }

  // Fetch image with timeout and retry
  async fetchImage(url, retries = 2) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'force-cache'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.blob();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (retries > 0 && error.name !== 'AbortError') {
        // Retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries)));
        return this.fetchImage(url, retries - 1);
      }
      
      throw error;
    }
  }

  // Set image source with loading states
  setImageSource(imgElement, src) {
    // Add loading class
    imgElement.classList.add('image-loading');
    
    // Create new image to preload
    const tempImage = new Image();
    
    tempImage.onload = () => {
      imgElement.src = src;
      imgElement.classList.remove('image-loading');
      imgElement.classList.add('image-loaded');
      imgElement.dataset.loaded = 'true';
      
      // Remove from intersection observer
      if (this.intersectionObserver) {
        this.intersectionObserver.unobserve(imgElement);
      }
    };
    
    tempImage.onerror = () => {
      imgElement.classList.remove('image-loading');
      imgElement.classList.add('image-error');
      console.error('Failed to load image:', src);
    };
    
    tempImage.src = src;
  }

  // Setup lazy loading for image
  setupLazyLoading(imgElement) {
    if (!imgElement || !this.intersectionObserver) {
      return;
    }
    
    // Store original src in data attribute
    if (imgElement.src && !imgElement.dataset.src) {
      imgElement.dataset.src = imgElement.src;
      imgElement.src = this.getPlaceholderUrl();
    }
    
    // Add loading styles
    imgElement.classList.add('lazy-image');
    
    // Observe the image
    this.intersectionObserver.observe(imgElement);
  }

  // Get placeholder URL
  getPlaceholderUrl() {
    const settings = this.getCurrentSettings();
    const width = Math.min(settings.maxWidth, 100);
    const height = Math.min(settings.maxHeight, 100);
    
    // Use a lightweight placeholder service
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3ELoading...%3C/text%3E%3C/svg%3E`;
  }

  // Clean up cache
  cleanupCache() {
    const maxCacheSize = 50; // Maximum number of cached images
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    if (this.imageCache.size > maxCacheSize) {
      // Remove oldest entries
      const entries = Array.from(this.imageCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.imageCache.size - maxCacheSize);
      toRemove.forEach(([key]) => {
        this.imageCache.delete(key);
      });
    }
    
    // Remove expired entries
    const now = Date.now();
    for (const [key, value] of this.imageCache.entries()) {
      if (now - value.timestamp > maxAge) {
        this.imageCache.delete(key);
      }
    }
  }

  // Preload critical images
  preloadImages(urls) {
    urls.forEach(url => {
      const optimizedUrl = this.optimizeImageUrl(url);
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = optimizedUrl;
      document.head.appendChild(link);
    });
  }

  // Optimize all images on page
  optimizePageImages() {
    const images = document.querySelectorAll('img:not([data-optimized])');
    
    images.forEach(img => {
      img.dataset.optimized = 'true';
      
      // Setup lazy loading for non-critical images
      if (!img.dataset.critical) {
        this.setupLazyLoading(img);
      } else {
        // Load critical images immediately
        this.loadImage(img);
      }
    });
  }

  // Get image dimensions
  getImageDimensions(imgElement) {
    return new Promise((resolve) => {
      if (imgElement.complete) {
        resolve({
          width: imgElement.naturalWidth,
          height: imgElement.naturalHeight
        });
      } else {
        imgElement.onload = () => {
          resolve({
            width: imgElement.naturalWidth,
            height: imgElement.naturalHeight
          });
        };
      }
    });
  }

  // Resize image using canvas
  resizeImage(file, options = {}) {
    return new Promise((resolve) => {
      const settings = this.getCurrentSettings();
      const { maxWidth, maxHeight, quality, format } = { ...settings, ...options };
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(resolve, `image/${format}`, quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  // Get cache statistics
  getCacheStats() {
    const totalSize = this.imageCache.size;
    const totalMemory = Array.from(this.imageCache.values())
      .reduce((sum, item) => sum + (item.data ? item.data.size : 0), 0);
    
    return {
      totalImages: totalSize,
      totalMemory: totalMemory,
      averageMemory: totalSize > 0 ? totalMemory / totalSize : 0
    };
  }

  // Clear cache
  clearCache() {
    this.imageCache.clear();
    console.log('Image cache cleared');
  }

  // Destroy optimizer
  destroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    this.imageCache.clear();
  }
}

// Create singleton instance
const imageOptimizer = new ImageOptimizer();

export default imageOptimizer;

