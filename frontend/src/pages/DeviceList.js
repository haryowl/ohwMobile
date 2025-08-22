import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Group as GroupIcon,
  CheckCircle as ActiveIcon,
  Warning as InactiveIcon,
  Error as OfflineIcon
} from '@mui/icons-material';
import apiService from '../services/api';
import DeviceConfiguration from '../components/DeviceConfiguration';

const DeviceList = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [newDevice, setNewDevice] = useState({ name: '', imei: '', group: '', description: '' });
  const [editDevice, setEditDevice] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadDevices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getDevices();
      setDevices(response);
      setFilteredDevices(response);
    } catch (error) {
      console.error('Error loading devices:', error);
      setSnackbar({ open: true, message: 'Failed to load devices: ' + error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let filtered = devices;
    if (searchTerm) {
      filtered = filtered.filter(device =>
        device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.imei?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(device => device.status === statusFilter);
    }
    setFilteredDevices(filtered);
  }, [devices, searchTerm, statusFilter]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const handleAddDevice = async () => {
    try {
      await apiService.createDevice(newDevice);
      setSnackbar({ open: true, message: 'Device added successfully', severity: 'success' });
      setShowAddDialog(false);
      setNewDevice({ name: '', imei: '', group: '', description: '' });
      loadDevices();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to add device: ' + error.message, severity: 'error' });
    }
  };

  const handleEditDevice = async () => {
    try {
      await apiService.updateDevice(selectedDevice.id, editDevice);
      setSnackbar({ open: true, message: 'Device updated successfully', severity: 'success' });
      setShowEditDialog(false);
      setSelectedDevice(null);
      setEditDevice({});
      loadDevices();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update device: ' + error.message, severity: 'error' });
    }
  };

  const handleDeleteDevice = async () => {
    try {
      await apiService.deleteDevice(selectedDevice.id);
      setSnackbar({ open: true, message: 'Device deleted successfully', severity: 'success' });
      setShowDeleteDialog(false);
      setSelectedDevice(null);
      loadDevices();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete device: ' + error.message, severity: 'error' });
    }
  };

  const handleExportData = () => {
    const exportData = filteredDevices.map(device => ({
      id: device.id,
      name: device.name,
      imei: device.imei,
      status: device.status,
      group: device.group,
      lastSeen: device.lastSeen
    }));

    const csvContent = generateCSV(exportData);
    downloadCSV(csvContent, `devices_${new Date().toISOString().split('T')[0]}.csv`);
    setSnackbar({ open: true, message: 'Device data exported successfully', severity: 'success' });
  };

  const generateCSV = (data) => {
    const headers = ['ID', 'Name', 'IMEI', 'Status', 'Group', 'Last Seen'];
    const rows = data.map(device => [
      device.id,
      device.name,
      device.imei,
      device.status,
      device.group,
      device.lastSeen ? new Date(device.lastSeen).toLocaleString() : ''
    ]);
    return [headers, ...rows].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <ActiveIcon color="success" />;
      case 'inactive': return <InactiveIcon color="warning" />;
      case 'offline': return <OfflineIcon color="error" />;
      default: return <InactiveIcon color="warning" />;
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

  const stats = {
    total: devices.length,
    active: devices.filter(d => d.status === 'active').length,
    inactive: devices.filter(d => d.status === 'inactive').length,
    offline: devices.filter(d => d.status === 'offline').length
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">Device Management</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportData}>
            Export
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddDialog(true)}>
            Add Device
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography color="textSecondary">Total Devices</Typography>
            <Typography variant="h4">{stats.total}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography color="textSecondary">Active</Typography>
            <Typography variant="h4" color="success.main">{stats.active}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography color="textSecondary">Inactive</Typography>
            <Typography variant="h4" color="warning.main">{stats.inactive}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Typography color="textSecondary">Offline</Typography>
            <Typography variant="h4" color="error.main">{stats.offline}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="offline">Offline</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button fullWidth variant="outlined" startIcon={<RefreshIcon />} onClick={loadDevices} disabled={loading}>
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>IMEI</TableCell>
                <TableCell>Group</TableCell>
                <TableCell>Last Seen</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
              ) : filteredDevices.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center">No devices found</TableCell></TableRow>
              ) : (
                filteredDevices.map((device) => (
                  <TableRow key={device.id} hover>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(device.status)}
                        label={device.status}
                        color={getStatusColor(device.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">{device.name}</Typography>
                      {device.description && (
                        <Typography variant="caption" color="textSecondary">{device.description}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">{device.imei}</Typography>
                    </TableCell>
                    <TableCell>
                      {device.group && (
                        <Chip icon={<GroupIcon />} label={device.group} size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      {device.lastSeen ? (
                        <Typography variant="body2">{new Date(device.lastSeen).toLocaleString()}</Typography>
                      ) : (
                        <Typography variant="body2" color="textSecondary">Never</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => navigate(`/devices/${device.id}`)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Device">
                          <IconButton size="small" onClick={() => {
                            setSelectedDevice(device);
                            setEditDevice({
                              name: device.name,
                              imei: device.imei,
                              group: device.group || '',
                              description: device.description || ''
                            });
                            setShowEditDialog(true);
                          }}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Device Settings">
                          <IconButton size="small" onClick={() => {
                            setSelectedDevice(device);
                            setShowConfigDialog(true);
                          }}>
                            <SettingsIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Device">
                          <IconButton size="small" color="error" onClick={() => {
                            setSelectedDevice(device);
                            setShowDeleteDialog(true);
                          }}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Device</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Device Name" value={newDevice.name} 
                onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="IMEI" value={newDevice.imei} 
                onChange={(e) => setNewDevice({ ...newDevice, imei: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Group" value={newDevice.group} 
                onChange={(e) => setNewDevice({ ...newDevice, group: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={newDevice.description} 
                onChange={(e) => setNewDevice({ ...newDevice, description: e.target.value })} multiline rows={3} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddDevice} variant="contained" disabled={!newDevice.name || !newDevice.imei}>
            Add Device
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Device</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Device Name" value={editDevice.name} 
                onChange={(e) => setEditDevice({ ...editDevice, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="IMEI" value={editDevice.imei} 
                onChange={(e) => setEditDevice({ ...editDevice, imei: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Group" value={editDevice.group} 
                onChange={(e) => setEditDevice({ ...editDevice, group: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={editDevice.description} 
                onChange={(e) => setEditDevice({ ...editDevice, description: e.target.value })} multiline rows={3} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditDevice} variant="contained" disabled={!editDevice.name || !editDevice.imei}>
            Update Device
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Delete Device</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete device "{selectedDevice?.name}"? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteDevice} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      <DeviceConfiguration
        open={showConfigDialog}
        onClose={() => setShowConfigDialog(false)}
        device={selectedDevice}
        onSave={(updatedDevice) => {
          setSnackbar({ open: true, message: 'Device configuration saved successfully', severity: 'success' });
          loadDevices();
        }}
      />

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DeviceList; 