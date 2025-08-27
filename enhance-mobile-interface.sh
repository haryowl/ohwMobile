#!/bin/bash

echo "🛰️ Enhancing mobile interface with complete features..."

cd ~/ohwMobile

# Create enhanced mobile interface with all features
cat > public/mobile-frontend.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OHW Mobile - Complete GalileoSky System</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; color: white; margin-bottom: 30px; }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .header p { font-size: 1.1rem; opacity: 0.9; }
        
        .nav-tabs { display: flex; background: white; border-radius: 10px; margin-bottom: 20px; overflow-x: auto; }
        .nav-tab { flex: 1; padding: 15px; text-align: center; cursor: pointer; border: none; background: transparent; transition: all 0.3s; }
        .nav-tab.active { background: #667eea; color: white; border-radius: 10px; }
        .nav-tab:hover { background: #f0f0f0; }
        
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
        .card { background: white; border-radius: 15px; padding: 25px; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .card h3 { color: #667eea; margin-bottom: 15px; font-size: 1.3rem; }
        
        .btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-size: 1rem; transition: all 0.3s; margin: 5px; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .btn-secondary { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        
        .status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
        .status-online { background: #4CAF50; }
        .status-offline { background: #f44336; }
        
        .device-list { max-height: 400px; overflow-y: auto; }
        .device-item { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee; }
        .device-item:last-child { border-bottom: none; }
        
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }
        .stat-card { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px; }
        .stat-value { font-size: 2rem; font-weight: bold; color: #667eea; }
        .stat-label { font-size: 0.9rem; color: #666; margin-top: 5px; }
        
        #map { height: 400px; border-radius: 10px; margin-top: 15px; }
        
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        
        .loading { text-align: center; padding: 20px; color: #666; }
        .error { background: #ffebee; color: #c62828; padding: 15px; border-radius: 10px; margin: 10px 0; }
        
        @media (max-width: 768px) {
            .header h1 { font-size: 2rem; }
            .container { padding: 15px; }
            .nav-tabs { flex-direction: column; }
            .nav-tab { flex: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛰️ OHW Mobile</h1>
            <p>Complete GalileoSky Parser & Device Management System</p>
        </div>
        
        <div class="nav-tabs">
            <button class="nav-tab active" onclick="showTab('tracking')">📍 Tracking</button>
            <button class="nav-tab" onclick="showTab('devices')">📱 Devices</button>
            <button class="nav-tab" onclick="showTab('data')">📊 Data</button>
            <button class="nav-tab" onclick="showTab('export')">📤 Export</button>
            <button class="nav-tab" onclick="showTab('sync')">🔄 Peer Sync</button>
            <button class="nav-tab" onclick="showTab('management')">⚙️ Management</button>
            <button class="nav-tab" onclick="showTab('performance')">⚡ Performance</button>
        </div>
        
        <!-- Tracking Tab -->
        <div id="tracking" class="tab-content active">
            <div class="card">
                <h3>📍 Live Tracking</h3>
                <div id="map"></div>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value" id="activeDevices">0</div>
                        <div class="stat-label">Active Devices</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="totalRecords">0</div>
                        <div class="stat-label">Total Records</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="lastUpdate">-</div>
                        <div class="stat-label">Last Update</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Devices Tab -->
        <div id="devices" class="tab-content">
            <div class="card">
                <h3>📱 Device Management</h3>
                <div id="deviceList" class="device-list">
                    <div class="loading">Loading devices...</div>
                </div>
                <button class="btn" onclick="showAddDeviceModal()">➕ Add Device</button>
                <button class="btn btn-secondary" onclick="loadDevices()">🔄 Refresh</button>
            </div>
        </div>
        
        <!-- Data Tab -->
        <div id="data" class="tab-content">
            <div class="card">
                <h3>📊 Data Records</h3>
                <div id="dataRecords">
                    <div class="loading">Loading data...</div>
                </div>
                <button class="btn" onclick="loadDataRecords()">🔄 Refresh Data</button>
            </div>
        </div>
        
        <!-- Export Tab -->
        <div id="export" class="tab-content">
            <div class="card">
                <h3>📤 Data Export</h3>
                <div class="form-group">
                    <label>Export Format:</label>
                    <select id="exportFormat">
                        <option value="csv">CSV</option>
                        <option value="pfsl">PFSL (Data SM)</option>
                        <option value="json">JSON</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Device:</label>
                    <select id="exportDevice">
                        <option value="all">All Devices</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Date Range:</label>
                    <input type="date" id="exportFrom" />
                    <input type="date" id="exportTo" />
                </div>
                <button class="btn" onclick="exportData()">📤 Export Data</button>
            </div>
        </div>
        
        <!-- Peer Sync Tab -->
        <div id="sync" class="tab-content">
            <div class="card">
                <h3>🔄 Peer Synchronization</h3>
                <div class="form-group">
                    <label>Peer Server URL:</label>
                    <input type="text" id="peerUrl" placeholder="http://192.168.1.100:3001" />
                </div>
                <button class="btn" onclick="testPeerConnection()">🔍 Test Connection</button>
                <button class="btn btn-secondary" onclick="syncWithPeer()">🔄 Sync Data</button>
                <div id="peerStatus">
                    <div class="loading">Peer sync not configured</div>
                </div>
            </div>
        </div>
        
        <!-- Management Tab -->
        <div id="management" class="tab-content">
            <div class="card">
                <h3>⚙️ Data Management</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value" id="totalRecordsMgmt">0</div>
                        <div class="stat-label">Total Records</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="activeDevicesMgmt">0</div>
                        <div class="stat-label">Active Devices</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="storageUsed">0 KB</div>
                        <div class="stat-label">Storage Used</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="lastBackup">-</div>
                        <div class="stat-label">Last Backup</div>
                    </div>
                </div>
                <button class="btn" onclick="createBackup()">💾 Create Backup</button>
                <button class="btn btn-secondary" onclick="restoreBackup()">📥 Restore Backup</button>
                <button class="btn" onclick="clearData()" style="background: #f44336;">🗑️ Clear Data</button>
            </div>
        </div>
        
        <!-- Performance Tab -->
        <div id="performance" class="tab-content">
            <div class="card">
                <h3>⚡ Performance Monitoring</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value" id="cpuUsage">0%</div>
                        <div class="stat-label">CPU Usage</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="memoryUsage">0%</div>
                        <div class="stat-label">Memory Usage</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="networkStatus">-</div>
                        <div class="stat-label">Network Status</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="batteryLevel">-</div>
                        <div class="stat-label">Battery Level</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="activeConnections">0</div>
                        <div class="stat-label">Active Connections</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="dataRecordsCount">0</div>
                        <div class="stat-label">Data Records</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let map;
        let markers = {};
        let currentTab = 'tracking';
        
        // Initialize map
        function initMap() {
            map = L.map('map').setView([0, 0], 2);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
        }
        
        // Show tab
        function showTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
            
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
            currentTab = tabName;
            
            if (tabName === 'tracking' && !map) {
                setTimeout(initMap, 100);
            }
            
            loadTabData(tabName);
        }
        
        // Load tab-specific data
        function loadTabData(tabName) {
            switch(tabName) {
                case 'tracking':
                    loadTrackingData();
                    break;
                case 'devices':
                    loadDevices();
                    break;
                case 'data':
                    loadDataRecords();
                    break;
                case 'management':
                    loadManagementData();
                    break;
                case 'performance':
                    loadPerformanceData();
                    break;
            }
        }
        
        // Load tracking data
        async function loadTrackingData() {
            try {
                const [devicesResponse, recordsResponse] = await Promise.all([
                    fetch('/api/devices'),
                    fetch('/api/data/latest')
                ]);
                
                const devices = await devicesResponse.json();
                const records = await recordsResponse.json();
                
                // Update stats
                document.getElementById('activeDevices').textContent = devices.filter(d => d.status === 'online').length;
                document.getElementById('totalRecords').textContent = records.length;
                document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
                
                // Update map
                if (map) {
                    // Clear existing markers
                    Object.values(markers).forEach(marker => map.removeLayer(marker));
                    markers = {};
                    
                    // Add new markers
                    records.forEach(record => {
                        if (record.latitude && record.longitude) {
                            const marker = L.marker([record.latitude, record.longitude])
                                .bindPopup(`Device: ${record.device_id}<br>Speed: ${record.speed} km/h<br>Time: ${new Date(record.timestamp).toLocaleString()}`);
                            marker.addTo(map);
                            markers[record.id] = marker;
                        }
                    });
                }
            } catch (error) {
                console.error('Error loading tracking data:', error);
            }
        }
        
        // Load devices
        async function loadDevices() {
            try {
                const response = await fetch('/api/devices');
                const devices = await response.json();
                
                if (devices.length === 0) {
                    document.getElementById('deviceList').innerHTML = '<div class="loading">No devices found. Add your first device!</div>';
                    return;
                }
                
                const html = devices.map(device => `
                    <div class="device-item">
                        <div>
                            <span class="status-indicator ${device.status === 'online' ? 'status-online' : 'status-offline'}"></span>
                            <strong>${device.name}</strong> (${device.imei})
                            <br><small>Group: ${device.group} | Records: ${device.totalRecords} | Last Seen: ${new Date(device.lastSeen).toLocaleString()}</small>
                        </div>
                        <div>
                            <button class="btn" onclick="editDevice(${device.id})">✏️</button>
                            <button class="btn btn-secondary" onclick="viewDeviceData(${device.id})">👁️</button>
                            <button class="btn" onclick="deleteDevice(${device.id})" style="background: #f44336;">🗑️</button>
                        </div>
                    </div>
                `).join('');
                
                document.getElementById('deviceList').innerHTML = html;
            } catch (error) {
                document.getElementById('deviceList').innerHTML = '<div class="error">Error loading devices</div>';
            }
        }
        
        // Load data records
        async function loadDataRecords() {
            try {
                const response = await fetch('/api/data/latest');
                const records = await response.json();
                
                if (records.length === 0) {
                    document.getElementById('dataRecords').innerHTML = '<div class="loading">No data records found</div>';
                    return;
                }
                
                const html = records.slice(0, 20).map(record => `
                    <div class="device-item">
                        <div>
                            <strong>Device: ${record.device_id}</strong>
                            <br><small>Time: ${new Date(record.timestamp).toLocaleString()} | Source: ${record.source}</small>
                            <br><small>Location: ${record.latitude}, ${record.longitude} | Speed: ${record.speed} km/h</small>
                        </div>
                    </div>
                `).join('');
                
                document.getElementById('dataRecords').innerHTML = html;
            } catch (error) {
                document.getElementById('dataRecords').innerHTML = '<div class="error">Error loading data records</div>';
            }
        }
        
        // Load management data
        async function loadManagementData() {
            try {
                const response = await fetch('/api/management');
                const data = await response.json();
                
                document.getElementById('totalRecordsMgmt').textContent = data.totalRecords;
                document.getElementById('activeDevicesMgmt').textContent = data.activeDevices;
                document.getElementById('storageUsed').textContent = data.storageUsed;
                document.getElementById('lastBackup').textContent = data.lastBackup ? new Date(data.lastBackup).toLocaleDateString() : 'None';
            } catch (error) {
                console.error('Error loading management data:', error);
            }
        }
        
        // Load performance data
        async function loadPerformanceData() {
            try {
                const response = await fetch('/api/performance');
                const data = await response.json();
                
                document.getElementById('cpuUsage').textContent = data.cpu + '%';
                document.getElementById('memoryUsage').textContent = data.memory + '%';
                document.getElementById('networkStatus').textContent = data.network;
                document.getElementById('batteryLevel').textContent = data.battery;
                document.getElementById('activeConnections').textContent = data.activeConnections;
                document.getElementById('dataRecordsCount').textContent = data.dataRecords;
            } catch (error) {
                console.error('Error loading performance data:', error);
            }
        }
        
        // Export data
        function exportData() {
            const format = document.getElementById('exportFormat').value;
            const device = document.getElementById('exportDevice').value;
            const from = document.getElementById('exportFrom').value;
            const to = document.getElementById('exportTo').value;
            
            let url = `/api/data/export?format=${format}`;
            if (device !== 'all') url += `&device=${device}`;
            if (from) url += `&from=${from}`;
            if (to) url += `&to=${to}`;
            
            window.open(url, '_blank');
        }
        
        // Add device
        function showAddDeviceModal() {
            const imei = prompt('Enter device IMEI:');
            if (!imei) return;
            
            const name = prompt('Enter device name (optional):') || imei;
            const group = prompt('Enter device group (optional):') || 'Default';
            
            fetch('/api/devices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imei, name, group })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert('Error: ' + data.error);
                } else {
                    alert('Device added successfully!');
                    loadDevices();
                }
            })
            .catch(error => alert('Error: ' + error.message));
        }
        
        // Edit device
        function editDevice(id) {
            const name = prompt('Enter new device name:');
            if (!name) return;
            
            fetch(`/api/devices/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert('Error: ' + data.error);
                } else {
                    alert('Device updated successfully!');
                    loadDevices();
                }
            })
            .catch(error => alert('Error: ' + error.message));
        }
        
        // Delete device
        function deleteDevice(id) {
            if (!confirm('Are you sure you want to delete this device?')) return;
            
            fetch(`/api/devices/${id}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                alert('Device deleted successfully!');
                loadDevices();
            })
            .catch(error => alert('Error: ' + error.message));
        }
        
        // View device data
        function viewDeviceData(id) {
            window.open(`/api/data/device/${id}`, '_blank');
        }
        
        // Test peer connection
        async function testPeerConnection() {
            const peerUrl = document.getElementById('peerUrl').value;
            if (!peerUrl) {
                alert('Please enter a peer URL');
                return;
            }
            
            try {
                const response = await fetch(`${peerUrl}/api/peer/status`);
                const data = await response.json();
                document.getElementById('peerStatus').innerHTML = `<div class="stat-card">✅ Connected to peer: ${peerUrl}</div>`;
            } catch (error) {
                document.getElementById('peerStatus').innerHTML = `<div class="error">❌ Failed to connect to peer: ${error.message}</div>`;
            }
        }
        
        // Sync with peer
        async function syncWithPeer() {
            const peerUrl = document.getElementById('peerUrl').value;
            if (!peerUrl) {
                alert('Please enter a peer URL');
                return;
            }
            
            try {
                const response = await fetch(`${peerUrl}/api/peer/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deviceId: 'mobile-client', timestamp: new Date().toISOString() })
                });
                const data = await response.json();
                alert('Sync completed successfully!');
            } catch (error) {
                alert('Sync failed: ' + error.message);
            }
        }
        
        // Create backup
        async function createBackup() {
            try {
                const response = await fetch('/api/data/backup', { method: 'POST' });
                const data = await response.json();
                alert('Backup created successfully!');
                loadManagementData();
            } catch (error) {
                alert('Backup failed: ' + error.message);
            }
        }
        
        // Restore backup
        async function restoreBackup() {
            if (!confirm('This will restore the latest backup. Continue?')) return;
            
            try {
                const response = await fetch('/api/data/restore', { method: 'POST' });
                const data = await response.json();
                alert('Backup restored successfully!');
                loadManagementData();
                loadDevices();
            } catch (error) {
                alert('Restore failed: ' + error.message);
            }
        }
        
        // Clear data
        async function clearData() {
            if (!confirm('This will clear ALL data. Are you sure?')) return;
            
            try {
                const response = await fetch('/api/data/clear', { method: 'POST' });
                const data = await response.json();
                alert('Data cleared successfully!');
                loadManagementData();
                loadDevices();
            } catch (error) {
                alert('Clear failed: ' + error.message);
            }
        }
        
        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            loadTabData(currentTab);
            
            // Auto-refresh every 30 seconds
            setInterval(() => {
                loadTabData(currentTab);
            }, 30000);
        });
    </script>
</body>
</html>
EOF

echo "✅ Enhanced mobile interface created with all features"

# Restart the server to apply changes
echo "🔄 Restarting server with enhanced interface..."
pkill -f "node server.js" 2>/dev/null
sleep 2
nohup node server.js > server.log 2>&1 &
echo $! > ~/ohw-server.pid

echo "🎉 Mobile Interface Enhancement Complete!"
echo ""
echo "🚀 Complete Features Now Available:"
echo "- 📍 Live Tracking with interactive maps"
echo "- 📱 Advanced Device Management (CRUD operations)"
echo "- 📊 Data Records viewing"
echo "- 📤 Data Export (CSV, PFSL, JSON)"
echo "- 🔄 Peer Synchronization"
echo "- ⚙️ Data Management (backup/restore/clear)"
echo "- ⚡ Performance Monitoring"
echo ""
echo "📱 Access: http://localhost:3001/mobile"
echo "🔍 Monitor: tail -f ~/ohwMobile/server.log"

