@echo off
echo 🚀 OHW Mobile Application - Local Server
echo ========================================

echo 📦 Installing dependencies...
call npm install

echo 🎨 Installing frontend dependencies...
cd frontend
call npm install

echo 🔨 Building frontend...
call npm run build

echo 🌐 Installing serve...
call npm install -g serve

echo 🚀 Starting local server...
echo ========================================
echo ✅ Server starting!
echo 📱 On your phone, open browser and go to:
echo    http://localhost:3000
echo.
echo 🔗 Or access from your phone via WiFi:
echo    http://[YOUR_COMPUTER_IP]:3000
echo.
echo 📋 To find your computer's IP address:
echo    ipconfig
echo.
echo 🔄 To stop server, press Ctrl+C
echo ========================================

cd ..
serve -s frontend/build -l 3000
