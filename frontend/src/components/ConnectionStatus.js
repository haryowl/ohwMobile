import React, { useState, useEffect } from 'react';
import {
  Chip,
  Box,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Wifi,
  WifiOff,
  CloudSync,
  CloudOff,
  Refresh,
  Download,
  Upload,
  Settings,
  Info
} from '@mui/icons-material';
import apiService from '../services/api';
import offlineSyncService from '../services/offlineSync';

const ConnectionStatus = ({ showDetails = true, position = 'top-right' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [showSyncNotification, setShowSyncNotification] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const displaySyncNotification = (message) => {
    setSyncMessage(message);
    setShowSyncNotification(true);
  };

  useEffect(() => {
    // Initial status check
    updateStatus();

    // Listen for connection status changes
    const handleConnectionChange = (event) => {
      const { isOnline } = event.detail;
      setIsOnline(isOnline);
      updateStatus();
    };

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      updateStatus();
      displaySyncNotification('Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateStatus();
      displaySyncNotification('Connection lost - working offline');
    };

    window.addEventListener('connectionStatusChanged', handleConnectionChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic status update
    const interval = setInterval(updateStatus, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('connectionStatusChanged', handleConnectionChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const updateStatus = () => {
    const status = apiService.getSyncStatus();
    setSyncStatus(status);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleForceSync = async () => {
    try {
      await apiService.forceSync();
      displaySyncNotification('Sync completed');
      updateStatus();
    } catch (error) {
      displaySyncNotification('Sync failed: ' + error.message);
    }
    handleMenuClose();
  };

  const handleClearPendingSync = async () => {
    try {
      await apiService.clearPendingSync();
      displaySyncNotification('Pending sync cleared');
      updateStatus();
    } catch (error) {
      displaySyncNotification('Failed to clear pending sync');
    }
    handleMenuClose();
  };

  const handleExportOfflineData = () => {
    try {
      const data = apiService.exportOfflineData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `galileosky-offline-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      displaySyncNotification('Offline data exported');
    } catch (error) {
      displaySyncNotification('Failed to export offline data');
    }
    handleMenuClose();
  };

  const getStatusDisplay = () => {
    if (isOnline) {
      return {
        icon: <Wifi />,
        label: 'Online',
        color: 'success',
        bgColor: '#d4edda',
        textColor: '#155724',
        tooltip: 'Connected to server'
      };
    } else {
      return {
        icon: <WifiOff />,
        label: 'Offline',
        color: 'error',
        bgColor: '#f8d7da',
        textColor: '#721c24',
        tooltip: 'Working offline - data will sync when connected'
      };
    }
  };

  const statusDisplay = getStatusDisplay();

  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return { top: 10, left: 10 };
      case 'top-right':
        return { top: 10, right: 10 };
      case 'bottom-left':
        return { bottom: 10, left: 10 };
      case 'bottom-right':
        return { bottom: 10, right: 10 };
      default:
        return { top: 10, right: 10 };
    }
  };

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          ...getPositionStyles(),
          zIndex: 2000,
          display: 'flex',
          gap: 1,
          alignItems: 'center'
        }}
      >
        {/* Main Status Chip */}
        <Tooltip title={statusDisplay.tooltip}>
          <Chip
            icon={statusDisplay.icon}
            label={statusDisplay.label}
            color={statusDisplay.color}
            size="small"
            onClick={showDetails ? handleMenuOpen : undefined}
            sx={{
              backgroundColor: statusDisplay.bgColor,
              color: statusDisplay.textColor,
              fontWeight: 'bold',
              cursor: showDetails ? 'pointer' : 'default',
              '& .MuiChip-icon': {
                color: statusDisplay.textColor
              }
            }}
          />
        </Tooltip>

        {/* Sync Status Indicator */}
        {syncStatus.pendingSyncCount > 0 && (
          <Tooltip title={`${syncStatus.pendingSyncCount} items pending sync`}>
            <Chip
              icon={<CloudSync />}
              label={syncStatus.pendingSyncCount}
              color="warning"
              size="small"
              sx={{
                backgroundColor: '#fff3cd',
                color: '#856404',
                fontWeight: 'bold',
                minWidth: '32px'
              }}
            />
          </Tooltip>
        )}

        {/* Sync in Progress Indicator */}
        {syncStatus.syncInProgress && (
          <Tooltip title="Sync in progress">
            <Chip
              icon={<Refresh />}
              label="Syncing"
              color="info"
              size="small"
              sx={{
                backgroundColor: '#d1ecf1',
                color: '#0c5460',
                fontWeight: 'bold'
              }}
            />
          </Tooltip>
        )}
      </Box>

      {/* Status Menu */}
      {showDetails && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              minWidth: 250,
              mt: 1
            }
          }}
        >
          <MenuItem disabled>
            <ListItemIcon>
              <Info fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Connection Status"
              secondary={isOnline ? 'Connected to server' : 'Working offline'}
            />
          </MenuItem>

          <Divider />

          <MenuItem disabled>
            <ListItemText
              primary={`Pending Sync: ${syncStatus.pendingSyncCount || 0} items`}
              secondary={syncStatus.lastSyncTime ? 
                `Last sync: ${new Date(syncStatus.lastSyncTime).toLocaleString()}` : 
                'No sync data available'
              }
            />
          </MenuItem>

          <Divider />

          <MenuItem onClick={handleForceSync} disabled={!isOnline || syncStatus.syncInProgress}>
            <ListItemIcon>
              <CloudSync fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Force Sync"
              secondary="Sync pending data now"
            />
          </MenuItem>

          <MenuItem onClick={handleClearPendingSync} disabled={syncStatus.pendingSyncCount === 0}>
            <ListItemIcon>
              <CloudOff fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Clear Pending Sync"
              secondary="Remove all pending sync items"
            />
          </MenuItem>

          <MenuItem onClick={handleExportOfflineData}>
            <ListItemIcon>
              <Download fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Export Offline Data"
              secondary="Download cached data"
            />
          </MenuItem>

          <Divider />

          <MenuItem disabled>
            <ListItemText
              primary="Sync Status"
              secondary={
                <Typography variant="caption" component="div">
                  {syncStatus.syncInProgress ? 'Sync in progress...' : 'Ready'}
                </Typography>
              }
            />
          </MenuItem>
        </Menu>
      )}

      {/* Sync Notification */}
      <Snackbar
        open={showSyncNotification}
        autoHideDuration={4000}
        onClose={() => setShowSyncNotification(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSyncNotification(false)} 
          severity={isOnline ? 'success' : 'warning'}
          sx={{ width: '100%' }}
        >
          {syncMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ConnectionStatus;

