import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import OfflineMapLayer from './OfflineMapLayer';
import { Alert, Snackbar, Chip, Box } from '@mui/material';
import { WifiOff, Wifi, CloudOff, CloudDone } from '@mui/icons-material';

const SmartMap = ({ 
  center = [0, 0], 
  zoom = 2, 
  children, 
  height = '400px',
  width = '100%',
  style = {},
  showOfflineIndicator = true
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mapTilesLoaded, setMapTilesLoaded] = useState(false);
  const [showOfflineMode, setShowOfflineMode] = useState(false);
  const [offlineData, setOfflineData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [lastOnlineCheck, setLastOnlineCheck] = useState(null);

  // Enhanced offline detection
  const checkOnlineStatus = useCallback(async () => {
    try {
      // Check multiple indicators for online status
      const networkOnline = navigator.onLine;
      const mapTilesAvailable = await checkMapTilesAvailability();
      const apiAvailable = await checkApiAvailability();
      
      const isFullyOnline = networkOnline && mapTilesAvailable && apiAvailable;
      
      setIsOnline(isFullyOnline);
      setMapTilesLoaded(mapTilesAvailable);
      setShowOfflineMode(!isFullyOnline);
      setConnectionStatus(isFullyOnline ? 'online' : 'offline');
      setLastOnlineCheck(new Date());
      
      console.log('Connection status:', {
        networkOnline,
        mapTilesAvailable,
        apiAvailable,
        isFullyOnline
      });
      
      return isFullyOnline;
    } catch (error) {
      console.error('Error checking online status:', error);
      setIsOnline(false);
      setShowOfflineMode(true);
      setConnectionStatus('offline');
      return false;
    }
  }, []);

  // Check if map tiles are available
  const checkMapTilesAvailability = async () => {
    try {
      const testUrl = 'https://tile.openstreetmap.org/0/0/0.png';
      const response = await fetch(testUrl, { 
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.log('Map tiles not available:', error.message);
      return false;
    }
  };

  // Check if API is available
  const checkApiAvailability = async () => {
    try {
      const response = await fetch('/api/mobile/status', { 
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });
      return response.ok;
    } catch (error) {
      console.log('API not available:', error.message);
      return false;
    }
  };

  // Load offline data
  const loadOfflineData = useCallback(async () => {
    try {
      // Try to get offline data from service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        
        messageChannel.port1.onmessage = function(event) {
          if (event.data && event.data.data) {
            setOfflineData(event.data.data);
          }
        };

        navigator.serviceWorker.controller.postMessage({
          type: 'GET_OFFLINE_DATA',
          endpoint: '/api/devices'
        }, [messageChannel.port2]);
      }

      // Also check localStorage for cached data
      const cachedData = localStorage.getItem('galileosky-offline-data');
      if (cachedData) {
        const data = JSON.parse(cachedData);
        setOfflineData(data);
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network connection restored');
      checkOnlineStatus();
    };

    const handleOffline = () => {
      console.log('Network connection lost');
      setIsOnline(false);
      setShowOfflineMode(true);
      setConnectionStatus('offline');
    };

    // Initial check
    checkOnlineStatus();
    loadOfflineData();

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for connection status changes from offline sync service
    const handleConnectionStatusChange = (event) => {
      const { isOnline } = event.detail;
      setIsOnline(isOnline);
      setShowOfflineMode(!isOnline);
      setConnectionStatus(isOnline ? 'online' : 'offline');
    };
    
    window.addEventListener('connectionStatusChanged', handleConnectionStatusChange);

    // Periodic connection check
    const checkInterval = setInterval(() => {
      checkOnlineStatus();
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('connectionStatusChanged', handleConnectionStatusChange);
      clearInterval(checkInterval);
    };
  }, [checkOnlineStatus, loadOfflineData]);

  // Determine if we should show offline mode
  const shouldShowOffline = !isOnline || !mapTilesLoaded || showOfflineMode;

  // Get connection status display
  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'online':
        return {
          icon: <Wifi />,
          label: 'Online',
          color: 'success',
          bgColor: '#d4edda',
          textColor: '#155724'
        };
      case 'offline':
        return {
          icon: <WifiOff />,
          label: 'Offline',
          color: 'error',
          bgColor: '#f8d7da',
          textColor: '#721c24'
        };
      case 'checking':
        return {
          icon: <CloudOff />,
          label: 'Checking...',
          color: 'warning',
          bgColor: '#fff3cd',
          textColor: '#856404'
        };
      default:
        return {
          icon: <CloudOff />,
          label: 'Unknown',
          color: 'default',
          bgColor: '#f8f9fa',
          textColor: '#6c757d'
        };
    }
  };

  const statusDisplay = getConnectionStatusDisplay();

  return (
    <div style={{ position: 'relative', height, width, ...style }}>
      {/* Connection Status Indicator */}
      {showOfflineIndicator && (
        <Box
          sx={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 2000,
            display: 'flex',
            gap: 1,
            alignItems: 'center'
          }}
        >
          <Chip
            icon={statusDisplay.icon}
            label={statusDisplay.label}
            color={statusDisplay.color}
            size="small"
            sx={{
              backgroundColor: statusDisplay.bgColor,
              color: statusDisplay.textColor,
              fontWeight: 'bold',
              '& .MuiChip-icon': {
                color: statusDisplay.textColor
              }
            }}
          />
          
          {shouldShowOffline && (
            <Chip
              icon={<CloudOff />}
              label="Offline Mode"
              color="warning"
              size="small"
              sx={{
                backgroundColor: '#fff3cd',
                color: '#856404',
                fontWeight: 'bold'
              }}
            />
          )}
        </Box>
      )}

      {/* Offline Data Indicator */}
      {shouldShowOffline && offlineData && (
        <Box
          sx={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 2000
          }}
        >
          <Chip
            icon={<CloudDone />}
            label={`${offlineData.devices?.length || 0} devices cached`}
            color="info"
            size="small"
            sx={{
              backgroundColor: '#d1ecf1',
              color: '#0c5460',
              fontWeight: 'bold'
            }}
          />
        </Box>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        {shouldShowOffline ? (
          <OfflineMapLayer 
            offlineData={offlineData}
            showOfflineIndicator={false} // We handle this above
          />
        ) : (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            eventHandlers={{
              load: () => {
                setMapTilesLoaded(true);
                setShowOfflineMode(false);
              },
              error: () => {
                setMapTilesLoaded(false);
                setShowOfflineMode(true);
              }
            }}
          />
        )}
        
        {/* Render children (markers, polylines, etc.) with higher z-index */}
        <div style={{ position: 'relative', zIndex: 1000 }}>
          {children}
        </div>
      </MapContainer>
      
      {/* Offline Mode Snackbar */}
      <Snackbar
        open={shouldShowOffline && showOfflineIndicator}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ zIndex: 3000 }}
      >
        <Alert 
          severity="warning" 
          icon={<WifiOff />}
          sx={{ width: '100%' }}
        >
          Working in offline mode. Some features may be limited.
          {offlineData && ` ${offlineData.devices?.length || 0} devices available from cache.`}
        </Alert>
      </Snackbar>

      {/* Connection Status Snackbar */}
      {connectionStatus === 'checking' && (
        <Snackbar
          open={true}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ zIndex: 3000 }}
        >
          <Alert 
            severity="info" 
            icon={<CloudOff />}
            sx={{ width: '100%' }}
          >
            Checking connection status...
          </Alert>
        </Snackbar>
      )}
    </div>
  );
};

export default SmartMap; 