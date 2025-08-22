import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Switch,
  FormControlLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Sync,
  Add,
  Delete,
  Refresh,
  Settings,
  ContentCopy,
  CheckCircle,
  Error,
  Warning,
  Info,
  PlayArrow,
  Stop,
  CloudSync,
  DeviceHub
} from '@mui/icons-material';
import apiService from '../services/api';

const PeerToPeer = () => {
  const [serverStatus, setServerStatus] = useState('stopped');
  const [serverIP, setServerIP] = useState('');
  const [peers, setPeers] = useState([]);
  const [newPeerUrl, setNewPeerUrl] = useState('');
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [deviceData, setDeviceData] = useState({});
  const [showAddPeerDialog, setShowAddPeerDialog] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [activityLog, setActivityLog] = useState([]);

  useEffect(() => {
    initializePeerSync();
  }, []);

  const initializePeerSync = async () => {
    try {
      await refreshServerStatus();
      await loadPeers();
      await refreshDeviceData();
      addLog('info', 'Peer-to-Peer sync initialized');
    } catch (error) {
      addLog('error', 'Failed to initialize peer sync: ' + error.message);
    }
  };

  const refreshServerStatus = async () => {
    try {
      const response = await apiService.get('/api/peer/status');
      setServerStatus(response.status);
      setServerIP(response.serverIP || 'Unknown');
    } catch (error) {
      setServerStatus('error');
    }
  };

  const loadPeers = async () => {
    try {
      const response = await apiService.get('/api/peer/list');
      setPeers(response.peers || []);
    } catch (error) {
      console.error('Failed to load peers:', error);
    }
  };

  const refreshDeviceData = async () => {
    try {
      const response = await apiService.get('/api/peer/device-data');
      setDeviceData(response);
    } catch (error) {
      console.error('Failed to get device data:', error);
    }
  };

  const startServer = async () => {
    try {
      await apiService.post('/api/peer/start-server');
      addLog('success', 'Peer server started');
      await refreshServerStatus();
    } catch (error) {
      addLog('error', 'Failed to start server: ' + error.message);
    }
  };

  const stopServer = async () => {
    try {
      await apiService.post('/api/peer/stop-server');
      addLog('info', 'Peer server stopped');
      await refreshServerStatus();
    } catch (error) {
      addLog('error', 'Failed to stop server: ' + error.message);
    }
  };

  const addPeer = async () => {
    if (!newPeerUrl.trim()) {
      addLog('warning', 'Please enter a peer URL');
      return;
    }

    try {
      await apiService.post('/api/peer/add', { peerUrl: newPeerUrl.trim() });
      addLog('success', `Peer added: ${newPeerUrl}`);
      setNewPeerUrl('');
      setShowAddPeerDialog(false);
      await loadPeers();
    } catch (error) {
      addLog('error', 'Failed to add peer: ' + error.message);
    }
  };

  const removePeer = async (peerId) => {
    try {
      await apiService.delete(`/api/peer/remove/${peerId}`);
      addLog('info', 'Peer removed');
      await loadPeers();
    } catch (error) {
      addLog('error', 'Failed to remove peer: ' + error.message);
    }
  };

  const syncWithPeer = async (peerId) => {
    if (syncInProgress) return;

    setSyncInProgress(true);
    setSyncProgress(0);

    try {
      addLog('info', 'Starting peer sync...');
      const response = await apiService.post(`/api/peer/sync/${peerId}`);
      
      if (response.success) {
        addLog('success', `Sync completed: ${response.newRecords} new records`);
      } else {
        addLog('error', 'Sync failed: ' + response.error);
      }
      
      await refreshDeviceData();
    } catch (error) {
      addLog('error', 'Sync error: ' + error.message);
    } finally {
      setSyncInProgress(false);
      setSyncProgress(0);
    }
  };

  const syncWithAllPeers = async () => {
    if (syncInProgress) return;

    const onlinePeers = peers.filter(peer => peer.status === 'online');
    if (onlinePeers.length === 0) {
      addLog('warning', 'No online peers available');
      return;
    }

    setSyncInProgress(true);
    setSyncProgress(0);

    try {
      addLog('info', `Starting sync with ${onlinePeers.length} peers...`);
      
      for (let i = 0; i < onlinePeers.length; i++) {
        const peer = onlinePeers[i];
        const progress = ((i + 1) / onlinePeers.length) * 100;
        setSyncProgress(progress);
        
        try {
          const response = await apiService.post(`/api/peer/sync/${peer.id}`);
          if (response.success) {
            addLog('success', `Sync with ${peer.name}: ${response.newRecords} new records`);
          } else {
            addLog('error', `Sync with ${peer.name} failed: ${response.error}`);
          }
        } catch (error) {
          addLog('error', `Sync with ${peer.name} error: ${error.message}`);
        }
      }

      await refreshDeviceData();
    } catch (error) {
      addLog('error', 'Bulk sync error: ' + error.message);
    } finally {
      setSyncInProgress(false);
      setSyncProgress(0);
    }
  };

  const addLog = (type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, type, message };
    setActivityLog(prev => [logEntry, ...prev.slice(0, 99)]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'error';
      case 'syncing': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return <CheckCircle />;
      case 'offline': return <Error />;
      case 'syncing': return <Sync />;
      default: return <Info />;
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" component="h1">
          Peer-to-Peer Sync
        </Typography>
        <Chip
          icon={<DeviceHub />}
          label={`${peers.filter(p => p.status === 'online').length}/${peers.length} peers online`}
          color="primary"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Server Status Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">🖥️ Server Status</Typography>
                <IconButton onClick={refreshServerStatus} size="small">
                  <Refresh />
                </IconButton>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Status</Typography>
                  <Chip
                    label={serverStatus}
                    color={serverStatus === 'running' ? 'success' : 'default'}
                    size="small"
                    icon={serverStatus === 'running' ? <CheckCircle /> : <Error />}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Server IP</Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    {serverIP}
                  </Typography>
                </Grid>
              </Grid>

              <Box mt={2} display="flex" gap={1}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayArrow />}
                  onClick={startServer}
                  disabled={serverStatus === 'running'}
                  size="small"
                >
                  Start Server
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Stop />}
                  onClick={stopServer}
                  disabled={serverStatus !== 'running'}
                  size="small"
                >
                  Stop Server
                </Button>
              </Box>

              {serverStatus === 'running' && (
                <Box mt={2}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Connection URL
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" fontFamily="monospace" sx={{ flex: 1 }}>
                      http://{serverIP}:3001/peer/sync
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => navigator.clipboard.writeText(`http://${serverIP}:3001/peer/sync`)}
                    >
                      <ContentCopy />
                    </IconButton>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Device Data Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>📊 Device Data</Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">Total Records</Typography>
                  <Typography variant="h6">{deviceData.totalRecords || 0}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">Active Devices</Typography>
                  <Typography variant="h6">{deviceData.activeDevices || 0}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">Last Update</Typography>
                  <Typography variant="body2">
                    {deviceData.lastUpdate ? new Date(deviceData.lastUpdate).toLocaleTimeString() : 'Never'}
                  </Typography>
                </Grid>
              </Grid>
              <Box mt={2}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={refreshDeviceData}
                  size="small"
                >
                  Refresh Data
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Peers Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">🔗 Connected Peers</Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowAddPeerDialog(true)}
                  size="small"
                >
                  Add Peer
                </Button>
              </Box>

              {peers.length === 0 ? (
                <Alert severity="info">
                  No peers configured. Add a peer to start syncing data.
                </Alert>
              ) : (
                <>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>URL</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Last Sync</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {peers.map((peer) => (
                          <TableRow key={peer.id}>
                            <TableCell>{peer.name}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontFamily="monospace" fontSize="0.8em">
                                {peer.url}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={peer.status}
                                color={getStatusColor(peer.status)}
                                size="small"
                                icon={getStatusIcon(peer.status)}
                              />
                            </TableCell>
                            <TableCell>
                              {peer.lastSync ? new Date(peer.lastSync).toLocaleTimeString() : 'Never'}
                            </TableCell>
                            <TableCell>
                              <Box display="flex" gap={0.5}>
                                <IconButton
                                  size="small"
                                  onClick={() => syncWithPeer(peer.id)}
                                  disabled={syncInProgress || peer.status !== 'online'}
                                >
                                  <Sync />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => removePeer(peer.id)}
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box mt={2}>
                    <Button
                      variant="contained"
                      startIcon={<CloudSync />}
                      onClick={syncWithAllPeers}
                      disabled={syncInProgress}
                      fullWidth
                    >
                      Sync with All Peers
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Activity Log Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>📝 Activity Log</Typography>
              
              {syncInProgress && (
                <Box mb={2}>
                  <LinearProgress variant="determinate" value={syncProgress} />
                  <Typography variant="body2" color="textSecondary" mt={1}>
                    Progress: {Math.round(syncProgress)}%
                  </Typography>
                </Box>
              )}

              <Box maxHeight={300} overflow="auto">
                {activityLog.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    No activity logged yet
                  </Typography>
                ) : (
                  <List dense>
                    {activityLog.map((entry, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {entry.type === 'success' && <CheckCircle color="success" />}
                          {entry.type === 'error' && <Error color="error" />}
                          {entry.type === 'warning' && <Warning color="warning" />}
                          {entry.type === 'info' && <Info color="info" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={entry.message}
                          secondary={entry.timestamp}
                          primaryTypographyProps={{ variant: 'body2' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Peer Dialog */}
      <Dialog open={showAddPeerDialog} onClose={() => setShowAddPeerDialog(false)}>
        <DialogTitle>Add New Peer</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Peer URL"
            type="url"
            fullWidth
            variant="outlined"
            value={newPeerUrl}
            onChange={(e) => setNewPeerUrl(e.target.value)}
            placeholder="http://192.168.1.100:3001"
            helperText="Enter the URL of the peer device you want to connect to"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddPeerDialog(false)}>Cancel</Button>
          <Button onClick={addPeer} variant="contained">Add Peer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PeerToPeer;
