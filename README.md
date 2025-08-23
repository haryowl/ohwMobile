# 📱 OHW Mobile Application - Galileo Sky Parser

A comprehensive mobile application for IoT device tracking, data management, and real-time monitoring built for Termux on Android devices.

## 🚀 Quick Installation

### **For Fresh Mobile Phone (Android + Termux):**

```bash
# 1. Install Termux from F-Droid or Google Play Store
# 2. Open Termux and run:
curl -s https://raw.githubusercontent.com/haryowl/ohwMobile/main/install-mobile.sh | bash
```

### **Manual Installation:**

```bash
# Update packages
pkg update -y && pkg upgrade -y

# Install dependencies
pkg install -y nodejs git curl wget

# Clone repository
git clone https://github.com/haryowl/ohwMobile.git
cd ohwMobile

# Install dependencies
npm install

# Start application
npm start
```

## 📱 Access Points

- **Mobile Interface:** `http://localhost:3001/mobile`
- **Alternative URL:** `http://localhost:3001/mobile-frontend.html`
- **API Server:** `http://localhost:3001`

## 🎯 Features

### **📍 Live Tracking**
- Real-time device location tracking
- Device path history with map visualization
- Distance calculation and statistics
- Auto-follow and marker controls

### **📊 Device Management**
- Full CRUD operations (Create, Read, Update, Delete)
- Device grouping and categorization
- Real-time status monitoring
- Device data viewing and analysis

### **📈 Data Export**
- Multiple formats: CSV, PFSL, JSON
- Custom export templates with placeholders
- Date/time range filtering
- Device-specific filtering
- Auto-export scheduling

### **🔄 Peer-to-Peer Sync**
- Device synchronization between mobile devices
- Offline data sharing
- Connection management
- Sync statistics and monitoring

### **💾 Backup Management**
- Automated data backup
- Backup restoration
- Backup history and management
- Data clearing and maintenance

### **⚡ Performance Monitoring**
- Real-time CPU, memory, and battery monitoring
- Network status and connection tracking
- System performance metrics
- Adaptive performance modes

## 🛠️ Technical Stack

- **Backend:** Node.js, Express.js, SQLite
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Maps:** Leaflet.js for interactive mapping
- **Database:** SQLite for local storage
- **Real-time:** WebSocket for live updates
- **Platform:** Termux on Android

## 📋 Application Pages

1. **📍 Tracking** - Live device tracking with path history
2. **📊 Devices** - Device management and configuration
3. **📈 Export** - Data export with custom templates
4. **🔄 Peer Sync** - Device synchronization
5. **💾 Data Management** - Backup and restore operations
6. **⚡ Performance** - System monitoring and metrics

## 🔧 Configuration

### **Environment Variables:**
```bash
# Database configuration
DB_PATH=./data/ohw.db

# Server configuration
PORT=3001
HOST=0.0.0.0

# Performance settings
PERFORMANCE_MODE=balanced
AUTO_BACKUP=true
BACKUP_INTERVAL=24h
```

### **Device Configuration:**
- Device name and IMEI management
- Group categorization
- Custom field mapping
- Export template configuration

## 📡 API Endpoints

### **Device Management:**
- `GET /api/devices` - List all devices
- `POST /api/devices` - Create new device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device

### **Data Operations:**
- `GET /api/data/latest` - Get latest data
- `GET /api/data/export` - Export data
- `POST /api/data/backup` - Create backup
- `GET /api/data/backups` - List backups

### **Performance:**
- `GET /api/performance` - System metrics
- `GET /api/management` - Management info

## 🚀 Mobile Features

### **Optimized for Mobile:**
- Touch-friendly interface
- Responsive design
- Offline capability
- Battery optimization
- Storage management

### **Termux Integration:**
- Native Android terminal support
- Background service management
- Auto-startup configuration
- System integration

### **APK Support:**
- Convert to native Android APK
- Install as standalone app
- Access to device features
- Offline functionality

## 🔧 Development

### **Prerequisites:**
- Node.js 16+
- npm or yarn
- Git

### **Setup:**
```bash
# Clone repository
git clone https://github.com/haryowl/ohwMobile.git
cd ohwMobile

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### **Project Structure:**
```
ohwMobile/
├── backend/           # Backend server code
├── mobile-frontend.html  # Mobile interface
├── install-mobile.sh     # Installation script
├── package.json          # Dependencies
└── README.md            # Documentation
```

## 📦 Deployment

### **Termux Deployment:**
```bash
# Install on Termux
curl -s https://raw.githubusercontent.com/haryowl/ohwMobile/main/install-mobile.sh | bash

# Start application
cd ~/ohwMobile
./start-ohw.sh
```

### **Local Development:**
```bash
# Clone and setup
git clone https://github.com/haryowl/ohwMobile.git
cd ohwMobile
npm install
npm start
```

### **APK Creation:**
```bash
# Linux/Mac
chmod +x create-apk.sh
./create-apk.sh

# Windows
create-apk.bat
```

**Prerequisites for APK:**
- Node.js 16+
- Java JDK 8+
- Android SDK
- Android Build Tools

## 🔒 Security

- Local-only access by default
- No external dependencies
- Secure data storage
- Access control for device management

## ⚡ Performance

### **Optimization Features:**
- Adaptive performance modes
- Memory usage optimization
- Battery life management
- Network efficiency
- Storage optimization

### **Monitoring:**
- Real-time performance metrics
- System resource tracking
- Connection monitoring
- Error logging and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

- **Repository:** [https://github.com/haryowl/ohwMobile.git](https://github.com/haryowl/ohwMobile.git)
- **Mobile Interface:** `http://localhost:3001/mobile`
- **Documentation:** Check the README files in the repository

## 🗺️ Roadmap

- [ ] Enhanced offline capabilities
- [ ] Multi-device synchronization
- [ ] Advanced analytics dashboard
- [ ] Cloud backup integration
- [ ] Mobile app wrapper
- [ ] Advanced mapping features
- [ ] Real-time alerts system
- [ ] API rate limiting
- [ ] Enhanced security features

---

**🎉 Ready to track your IoT devices on mobile! Start with the quick installation guide above.** 
