import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Speed,
  Memory,
  BatteryChargingFull,
  NetworkCheck,
  Settings,
  Refresh,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Info,
  AutoFixHigh,
  Storage,
  Wifi,
  WifiOff
} from '@mui/icons-material';
import performanceOptimizer from '../services/performanceOptimizer';
import imageOptimizer from '../services/imageOptimizer';

const PerformanceDashboard = ({ showDetails = true }) => {
  const [metrics, setMetrics] = useState({});
  const [performanceMode, setPerformanceMode] = useState('balanced');
  const [recommendations, setRecommendations] = useState([]);
  const [showOptimizationDialog, setShowOptimizationDialog] = useState(false);
  const [imageCacheStats, setImageCacheStats] = useState({});

  useEffect(() => {
    // Initial metrics update
    updateMetrics();

    // Listen for metrics updates
    const handleMetricsUpdate = (newMetrics) => {
      setMetrics(newMetrics);
    };

    const handleModeChange = (data) => {
      setPerformanceMode(data.mode);
    };

    performanceOptimizer.addEventListener('metricsUpdated', handleMetricsUpdate);
    performanceOptimizer.addEventListener('modeChanged', handleModeChange);

    // Update metrics periodically
    const interval = setInterval(updateMetrics, 5000);

    return () => {
      performanceOptimizer.removeEventListener('metricsUpdated', handleMetricsUpdate);
      performanceOptimizer.removeEventListener('modeChanged', handleModeChange);
      clearInterval(interval);
    };
  }, []);

  const updateMetrics = () => {
    const currentMetrics = performanceOptimizer.getMetrics();
    const currentMode = performanceOptimizer.getPerformanceMode();
    const currentRecommendations = performanceOptimizer.getRecommendations();
    const currentImageStats = imageOptimizer.getCacheStats();

    setMetrics(currentMetrics);
    setPerformanceMode(currentMode);
    setRecommendations(currentRecommendations);
    setImageCacheStats(currentImageStats);
  };

  const handleModeChange = (newMode) => {
    performanceOptimizer.setPerformanceMode(newMode);
  };

  const handleOptimization = () => {
    performanceOptimizer.performOptimizations();
    imageOptimizer.cleanupCache();
    updateMetrics();
  };

  const getPerformanceColor = (value, thresholds) => {
    if (value >= thresholds.good) return 'success';
    if (value >= thresholds.warning) return 'warning';
    return 'error';
  };

  const getPerformanceIcon = (value, thresholds) => {
    if (value >= thresholds.good) return <TrendingUp />;
    if (value >= thresholds.warning) return <Warning />;
    return <TrendingDown />;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderMetricCard = (title, value, unit, icon, color, progress = null) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          {icon}
        </Box>
        <Typography variant="h4" component="div" color={color} gutterBottom>
          {value}{unit}
        </Typography>
        {progress && (
          <LinearProgress
            variant="determinate"
            value={progress}
            color={color}
            sx={{ height: 8, borderRadius: 4 }}
          />
        )}
      </CardContent>
    </Card>
  );

  const renderPerformanceModeCard = () => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" component="div">
            Performance Mode
          </Typography>
          <IconButton onClick={() => setShowOptimizationDialog(true)}>
            <Settings />
          </IconButton>
        </Box>
        
        <Box display="flex" gap={1} mb={2}>
          {['power_save', 'balanced', 'performance'].map((mode) => (
            <Chip
              key={mode}
              label={mode.replace('_', ' ')}
              color={performanceMode === mode ? 'primary' : 'default'}
              variant={performanceMode === mode ? 'filled' : 'outlined'}
              onClick={() => handleModeChange(mode)}
              sx={{ textTransform: 'capitalize' }}
            />
          ))}
        </Box>

        <Typography variant="body2" color="textSecondary">
          Current mode: {performanceMode.replace('_', ' ')}
        </Typography>
      </CardContent>
    </Card>
  );

  const renderRecommendationsCard = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" component="div" mb={2}>
          Optimization Recommendations
        </Typography>
        
        {recommendations.length === 0 ? (
          <Alert severity="success" icon={<CheckCircle />}>
            All systems are running optimally!
          </Alert>
        ) : (
          <List dense>
            {recommendations.map((rec, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <Warning color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary={rec.message}
                  secondary={rec.type}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={rec.action}
                >
                  Apply
                </Button>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  const renderCacheStatsCard = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" component="div" mb={2}>
          Cache Statistics
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Cached Images
            </Typography>
            <Typography variant="h6">
              {imageCacheStats.totalImages || 0}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="textSecondary">
              Cache Size
            </Typography>
            <Typography variant="h6">
              {formatBytes(imageCacheStats.totalMemory || 0)}
            </Typography>
          </Grid>
        </Grid>
        
        <Box mt={2}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => imageOptimizer.clearCache()}
            startIcon={<Storage />}
          >
            Clear Cache
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" component="h1">
          Performance Dashboard
        </Typography>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh metrics">
            <IconButton onClick={updateMetrics}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Run optimizations">
            <IconButton onClick={handleOptimization}>
              <AutoFixHigh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          {renderMetricCard(
            'FPS',
            metrics.fps || 0,
            '',
            getPerformanceIcon(metrics.fps || 0, { good: 55, warning: 30 }),
            getPerformanceColor(metrics.fps || 0, { good: 55, warning: 30 }),
            (metrics.fps || 0) / 60 * 100
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {renderMetricCard(
            'Memory Usage',
            metrics.memoryUsage || 0,
            '%',
            <Memory color={getPerformanceColor(metrics.memoryUsage || 0, { good: 50, warning: 70 })} />,
            getPerformanceColor(metrics.memoryUsage || 0, { good: 50, warning: 70 }),
            metrics.memoryUsage || 0
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {renderMetricCard(
            'Battery Level',
            metrics.batteryLevel || 100,
            '%',
            <BatteryChargingFull color={getPerformanceColor(metrics.batteryLevel || 100, { good: 80, warning: 30 })} />,
            getPerformanceColor(metrics.batteryLevel || 100, { good: 80, warning: 30 }),
            metrics.batteryLevel || 100
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {renderMetricCard(
            'Network Speed',
            metrics.networkSpeed || 'unknown',
            '',
            metrics.networkSpeed === '4g' ? <Wifi color="success" /> : <WifiOff color="warning" />,
            metrics.networkSpeed === '4g' ? 'success' : 'warning'
          )}
        </Grid>

        {/* Performance Mode */}
        <Grid item xs={12} md={6}>
          {renderPerformanceModeCard()}
        </Grid>

        {/* Cache Statistics */}
        <Grid item xs={12} md={6}>
          {renderCacheStatsCard()}
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12}>
          {renderRecommendationsCard()}
        </Grid>
      </Grid>

      {/* Optimization Dialog */}
      <Dialog
        open={showOptimizationDialog}
        onClose={() => setShowOptimizationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Performance Optimization Settings
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" mb={2}>
            Configure performance optimization settings for different scenarios.
          </Typography>
          
          <Grid container spacing={2}>
            {Object.entries(performanceOptimizer.optimizationSettings).map(([mode, settings]) => (
              <Grid item xs={12} key={mode}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {mode.replace('_', ' ').toUpperCase()}
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Map Update: {settings.mapUpdateInterval / 1000}s
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Data Polling: {settings.dataPollingInterval / 1000}s
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Max Cache: {settings.maxCachedItems}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Animations: {settings.enableAnimations ? 'On' : 'Off'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOptimizationDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PerformanceDashboard;

