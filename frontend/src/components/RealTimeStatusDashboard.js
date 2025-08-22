import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Button,
  Divider
} from '@mui/material';
import {
  SignalCellular4Bar as OnlineIcon,
  SignalCellular0Bar as OfflineIcon,
  SignalCellular2Bar as InactiveIcon,
  Warning as WarningIcon,
  CheckCircle as HealthyIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Speed as SpeedIcon,
  BatteryFull as BatteryIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import apiService from '../services/api';

const RealTimeStatusDashboard = () => {
  const [devices, setDevices] = useState([]);
  const [systemStatus, setSystemStatus] = useState({});
  const [expandedDevices, setExpandedDevices] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      
      // Load devices
      const devicesData = await apiService.getDevices();
      setDevices(devicesData);
      
      // Load system status
      const statusData = await apiService.getMobileStatus();
      setSystemStatus(statusData);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load status:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDeviceExpansion = (deviceId) => {
    const newExpanded = new Set(expandedDevices);
    if (newExpanded.has(deviceId)) {
      newExpanded.delete(deviceId);
    } else {
      newExpanded.add(deviceId);
    }
    setExpandedDevices(newExpanded);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <OnlineIcon color="success" />;
      case 'inactive': return <InactiveIcon color="warning" />;
      case 'offline': return <OfflineIcon color="error" />;
      default: return <WarningIcon color="warning" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'offline': return 'error';
      default: return 'default';
    }
  };

  const getHealthScore = (device) => {
    let score = 0;
    let total = 0;
    
    // Connection status
    total++;
    if (device.status === 'active') score++;
    
    // Recent activity
    total++;
    if (device.lastSeen) {
      const timeSinceLastSeen = Date.now() - new Date(device.lastSeen).getTime();
      if (timeSinceLastSeen < 5 * 60 * 1000) score++; // Less than 5 minutes
    }
    
    // Data quality
    total++;
    if (device.recordCount > 0) score++;
    
    return Math.round((score / total) * 100);
  };

  const getSystemHealthScore = () => {
    let score = 0;
    let total = 0;
    
    // Battery level
    total++;
    if (systemStatus.battery && systemStatus.battery.level > 0.2) score++;
    
    // Storage
    total++;
    if (systemStatus.storage && systemStatus.storage.available > 100) score++; // More than 100MB
    
    // Memory
    total++;
    if (systemStatus.memory && systemStatus.memory.usage < 80) score++; // Less than 80% usage
    
    // Network
    total++;
    if (systemStatus.network && systemStatus.network.connected) score++;
    
    return Math.round((score / total) * 100);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Never';
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const stats = {
    total: devices.length,
    active: devices.filter(d => d.status === 'active').length,
    inactive: devices.filter(d => d.status === 'inactive').length,
    offline: devices.filter(d => d.status === 'offline').length,
    healthy: devices.filter(d => getHealthScore(d) > 80).length,
    warning: devices.filter(d => getHealthScore(d) <= 80 && getHealthScore(d) > 50).length,
    critical: devices.filter(d => getHealthScore(d) <= 50).length
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Real-time Status Dashboard
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="caption" color="textSecondary">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={loadStatus} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* System Health Overview */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Box flex={1}>
                  <LinearProgress
                    variant="determinate"
                    value={getSystemHealthScore()}
                    color={getSystemHealthScore() > 80 ? 'success' : getSystemHealthScore() > 50 ? 'warning' : 'error'}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Typography variant="h6">
                  {getSystemHealthScore()}%
                </Typography>
              </Box>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <BatteryIcon color={systemStatus.battery?.level > 0.2 ? 'success' : 'error'} />
                    <Typography variant="body2">
                      Battery: {systemStatus.battery ? Math.round(systemStatus.battery.level * 100) + '%' : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <StorageIcon color={systemStatus.storage?.available > 100 ? 'success' : 'warning'} />
                    <Typography variant="body2">
                      Storage: {systemStatus.storage ? formatBytes(systemStatus.storage.available) : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <MemoryIcon color={systemStatus.memory?.usage < 80 ? 'success' : 'warning'} />
                    <Typography variant="body2">
                      Memory: {systemStatus.memory ? Math.round(systemStatus.memory.usage) + '%' : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <NetworkIcon color={systemStatus.network?.connected ? 'success' : 'error'} />
                    <Typography variant="body2">
                      Network: {systemStatus.network?.connected ? 'Connected' : 'Disconnected'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Device Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">
                      {stats.active}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Active
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main">
                      {stats.inactive}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Inactive
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="error.main">
                      {stats.offline}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Offline
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary.main">
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              <Box mt={2}>
                <Typography variant="body2" color="textSecondary">
                  Health: {stats.healthy} healthy, {stats.warning} warning, {stats.critical} critical
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Device Status List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Device Status
          </Typography>
          
          {loading ? (
            <Box textAlign="center" py={4}>
              <LinearProgress />
              <Typography variant="body2" color="textSecondary" mt={1}>
                Loading device status...
              </Typography>
            </Box>
          ) : devices.length === 0 ? (
            <Alert severity="info">No devices found</Alert>
          ) : (
            <List>
              {devices.map((device, index) => {
                const healthScore = getHealthScore(device);
                const isExpanded = expandedDevices.has(device.id);
                
                return (
                  <React.Fragment key={device.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getStatusIcon(device.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1" fontWeight="medium">
                              {device.name}
                            </Typography>
                            <Chip
                              label={device.status}
                              color={getStatusColor(device.status)}
                              size="small"
                            />
                            <Chip
                              label={`${healthScore}%`}
                              color={healthScore > 80 ? 'success' : healthScore > 50 ? 'warning' : 'error'}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              IMEI: {device.imei}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Last seen: {formatTimeAgo(device.lastSeen)}
                            </Typography>
                          </Box>
                        }
                      />
                      <IconButton onClick={() => toggleDeviceExpansion(device.id)}>
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </ListItem>
                    
                    <Collapse in={isExpanded}>
                      <Box p={2} bgcolor="grey.50">
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              Device Information
                            </Typography>
                            <List dense>
                              <ListItem>
                                <ListItemText
                                  primary="Group"
                                  secondary={device.group || 'No group assigned'}
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemText
                                  primary="Description"
                                  secondary={device.description || 'No description'}
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemText
                                  primary="Hardware Version"
                                  secondary={device.hardwareVersion || 'Unknown'}
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemText
                                  primary="Firmware Version"
                                  secondary={device.firmwareVersion || 'Unknown'}
                                />
                              </ListItem>
                            </List>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              Health Metrics
                            </Typography>
                            <List dense>
                              <ListItem>
                                <ListItemText
                                  primary="Connection Status"
                                  secondary={
                                    <Chip
                                      label={device.status}
                                      color={getStatusColor(device.status)}
                                      size="small"
                                    />
                                  }
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemText
                                  primary="Last Activity"
                                  secondary={formatTimeAgo(device.lastSeen)}
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemText
                                  primary="Data Records"
                                  secondary={device.recordCount || 0}
                                />
                              </ListItem>
                              <ListItem>
                                <ListItemText
                                  primary="Health Score"
                                  secondary={
                                    <Box display="flex" alignItems="center" gap={1}>
                                      <LinearProgress
                                        variant="determinate"
                                        value={healthScore}
                                        color={healthScore > 80 ? 'success' : healthScore > 50 ? 'warning' : 'error'}
                                        sx={{ width: 60, height: 6 }}
                                      />
                                      <Typography variant="body2">
                                        {healthScore}%
                                      </Typography>
                                    </Box>
                                  }
                                />
                              </ListItem>
                            </List>
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                    
                    {index < devices.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RealTimeStatusDashboard;

