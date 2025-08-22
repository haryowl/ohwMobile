// frontend/src/pages/Dashboard.js

import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab
} from '@mui/material';
import TrackingMap from '../components/TrackingMap';
import RealTimeStatusDashboard from '../components/RealTimeStatusDashboard';
import apiService from '../services/api';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalDevices: 0,
    activeDevices: 0,
    totalAlerts: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const devices = await apiService.getDevices();
      setStats({
        totalDevices: devices.length,
        activeDevices: devices.filter(d => d.status === 'active').length,
        totalAlerts: 0 // Will be implemented when alerts are added
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Devices
            </Typography>
            <Typography component="p" variant="h4">
              {stats.totalDevices}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Active Devices
            </Typography>
            <Typography component="p" variant="h4">
              {stats.activeDevices}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Alerts
            </Typography>
            <Typography component="p" variant="h4">
              {stats.totalAlerts}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
              <Tab label="Tracking Map" />
              <Tab label="Status Dashboard" />
            </Tabs>
            
            {activeTab === 0 && (
              <TrackingMap height={500} showInfo={true} />
            )}
            
            {activeTab === 1 && (
              <RealTimeStatusDashboard />
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Welcome to Galileo Sky Parser
            </Typography>
            <Typography component="p" variant="body1">
              This is the dashboard of your Galileo Sky Parser application. Here you can monitor your devices, view data, and manage your settings.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
