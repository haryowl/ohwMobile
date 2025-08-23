// frontend/src/App.js

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DeviceList from './pages/DeviceList';
import DeviceDetail from './pages/DeviceDetail';
import Mapping from './pages/Mapping';
import Tracking from './pages/Tracking';
import Settings from './pages/Settings';
import Alerts from './pages/Alerts';
import DataTablePage from './pages/DataTable';
import DataExport from './pages/DataExport';
import PeerToPeer from './pages/PeerToPeer';
import DataSM from './pages/DataSM'; // NEW
import OfflineGridDemo from './components/OfflineGridDemo';
import ConnectionStatus from './components/ConnectionStatus';
import PerformanceDashboard from './components/PerformanceDashboard';
import offlineSyncService from './services/offlineSync';
import performanceOptimizer from './services/performanceOptimizer';
import imageOptimizer from './services/imageOptimizer';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(','),
  },
  components: {
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    // Performance optimizations for animations
    MuiButton: {
      styleOverrides: {
        root: {
          transition: 'var(--enable-animations, 1) all 0.2s ease',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          transition: 'var(--enable-animations, 1) all 0.2s ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          transition: 'var(--enable-animations, 1) all 0.2s ease',
        },
      },
    },
  },
  // CSS custom properties for performance control
  cssVarPrefix: 'galileosky',
});

function App() {
  useEffect(() => {
    // Initialize all optimization services
    const initOptimizations = async () => {
      try {
        console.log('Initializing performance optimizations...');
        
        // Request notification permission for performance alerts
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }

        // Initialize offline sync service
        console.log('Initializing offline sync service...');
        await preCacheEssentialData();
        
        // Initialize performance optimizer
        console.log('Initializing performance optimizer...');
        window.performanceOptimizer = performanceOptimizer;
        
        // Initialize image optimizer
        console.log('Initializing image optimizer...');
        window.imageOptimizer = imageOptimizer;
        
        // Setup performance monitoring
        setupPerformanceMonitoring();
        
        // Optimize page images
        setTimeout(() => {
          imageOptimizer.optimizePageImages();
        }, 1000);
        
        console.log('All performance optimizations initialized');
        
      } catch (error) {
        console.error('Failed to initialize performance optimizations:', error);
      }
    };

    initOptimizations();
  }, []);

  // Pre-cache essential data for offline use
  const preCacheEssentialData = async () => {
    try {
      // Cache devices data
      try {
        const devicesResponse = await fetch('/api/devices');
        if (devicesResponse.ok && devicesResponse.headers.get('content-type')?.includes('application/json')) {
          const devicesData = await devicesResponse.json();
          await offlineSyncService.cacheApiData('/api/devices', devicesData);
        }
      } catch (error) {
        console.log('Devices endpoint not available, skipping...');
      }

      // Cache mobile status (only if endpoint exists)
      try {
        const statusResponse = await fetch('/api/mobile/status');
        if (statusResponse.ok && statusResponse.headers.get('content-type')?.includes('application/json')) {
          const statusData = await statusResponse.json();
          await offlineSyncService.cacheApiData('/api/mobile/status', statusData);
        }
      } catch (error) {
        console.log('Mobile status endpoint not available, skipping...');
      }

      // Cache settings (only if endpoint exists)
      try {
        const settingsResponse = await fetch('/api/settings');
        if (settingsResponse.ok && settingsResponse.headers.get('content-type')?.includes('application/json')) {
          const settingsData = await settingsResponse.json();
          await offlineSyncService.cacheApiData('/api/settings', settingsData);
        }
      } catch (error) {
        console.log('Settings endpoint not available, skipping...');
      }

      console.log('Essential data pre-cached for offline use');
    } catch (error) {
      console.log('Pre-caching failed (may be offline):', error.message);
    }
  };

  // Setup performance monitoring
  const setupPerformanceMonitoring = () => {
    // Monitor page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('Page hidden - reducing performance');
        performanceOptimizer.setPerformanceMode('power_save');
      } else {
        console.log('Page visible - restoring performance');
        performanceOptimizer.autoAdjustPerformanceMode();
      }
    });

    // Monitor network changes
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        const connection = navigator.connection;
        console.log('Network changed:', connection.effectiveType);
        
        // Adjust performance based on network
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          performanceOptimizer.setPerformanceMode('power_save');
        } else if (connection.effectiveType === '4g') {
          performanceOptimizer.autoAdjustPerformanceMode();
        }
      });
    }

    // Monitor battery changes
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        battery.addEventListener('levelchange', () => {
          console.log('Battery level changed:', Math.round(battery.level * 100) + '%');
          
          // Adjust performance based on battery
          if (battery.level < 0.2) {
            performanceOptimizer.setPerformanceMode('power_save');
          } else if (battery.level > 0.8) {
            performanceOptimizer.autoAdjustPerformanceMode();
          }
        });
      });
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memoryUsage = (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100;
        console.log('Memory usage:', Math.round(memoryUsage) + '%');
        
        if (memoryUsage > 80) {
          console.warn('High memory usage detected');
          performanceOptimizer.cleanupMemory();
        }
      }, 30000); // Check every 30 seconds
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/devices" element={<Layout><DeviceList /></Layout>} />
          <Route path="/devices/:id" element={<Layout><DeviceDetail /></Layout>} />
          <Route path="/mapping" element={<Layout><Mapping /></Layout>} />
          <Route path="/tracking" element={<Layout><Tracking /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="/alerts" element={<Layout><Alerts /></Layout>} />
          <Route path="/data" element={<Layout><DataTablePage /></Layout>} />
          <Route path="/export" element={<Layout><DataExport /></Layout>} />
          <Route path="/peer-sync" element={<Layout><PeerToPeer /></Layout>} />
        <Route path="/data-sm" element={<Layout><DataSM /></Layout>} /> {/* NEW */}
          <Route path="/demo" element={<Layout><OfflineGridDemo /></Layout>} />
          <Route path="/performance" element={<Layout><PerformanceDashboard /></Layout>} />
        </Routes>
        
        {/* Global Connection Status Component */}
        <ConnectionStatus 
          showDetails={true} 
          position="top-right" 
        />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
