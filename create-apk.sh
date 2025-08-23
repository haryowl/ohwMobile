#!/bin/bash

echo "📱 OHW Mobile - APK Creation Script"
echo "==================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required. Please install Node.js first."
    exit 1
fi

# Check if Java is installed (required for Android SDK)
if ! command -v java &> /dev/null; then
    echo "⚠️  Java not found. Android SDK requires Java."
    echo "Please install Java JDK 8 or higher."
fi

# Install Cordova globally
echo "📦 Installing Apache Cordova..."
npm install -g cordova

# Create Cordova project
echo "🏗️  Creating Cordova project..."
cordova create ohw-mobile-apk com.ohw.mobile "OHW Mobile"

# Navigate to project
cd ohw-mobile-apk

# Add Android platform
echo "🤖 Adding Android platform..."
cordova platform add android

# Create optimized index.html for Cordova
echo "📝 Creating optimized index.html..."
cat > www/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' data: gap: https://ssl.gstatic.com 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; media-src *; img-src 'self' data: content:;">
    <meta name="format-detection" content="telephone=no">
    <meta name="msapplication-tap-highlight" content="no">
    <title>OHW Mobile</title>
    
    <!-- Cordova -->
    <script src="cordova.js"></script>
    
    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    
    <style>
        /* Mobile-optimized styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            overflow-x: hidden;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
            -webkit-tap-highlight-color: transparent;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
        }
        
        .header h1 {
            font-size: 20px;
            font-weight: 600;
        }
        
        .nav-tabs {
            display: flex;
            background: white;
            border-bottom: 1px solid #ddd;
            position: fixed;
            top: 60px;
            left: 0;
            right: 0;
            z-index: 999;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }
        
        .nav-tab {
            flex: 1;
            min-width: 80px;
            padding: 12px 8px;
            text-align: center;
            background: none;
            border: none;
            color: #666;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            white-space: nowrap;
        }
        
        .nav-tab.active {
            color: #667eea;
            border-bottom: 3px solid #667eea;
            font-weight: 600;
        }
        
        .content {
            margin-top: 120px;
            padding: 15px;
            min-height: calc(100vh - 120px);
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 5px;
        }
        
        .btn:hover {
            background: #5a6fd8;
            transform: translateY(-1px);
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #333;
        }
        
        .form-input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
        }
        
        #map {
            height: 300px;
            border-radius: 10px;
            margin: 15px 0;
        }
        
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-online {
            background: #4CAF50;
        }
        
        .status-offline {
            background: #f44336;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        /* Responsive design */
        @media (max-width: 480px) {
            .nav-tab {
                font-size: 11px;
                padding: 10px 6px;
            }
            
            .content {
                padding: 10px;
            }
            
            .card {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📱 OHW Mobile</h1>
    </div>
    
    <div class="nav-tabs">
        <button class="nav-tab active" onclick="showTab('tracking')">📍 Tracking</button>
        <button class="nav-tab" onclick="showTab('devices')">📊 Devices</button>
        <button class="nav-tab" onclick="showTab('export')">📈 Export</button>
        <button class="nav-tab" onclick="showTab('sync')">🔄 Sync</button>
        <button class="nav-tab" onclick="showTab('data')">💾 Data</button>
        <button class="nav-tab" onclick="showTab('performance')">⚡ Performance</button>
    </div>
    
    <div class="content">
        <!-- Tracking Tab -->
        <div id="tracking" class="tab-content active">
            <div class="card">
                <h3>📍 Live Device Tracking</h3>
                <div id="map"></div>
                <div class="form-group">
                    <label class="form-label">Select Device</label>
                    <select id="deviceSelect" class="form-input">
                        <option value="">Loading devices...</option>
                    </select>
                </div>
                <button class="btn" onclick="startTracking()">🚀 Start Tracking</button>
                <button class="btn" onclick="stopTracking()">⏹️ Stop Tracking</button>
            </div>
        </div>
        
        <!-- Devices Tab -->
        <div id="devices" class="tab-content">
            <div class="card">
                <h3>📊 Device Management</h3>
                <div id="deviceList">
                    <div class="loading">Loading devices...</div>
                </div>
                <button class="btn" onclick="addDevice()">➕ Add Device</button>
            </div>
        </div>
        
        <!-- Export Tab -->
        <div id="export" class="tab-content">
            <div class="card">
                <h3>📈 Data Export</h3>
                <div class="form-group">
                    <label class="form-label">Export Format</label>
                    <select id="exportFormat" class="form-input">
                        <option value="csv">CSV</option>
                        <option value="pfsl">PFSL</option>
                        <option value="json">JSON</option>
                    </select>
                </div>
                <button class="btn" onclick="exportData()">📥 Export Data</button>
            </div>
        </div>
        
        <!-- Sync Tab -->
        <div id="sync" class="tab-content">
            <div class="card">
                <h3>🔄 Peer Synchronization</h3>
                <div class="form-group">
                    <label class="form-label">Peer URL</label>
                    <input type="text" id="peerUrl" class="form-input" placeholder="http://192.168.1.100:3001">
                </div>
                <button class="btn" onclick="syncWithPeer()">🔄 Sync Now</button>
            </div>
        </div>
        
        <!-- Data Tab -->
        <div id="data" class="tab-content">
            <div class="card">
                <h3>💾 Data Management</h3>
                <button class="btn" onclick="createBackup()">💾 Create Backup</button>
                <button class="btn" onclick="restoreBackup()">📂 Restore Backup</button>
                <button class="btn" onclick="clearData()">🗑️ Clear Data</button>
            </div>
        </div>
        
        <!-- Performance Tab -->
        <div id="performance" class="tab-content">
            <div class="card">
                <h3>⚡ Performance Monitor</h3>
                <div id="performanceStats">
                    <div class="loading">Loading performance data...</div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Leaflet JS -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    
    <script>
        // Cordova device ready
        document.addEventListener('deviceready', onDeviceReady, false);
        
        function onDeviceReady() {
            console.log('Cordova is ready!');
            initializeApp();
        }
        
        // Initialize app
        function initializeApp() {
            console.log('Initializing OHW Mobile App...');
            loadDevices();
            loadPerformance();
            initializeMap();
        }
        
        // Tab navigation
        function showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remove active class from all nav tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked nav tab
            event.target.classList.add('active');
        }
        
        // Initialize map
        function initializeMap() {
            if (typeof L !== 'undefined') {
                const map = L.map('map').setView([0, 0], 2);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);
                
                // Store map reference
                window.ohwMap = map;
            }
        }
        
        // Load devices
        function loadDevices() {
            // Simulate loading devices
            setTimeout(() => {
                const deviceSelect = document.getElementById('deviceSelect');
                const deviceList = document.getElementById('deviceList');
                
                const devices = [
                    { id: 1, name: 'Device 1', imei: '123456789', status: 'online' },
                    { id: 2, name: 'Device 2', imei: '987654321', status: 'offline' }
                ];
                
                // Populate device select
                deviceSelect.innerHTML = '<option value="">Select a device</option>' +
                    devices.map(device => `<option value="${device.id}">${device.name} (${device.imei})</option>`).join('');
                
                // Populate device list
                deviceList.innerHTML = devices.map(device => `
                    <div style="padding: 10px; border-bottom: 1px solid #eee;">
                        <div style="display: flex; align-items: center;">
                            <span class="status-indicator status-${device.status}"></span>
                            <strong>${device.name}</strong>
                        </div>
                        <div style="color: #666; font-size: 12px;">IMEI: ${device.imei}</div>
                    </div>
                `).join('');
            }, 1000);
        }
        
        // Load performance data
        function loadPerformance() {
            setTimeout(() => {
                const performanceStats = document.getElementById('performanceStats');
                performanceStats.innerHTML = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                            <div style="font-size: 24px; font-weight: bold; color: #667eea;">85%</div>
                            <div style="font-size: 12px; color: #666;">CPU Usage</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                            <div style="font-size: 24px; font-weight: bold; color: #667eea;">2.1GB</div>
                            <div style="font-size: 12px; color: #666;">Memory</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                            <div style="font-size: 24px; font-weight: bold; color: #667eea;">67%</div>
                            <div style="font-size: 12px; color: #666;">Battery</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                            <div style="font-size: 24px; font-weight: bold; color: #667eea;">5</div>
                            <div style="font-size: 12px; color: #666;">Active Devices</div>
                        </div>
                    </div>
                `;
            }, 1000);
        }
        
        // Tracking functions
        function startTracking() {
            const deviceId = document.getElementById('deviceSelect').value;
            if (!deviceId) {
                alert('Please select a device first');
                return;
            }
            alert('Tracking started for device ' + deviceId);
        }
        
        function stopTracking() {
            alert('Tracking stopped');
        }
        
        // Device functions
        function addDevice() {
            alert('Add device functionality');
        }
        
        // Export functions
        function exportData() {
            const format = document.getElementById('exportFormat').value;
            alert('Exporting data in ' + format.toUpperCase() + ' format...');
        }
        
        // Sync functions
        function syncWithPeer() {
            const peerUrl = document.getElementById('peerUrl').value;
            if (!peerUrl) {
                alert('Please enter peer URL');
                return;
            }
            alert('Syncing with peer: ' + peerUrl);
        }
        
        // Data functions
        function createBackup() {
            alert('Creating backup...');
        }
        
        function restoreBackup() {
            alert('Restoring backup...');
        }
        
        function clearData() {
            if (confirm('Are you sure you want to clear all data?')) {
                alert('Data cleared');
            }
        }
        
        // Initialize when DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            // If not running in Cordova, initialize anyway
            if (typeof cordova === 'undefined') {
                console.log('Running in browser mode');
                initializeApp();
            }
        });
    </script>
</body>
</html>
EOF

# Create config.xml for Cordova
echo "⚙️  Creating Cordova configuration..."
cat > config.xml << 'EOF'
<?xml version='1.0' encoding='utf-8'?>
<widget id="com.ohw.mobile" version="1.0.0" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
    <name>OHW Mobile</name>
    <description>OHW Mobile Application - Galileo Sky Parser</description>
    <author email="dev@ohw.com" href="http://ohw.com">
        OHW Team
    </author>
    <content src="index.html" />
    <access origin="*" />
    <allow-intent href="http://*/*" />
    <allow-intent href="https://*/*" />
    <allow-intent href="tel:*" />
    <allow-intent href="sms:*" />
    <allow-intent href="mailto:*" />
    <allow-intent href="geo:*" />
    <platform name="android">
        <allow-intent href="market:*" />
        <preference name="android-minSdkVersion" value="22" />
        <preference name="android-targetSdkVersion" value="33" />
    </platform>
    <platform name="ios">
        <allow-intent href="itms:*" />
        <allow-intent href="itms-apps:*" />
    </platform>
    <plugin id="cordova-plugin-device" spec="~2.1.0" />
    <plugin id="cordova-plugin-network-information" spec="~3.0.0" />
    <plugin id="cordova-plugin-geolocation" spec="~5.0.0" />
    <plugin id="cordova-plugin-file" spec="~7.0.0" />
    <plugin id="cordova-plugin-inappbrowser" spec="~5.0.0" />
</widget>
EOF

# Add required plugins
echo "🔌 Adding Cordova plugins..."
cordova plugin add cordova-plugin-device
cordova plugin add cordova-plugin-network-information
cordova plugin add cordova-plugin-geolocation
cordova plugin add cordova-plugin-file
cordova plugin add cordova-plugin-inappbrowser

# Build the project
echo "🔨 Building Android project..."
cordova build android

# Check if build was successful
if [ -f "platforms/android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo ""
    echo "✅ APK created successfully!"
    echo "📱 APK location: platforms/android/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Install the APK on your Android device"
    echo "2. Enable 'Install from unknown sources' in Android settings"
    echo "3. Transfer the APK to your device and install"
    echo ""
    echo "📋 To create a release APK:"
    echo "   cordova build android --release"
    echo ""
    echo "🔧 To open in Android Studio for further customization:"
    echo "   cordova platform add android"
    echo "   cordova prepare android"
    echo "   npx cap open android"
else
    echo "❌ APK build failed. Please check the error messages above."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Make sure Android SDK is installed"
    echo "2. Set ANDROID_HOME environment variable"
    echo "3. Install Android build tools"
    echo "4. Accept Android SDK licenses: sdkmanager --licenses"
fi

echo ""
echo "📚 For more information:"
echo "   - Cordova docs: https://cordova.apache.org/docs/"
echo "   - Android setup: https://cordova.apache.org/docs/en/latest/guide/platforms/android/"
