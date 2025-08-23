# 📱 OHW Mobile Application - Setup Guide

## 🚀 Quick Start

### **Step 1: Install Termux**
1. Download Termux from F-Droid (recommended) or Google Play Store
2. Open Termux and grant necessary permissions

### **Step 2: Install OHW Mobile**
```bash
# Run the installation script
curl -s https://raw.githubusercontent.com/haryowl/ohwMobile/main/install-mobile.sh | bash
```

### **Step 3: Start the Application**
```bash
# Start the application
./ohw-start.sh

# Check status
./ohw-status.sh
```

### **Step 4: Access Mobile Interface**
- **Local:** http://localhost:3001/mobile
- **Network:** http://[YOUR_IP]:3001/mobile
- **Alternative:** http://localhost:3001/mobile-frontend-optimized.html

## 🔧 Management Commands

### **Start Application**
```bash
./ohw-start.sh
```

### **Check Status**
```bash
./ohw-status.sh
```

### **Stop Application**
```bash
./ohw-stop.sh
```

### **Restart Application**
```bash
./ohw-restart.sh
```

### **View Logs**
```bash
tail -f logs/backend.log
```

### **Optimize Mobile Frontend**
```bash
./optimize-mobile.sh
```

## 📱 Mobile Interface Features

### **📍 Live Tracking**
- Real-time device location tracking
- Interactive map with Leaflet
- Device selection and filtering
- Track history visualization

### **📊 Device Management**
- Add, edit, delete devices
- Device status monitoring
- IMEI management
- Device configuration

### **📈 Data Export**
- Multiple export formats (CSV, PFSL, JSON)
- Custom export templates
- Date range filtering
- Auto-export scheduling

### **🔄 Peer Synchronization**
- Peer-to-peer data sync
- Network discovery
- Manual sync controls
- Sync status monitoring

### **💾 Data Management**
- Backup creation and restoration
- Data clearing and maintenance
- Storage optimization
- Data integrity checks

### **⚡ Performance Monitoring**
- Real-time system metrics
- CPU, memory, battery usage
- Network connectivity status
- Active device count

## 🔧 Troubleshooting

### **Common Issues**

#### **1. "ip: command not found"**
```bash
# Install iproute2 package
pkg install -y iproute2

# Or use alternative method (already handled in scripts)
```

#### **2. Port already in use**
```bash
# Check what's using the port
netstat -tlnp | grep :3001

# Kill the process
pkill -f "node.*server.js"
```

#### **3. Permission denied**
```bash
# Make scripts executable
chmod +x *.sh
```

#### **4. Node.js not found**
```bash
# Install Node.js
pkg install -y nodejs
```

#### **5. Mobile interface not loading**
```bash
# Check if server is running
./ohw-status.sh

# Try alternative URL
http://localhost:3001/mobile-frontend-optimized.html
```

### **Network Access Issues**

#### **Access from other devices:**
1. Get your device IP address:
   ```bash
   ./ohw-status.sh
   ```

2. Use the network URL:
   ```
   http://[YOUR_IP]:3001/mobile
   ```

3. Make sure both devices are on the same network

#### **Firewall issues:**
- Check if your device firewall is blocking port 3001
- Try accessing from the same device first

## 📊 Performance Optimization

### **Mobile-Specific Optimizations**
- ✅ Lazy loading for maps
- ✅ Touch-optimized interactions
- ✅ Responsive design
- ✅ Battery-friendly operations
- ✅ Offline capability support

### **Memory Management**
- Automatic cleanup of old data
- Efficient data structures
- Optimized API calls
- Background process management

## 🔒 Security Features

### **Local Network Security**
- All communication stays on local network
- No external data transmission
- Secure peer-to-peer sync
- Data encryption support

### **Access Control**
- Local authentication
- Device-specific permissions
- Secure API endpoints
- Input validation

## 📱 Mobile Browser Compatibility

### **Supported Browsers**
- ✅ Chrome (Android)
- ✅ Firefox (Android)
- ✅ Safari (iOS)
- ✅ Samsung Internet
- ✅ Edge Mobile

### **Recommended Settings**
- Enable JavaScript
- Allow location access (for maps)
- Enable local storage
- Allow camera access (if needed)

## 🚀 Advanced Features

### **Auto-Startup**
```bash
# Create auto-startup script
echo "cd ~/ohwMobile && ./ohw-start.sh" >> ~/.bashrc
```

### **Background Operation**
```bash
# Run in background
nohup ./ohw-start.sh > logs/startup.log 2>&1 &
```

### **Scheduled Backups**
```bash
# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * cd ~/ohwMobile && ./backup-script.sh
```

## 📞 Support

### **Getting Help**
1. Check the status: `./ohw-status.sh`
2. View logs: `tail -f logs/backend.log`
3. Restart application: `./ohw-restart.sh`
4. Check network: `netstat -tlnp`

### **Useful Commands**
```bash
# Check system resources
top

# Check network connectivity
ping google.com

# Check disk space
df -h

# Check memory usage
free -h
```

## 🎯 Next Steps

### **After Setup**
1. ✅ Test all features
2. ✅ Configure devices
3. ✅ Set up data export
4. ✅ Test peer sync
5. ✅ Monitor performance

### **Production Use**
1. Set up auto-startup
2. Configure regular backups
3. Monitor system resources
4. Set up alerts
5. Document custom configurations

---

**📱 Happy tracking with OHW Mobile!**
