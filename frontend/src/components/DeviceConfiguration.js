import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Group as GroupIcon,
  Map as MapIcon,
  Notifications as AlertIcon,
  Tune as AdvancedIcon
} from '@mui/icons-material';
import apiService from '../services/api';

const DeviceConfiguration = ({ open, onClose, device, onSave }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [config, setConfig] = useState({
    general: {
      name: '',
      group: '',
      description: '',
      status: 'inactive',
      hardwareVersion: '',
      firmwareVersion: ''
    },
    fieldMappings: [],
    alerts: [],
    advanced: {
      dataRetention: 30,
      updateInterval: 60,
      enableGeofencing: false,
      enableNotifications: true
    }
  });
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (device && open) {
      loadDeviceConfiguration();
      loadGroups();
    }
  }, [device, open]);

  const loadDeviceConfiguration = async () => {
    try {
      setLoading(true);
      const deviceData = await apiService.getDevice(device.id);
      
      setConfig({
        general: {
          name: deviceData.name || '',
          group: deviceData.group || '',
          description: deviceData.description || '',
          status: deviceData.status || 'inactive',
          hardwareVersion: deviceData.hardwareVersion || '',
          firmwareVersion: deviceData.firmwareVersion || ''
        },
        fieldMappings: deviceData.mappings || [],
        alerts: deviceData.alerts || [],
        advanced: {
          dataRetention: deviceData.dataRetention || 30,
          updateInterval: deviceData.updateInterval || 60,
          enableGeofencing: deviceData.enableGeofencing || false,
          enableNotifications: deviceData.enableNotifications !== false
        }
      });
    } catch (error) {
      setError('Failed to load device configuration: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const devices = await apiService.getDevices();
      const uniqueGroups = [...new Set(devices.map(d => d.group).filter(Boolean))];
      setGroups(uniqueGroups);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      
      const updatedDevice = {
        ...config.general,
        mappings: config.fieldMappings,
        alerts: config.alerts,
        ...config.advanced
      };
      
      await apiService.updateDevice(device.id, updatedDevice);
      
      if (onSave) {
        onSave(updatedDevice);
      }
      
      onClose();
    } catch (error) {
      setError('Failed to save configuration: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      general: {
        ...prev.general,
        [field]: value
      }
    }));
  };

  const handleAdvancedChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      advanced: {
        ...prev.advanced,
        [field]: value
      }
    }));
  };

  const addFieldMapping = () => {
    setConfig(prev => ({
      ...prev,
      fieldMappings: [
        ...prev.fieldMappings,
        {
          id: Date.now(),
          originalField: '',
          customName: '',
          dataType: 'string',
          unit: '',
          enabled: true
        }
      ]
    }));
  };

  const updateFieldMapping = (index, field, value) => {
    setConfig(prev => ({
      ...prev,
      fieldMappings: prev.fieldMappings.map((mapping, i) =>
        i === index ? { ...mapping, [field]: value } : mapping
      )
    }));
  };

  const removeFieldMapping = (index) => {
    setConfig(prev => ({
      ...prev,
      fieldMappings: prev.fieldMappings.filter((_, i) => i !== index)
    }));
  };

  const renderGeneralTab = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Device Name"
          value={config.general.name}
          onChange={(e) => handleGeneralChange('name', e.target.value)}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Group"
          value={config.general.group}
          onChange={(e) => handleGeneralChange('group', e.target.value)}
          placeholder="e.g., Fleet A, Warehouse 1"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Description"
          value={config.general.description}
          onChange={(e) => handleGeneralChange('description', e.target.value)}
          multiline
          rows={3}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Hardware Version"
          value={config.general.hardwareVersion}
          onChange={(e) => handleGeneralChange('hardwareVersion', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Firmware Version"
          value={config.general.firmwareVersion}
          onChange={(e) => handleGeneralChange('firmwareVersion', e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={config.general.status}
            onChange={(e) => handleGeneralChange('status', e.target.value)}
            label="Status"
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="offline">Offline</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderFieldMappingTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Field Mappings</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addFieldMapping}
          size="small"
        >
          Add Mapping
        </Button>
      </Box>
      
      {config.fieldMappings.length === 0 ? (
        <Alert severity="info">
          No field mappings configured. Add mappings to customize how device data is displayed.
        </Alert>
      ) : (
        <List>
          {config.fieldMappings.map((mapping, index) => (
            <React.Fragment key={mapping.id}>
              <ListItem>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Original Field"
                      value={mapping.originalField}
                      onChange={(e) => updateFieldMapping(index, 'originalField', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Custom Name"
                      value={mapping.customName}
                      onChange={(e) => updateFieldMapping(index, 'customName', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Data Type</InputLabel>
                      <Select
                        value={mapping.dataType}
                        onChange={(e) => updateFieldMapping(index, 'dataType', e.target.value)}
                        label="Data Type"
                      >
                        <MenuItem value="string">String</MenuItem>
                        <MenuItem value="number">Number</MenuItem>
                        <MenuItem value="boolean">Boolean</MenuItem>
                        <MenuItem value="date">Date</MenuItem>
                        <MenuItem value="coordinates">Coordinates</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      label="Unit"
                      value={mapping.unit}
                      onChange={(e) => updateFieldMapping(index, 'unit', e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={mapping.enabled}
                          onChange={(e) => updateFieldMapping(index, 'enabled', e.target.checked)}
                          size="small"
                        />
                      }
                      label=""
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeFieldMapping(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </ListItem>
              {index < config.fieldMappings.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );

  const renderAlertsTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Alert Configuration</Typography>
      <Alert severity="info">
        Alert configuration will be implemented in the next phase. This will include geofencing, threshold alerts, and notification settings.
      </Alert>
    </Box>
  );

  const renderAdvancedTab = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Data Retention (days)"
          type="number"
          value={config.advanced.dataRetention}
          onChange={(e) => handleAdvancedChange('dataRetention', parseInt(e.target.value))}
          inputProps={{ min: 1, max: 365 }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Update Interval (seconds)"
          type="number"
          value={config.advanced.updateInterval}
          onChange={(e) => handleAdvancedChange('updateInterval', parseInt(e.target.value))}
          inputProps={{ min: 10, max: 3600 }}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={config.advanced.enableGeofencing}
              onChange={(e) => handleAdvancedChange('enableGeofencing', e.target.checked)}
            />
          }
          label="Enable Geofencing"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={config.advanced.enableNotifications}
              onChange={(e) => handleAdvancedChange('enableNotifications', e.target.checked)}
            />
          }
          label="Enable Notifications"
        />
      </Grid>
    </Grid>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SettingsIcon />
          Device Configuration - {device?.name}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
          <Tab icon={<SettingsIcon />} label="General" />
          <Tab icon={<MapIcon />} label="Field Mapping" />
          <Tab icon={<AlertIcon />} label="Alerts" />
          <Tab icon={<AdvancedIcon />} label="Advanced" />
        </Tabs>
        
        {activeTab === 0 && renderGeneralTab()}
        {activeTab === 1 && renderFieldMappingTab()}
        {activeTab === 2 && renderAlertsTab()}
        {activeTab === 3 && renderAdvancedTab()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !config.general.name}
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeviceConfiguration;

