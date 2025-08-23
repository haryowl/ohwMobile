@echo off
echo 📱 OHW Mobile - APK Creation Script
echo ===================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is required. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if Java is installed
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Java not found. Android SDK requires Java.
    echo Please install Java JDK 8 or higher.
    echo.
)

REM Install Cordova globally
echo 📦 Installing Apache Cordova...
call npm install -g cordova

REM Create Cordova project
echo 🏗️  Creating Cordova project...
call cordova create ohw-mobile-apk com.ohw.mobile "OHW Mobile"

REM Navigate to project
cd ohw-mobile-apk

REM Add Android platform
echo 🤖 Adding Android platform...
call cordova platform add android

REM Create optimized index.html for Cordova
echo 📝 Creating optimized index.html...
(
echo ^<!DOCTYPE html^>
echo ^<html lang="en"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no"^>
echo     ^<meta http-equiv="Content-Security-Policy" content="default-src 'self' data: gap: https://ssl.gstatic.com 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; media-src *; img-src 'self' data: content:;"^>
echo     ^<meta name="format-detection" content="telephone=no"^>
echo     ^<meta name="msapplication-tap-highlight" content="no"^>
echo     ^<title^>OHW Mobile^</title^>
echo     ^<script src="cordova.js"^>^</script^>
echo     ^<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" /^>
echo     ^<style^>
echo         body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
echo         .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 15px; text-align: center; }
echo         .nav-tabs { display: flex; background: white; border-bottom: 1px solid #ddd; }
echo         .nav-tab { flex: 1; padding: 12px; text-align: center; background: none; border: none; color: #666; cursor: pointer; }
echo         .nav-tab.active { color: #667eea; border-bottom: 3px solid #667eea; font-weight: 600; }
echo         .content { padding: 15px; }
echo         .tab-content { display: none; }
echo         .tab-content.active { display: block; }
echo         .card { background: white; border-radius: 10px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
echo         .btn { background: #667eea; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; margin: 5px; }
echo         #map { height: 300px; border-radius: 10px; margin: 15px 0; }
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<div class="header"^>
echo         ^<h1^>📱 OHW Mobile^</h1^>
echo     ^</div^>
echo     ^<div class="nav-tabs"^>
echo         ^<button class="nav-tab active" onclick="showTab('tracking')"^>📍 Tracking^</button^>
echo         ^<button class="nav-tab" onclick="showTab('devices')"^>📊 Devices^</button^>
echo         ^<button class="nav-tab" onclick="showTab('export')"^>📈 Export^</button^>
echo         ^<button class="nav-tab" onclick="showTab('sync')"^>🔄 Sync^</button^>
echo         ^<button class="nav-tab" onclick="showTab('data')"^>💾 Data^</button^>
echo         ^<button class="nav-tab" onclick="showTab('performance')"^>⚡ Performance^</button^>
echo     ^</div^>
echo     ^<div class="content"^>
echo         ^<div id="tracking" class="tab-content active"^>
echo             ^<div class="card"^>
echo                 ^<h3^>📍 Live Device Tracking^</h3^>
echo                 ^<div id="map"^>^</div^>
echo                 ^<button class="btn" onclick="startTracking()"^>🚀 Start Tracking^</button^>
echo                 ^<button class="btn" onclick="stopTracking()"^>⏹️ Stop Tracking^</button^>
echo             ^</div^>
echo         ^</div^>
echo         ^<div id="devices" class="tab-content"^>
echo             ^<div class="card"^>
echo                 ^<h3^>📊 Device Management^</h3^>
echo                 ^<div id="deviceList"^>Loading devices...^</div^>
echo                 ^<button class="btn" onclick="addDevice()"^>➕ Add Device^</button^>
echo             ^</div^>
echo         ^</div^>
echo         ^<div id="export" class="tab-content"^>
echo             ^<div class="card"^>
echo                 ^<h3^>📈 Data Export^</h3^>
echo                 ^<button class="btn" onclick="exportData()"^>📥 Export Data^</button^>
echo             ^</div^>
echo         ^</div^>
echo         ^<div id="sync" class="tab-content"^>
echo             ^<div class="card"^>
echo                 ^<h3^>🔄 Peer Synchronization^</h3^>
echo                 ^<button class="btn" onclick="syncWithPeer()"^>🔄 Sync Now^</button^>
echo             ^</div^>
echo         ^</div^>
echo         ^<div id="data" class="tab-content"^>
echo             ^<div class="card"^>
echo                 ^<h3^>💾 Data Management^</h3^>
echo                 ^<button class="btn" onclick="createBackup()"^>💾 Create Backup^</button^>
echo                 ^<button class="btn" onclick="restoreBackup()"^>📂 Restore Backup^</button^>
echo                 ^<button class="btn" onclick="clearData()"^>🗑️ Clear Data^</button^>
echo             ^</div^>
echo         ^</div^>
echo         ^<div id="performance" class="tab-content"^>
echo             ^<div class="card"^>
echo                 ^<h3^>⚡ Performance Monitor^</h3^>
echo                 ^<div id="performanceStats"^>Loading performance data...^</div^>
echo             ^</div^>
echo         ^</div^>
echo     ^</div^>
echo     ^<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"^>^</script^>
echo     ^<script^>
echo         document.addEventListener('deviceready', function() { console.log('Cordova ready!'); initializeApp(); }, false);
echo         function showTab(tabName) {
echo             document.querySelectorAll('.tab-content').forEach(tab =^> tab.classList.remove('active'));
echo             document.querySelectorAll('.nav-tab').forEach(tab =^> tab.classList.remove('active'));
echo             document.getElementById(tabName).classList.add('active');
echo             event.target.classList.add('active');
echo         }
echo         function initializeApp() {
echo             console.log('Initializing OHW Mobile App...');
echo             if (typeof L !== 'undefined') {
echo                 const map = L.map('map').setView([0, 0], 2);
echo                 L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
echo             }
echo         }
echo         function startTracking() { alert('Tracking started'); }
echo         function stopTracking() { alert('Tracking stopped'); }
echo         function addDevice() { alert('Add device functionality'); }
echo         function exportData() { alert('Exporting data...'); }
echo         function syncWithPeer() { alert('Syncing with peer...'); }
echo         function createBackup() { alert('Creating backup...'); }
echo         function restoreBackup() { alert('Restoring backup...'); }
echo         function clearData() { if (confirm('Clear all data?')) alert('Data cleared'); }
echo         if (typeof cordova === 'undefined') { initializeApp(); }
echo     ^</script^>
echo ^</body^>
echo ^</html^>
) > www\index.html

REM Add required plugins
echo 🔌 Adding Cordova plugins...
call cordova plugin add cordova-plugin-device
call cordova plugin add cordova-plugin-network-information
call cordova plugin add cordova-plugin-geolocation
call cordova plugin add cordova-plugin-file
call cordova plugin add cordova-plugin-inappbrowser

REM Build the project
echo 🔨 Building Android project...
call cordova build android

REM Check if build was successful
if exist "platforms\android\app\build\outputs\apk\debug\app-debug.apk" (
    echo.
    echo ✅ APK created successfully!
    echo 📱 APK location: platforms\android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo 🎯 Next steps:
    echo 1. Install the APK on your Android device
    echo 2. Enable 'Install from unknown sources' in Android settings
    echo 3. Transfer the APK to your device and install
    echo.
    echo 📋 To create a release APK:
    echo    cordova build android --release
    echo.
    echo 🔧 To open in Android Studio for further customization:
    echo    cordova platform add android
    echo    cordova prepare android
    echo    npx cap open android
) else (
    echo ❌ APK build failed. Please check the error messages above.
    echo.
    echo 🔧 Troubleshooting:
    echo 1. Make sure Android SDK is installed
    echo 2. Set ANDROID_HOME environment variable
    echo 3. Install Android build tools
    echo 4. Accept Android SDK licenses: sdkmanager --licenses
)

echo.
echo 📚 For more information:
echo    - Cordova docs: https://cordova.apache.org/docs/
echo    - Android setup: https://cordova.apache.org/docs/en/latest/guide/platforms/android/
pause
