import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider
} from '@mui/material';
import {
  Download as DownloadIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import apiService from '../services/api';

const DataSM = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 24 * 60 * 60 * 1000)); // 24 hours ago
  const [dateTo, setDateTo] = useState(new Date());
  const [autoExport, setAutoExport] = useState(false);
  const [exportTemplate, setExportTemplate] = useState('data_sm_{date}_{device}');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Field mapping for Data SM
  const fieldMapping = {
    DevicesName: 'Name',
    DeviceImei: 'IMEI',
    Datetime: 'Timestamp',
    Latitude: 'Lat',
    Longitude: 'Lon',
    Speed: 'Speed',
    Altitude: 'Alt',
    Satellites: 'Satellite',
    UserData0: 'Sensor Kiri',
    UserData1: 'Sensor Kanan',
    Modbus0: 'Sensor Serial ( Ultrasonic )',
    UserData2: 'Uptime Seconds'
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const devicesData = await apiService.getDevices();
      setDevices(devicesData);
    } catch (error) {
      console.error('Failed to load devices:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load devices: ' + error.message,
        severity: 'error'
      });
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      
      // Prepare export parameters
      const params = {
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
        deviceId: selectedDevice !== 'all' ? selectedDevice : undefined,
        fields: Object.keys(fieldMapping),
        format: 'csv'
      };

      // Get data from API using Data SM specific endpoint
      const data = await apiService.fetch('/api/data/sm/export?' + new URLSearchParams({
        from: dateFrom.toISOString(),
        to: dateTo.toISOString(),
        deviceId: selectedDevice !== 'all' ? selectedDevice : 'all'
      }));
      
      if (!data || data.length === 0) {
        setSnackbar({
          open: true,
          message: 'No data found for the selected criteria',
          severity: 'warning'
        });
        return;
      }

      // Transform data with new field names
      const transformedData = data.map(record => {
        const transformed = {};
        Object.keys(fieldMapping).forEach(originalField => {
          const newFieldName = fieldMapping[originalField];
          transformed[newFieldName] = record[originalField] || '';
        });
        return transformed;
      });

      // Generate filename
      const deviceName = selectedDevice !== 'all' 
        ? devices.find(d => d.imei === selectedDevice)?.name || 'all'
        : 'all';
      
      const dateStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
      
      let filename = exportTemplate
        .replace('{date}', dateStr)
        .replace('{time}', timeStr)
        .replace('{device}', deviceName.replace(/\s+/g, '_'))
        .replace('{datetime}', `${dateStr}_${timeStr}`);
      
      if (!filename.endsWith('.pfsl')) {
        filename += '.pfsl';
      }

      // Generate CSV content
      const csvContent = generateCSV(transformedData);
      
      // Download file
      downloadFile(csvContent, filename);
      
      setSnackbar({
        open: true,
        message: `Data exported successfully: ${filename}`,
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Export failed:', error);
      setSnackbar({
        open: true,
        message: 'Export failed: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCSV = (data) => {
    if (data.length === 0) return '';
    
    const headers = Object.values(fieldMapping);
    const rows = data.map(record => 
      headers.map(header => {
        const value = record[header];
        // Handle special cases for date formatting
        if (header === 'Timestamp' && value) {
          return new Date(value).toISOString();
        }
        return value || '';
      })
    );

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  };

  const downloadFile = (content, filename) => {
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

  const handleAutoExportToggle = async () => {
    try {
      if (!autoExport) {
        // Schedule auto-export
        const response = await apiService.fetch('/api/data/sm/auto-export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: selectedDevice,
            template: exportTemplate
          })
        });
        
        if (response.ok) {
          setAutoExport(true);
          setSnackbar({
            open: true,
            message: 'Auto-export scheduled for daily midnight',
            severity: 'success'
          });
        }
      } else {
        // Cancel auto-export
        const response = await apiService.fetch('/api/data/sm/auto-export', {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setAutoExport(false);
          setSnackbar({
            open: true,
            message: 'Auto-export disabled',
            severity: 'info'
          });
        }
      }
    } catch (error) {
      console.error('Auto-export toggle failed:', error);
      setSnackbar({
        open: true,
        message: 'Failed to toggle auto-export: ' + error.message,
        severity: 'error'
      });
    }
  };

  const getFieldDescription = (field) => {
    const descriptions = {
      'Name': 'Device name identifier',
      'IMEI': 'Device IMEI number',
      'Timestamp': 'Data collection timestamp',
      'Lat': 'GPS latitude coordinate',
      'Lon': 'GPS longitude coordinate',
      'Speed': 'Current speed in km/h',
      'Alt': 'Altitude above sea level',
      'Satellite': 'Number of GPS satellites',
      'Sensor Kiri': 'Left sensor reading',
      'Sensor Kanan': 'Right sensor reading',
      'Sensor Serial ( Ultrasonic )': 'Ultrasonic sensor reading',
      'Uptime Seconds': 'Device uptime in seconds'
    };
    return descriptions[field] || '';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Data SM Export
      </Typography>
      
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Export device data with specific field mapping for SM format (.pfsl files)
      </Typography>

      <Grid container spacing={3}>
        {/* Export Configuration */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Export Configuration
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="From Date & Time"
                    value={dateFrom}
                    onChange={setDateFrom}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="To Date & Time"
                    value={dateTo}
                    onChange={setDateTo}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Device Filter</InputLabel>
                  <Select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    label="Device Filter"
                  >
                    <MenuItem value="all">All Devices</MenuItem>
                    {devices.map(device => (
                      <MenuItem key={device.id} value={device.imei}>
                        {device.name} ({device.imei})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Export Template"
                  value={exportTemplate}
                  onChange={(e) => setExportTemplate(e.target.value)}
                  helperText="Use {date}, {time}, {device}, {datetime} as placeholders"
                  placeholder="data_sm_{date}_{device}"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoExport}
                      onChange={handleAutoExportToggle}
                    />
                  }
                  label="Auto-export daily at midnight"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                disabled={loading}
                size="large"
              >
                {loading ? 'Exporting...' : 'Export Data SM'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadDevices}
                disabled={loading}
              >
                Refresh Devices
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Field Information */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Field Mapping
            </Typography>
            
            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
              {Object.entries(fieldMapping).map(([original, mapped], index) => (
                <Box key={original} sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight="medium">
                      {mapped}
                    </Typography>
                    <Chip 
                      label={original} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    {getFieldDescription(mapped)}
                  </Typography>
                  {index < Object.entries(fieldMapping).length - 1 && <Divider sx={{ mt: 1 }} />}
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Export Status */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Export Status
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1}>
                      <FileDownloadIcon color="primary" />
                      <Typography variant="h6">File Format</Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      CSV with .pfsl extension
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ScheduleIcon color={autoExport ? 'success' : 'disabled'} />
                      <Typography variant="h6">Auto Export</Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {autoExport ? 'Enabled (Daily at midnight)' : 'Disabled'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1}>
                      <SettingsIcon color="primary" />
                      <Typography variant="h6">Template</Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary" noWrap>
                      {exportTemplate}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DataSM;
