# OHW Mobile Application - Galileo Sky Parser

A comprehensive mobile IoT tracking and telemetry application with enhanced device management, real-time monitoring, and peer-to-peer synchronization capabilities.

## 🌟 Features

### Core Functionality
- **Galileo Sky Protocol Parser**: Advanced IoT device data parsing and processing
- **Real-time Device Tracking**: Live GPS tracking with interactive maps
- **Enhanced Device Management**: Complete CRUD operations with status monitoring
- **Data Export & Analytics**: Multiple export formats including custom SM format (.pfsl)
- **Peer-to-Peer Sync**: Offline data synchronization between mobile devices
- **Performance Optimization**: Adaptive performance modes for mobile devices

### Mobile-Specific Features
- **Progressive Web App (PWA)**: Installable mobile application
- **Offline Support**: Full offline functionality with data caching
- **Mobile Optimizations**: Battery, storage, and performance management
- **Termux Integration**: Android terminal environment support
- **Auto-Export**: Scheduled daily data exports at midnight

## 📱 Mobile Installation

### Quick Install URL
```
https://haryowl.github.io/ohw-enhance/
```

### Installation Steps

1. **Open the URL** in your mobile browser
2. **Add to Home Screen**: 
   - iOS: Tap the share button → "Add to Home Screen"
   - Android: Tap the menu → "Add to Home Screen" or "Install App"
3. **Launch the App** from your home screen

### Alternative Installation Methods

#### Termux (Android)
```bash
# Install Termux from F-Droid
# Run the quick start script
curl -sSL https://raw.githubusercontent.com/haryowl/ohw-enhance/main/termux-quick-start.sh | bash
```

#### Manual Installation
```bash
# Clone the repository
git clone https://github.com/haryowl/ohw-enhance.git
cd ohw-enhance

# Install dependencies
npm install

# Start the application
npm start
```

## 🚀 Quick Start

### For Mobile Users
1. Visit: `https://haryowl.github.io/ohw-enhance/`
2. Install as PWA
3. Configure your devices
4. Start monitoring

### For Developers
```bash
# Clone repository
git clone https://github.com/haryowl/ohw-enhance.git
cd ohw-enhance

# Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install

# Start development servers
npm run dev
```

## 📊 Application Pages

### Main Pages
- **Dashboard** (`/`): Real-time overview with tracking map and status dashboard
- **Device Management** (`/devices`): Complete device CRUD operations
- **Data SM Export** (`/data-sm`): Custom data export with .pfsl format
- **Peer-to-Peer** (`/peer-sync`): Device synchronization
- **Performance** (`/performance`): System monitoring and optimization

### Features by Page

#### Dashboard
- Real-time device statistics
- Interactive tracking map
- Status dashboard with health monitoring
- System performance metrics

#### Device Management
- **Device List**: View all devices with search and filtering
- **Device Configuration**: Advanced settings and field mapping
- **Status Indicators**: Visual status with health scores
- **CRUD Operations**: Create, edit, delete devices
- **Data Export**: CSV export with filtering

#### Data SM Export
- **Custom Field Mapping**: 12 specific fields for SM format
- **Period Filtering**: Date and time range selection
- **Device Filtering**: Export by specific device or all devices
- **Auto-Export**: Daily midnight exports
- **Template Naming**: Customizable filename patterns
- **File Format**: CSV with .pfsl extension

#### Peer-to-Peer Sync
- **Device Discovery**: Find nearby devices
- **Data Synchronization**: Share data between devices
- **Offline Support**: Work without internet connection
- **Conflict Resolution**: Handle data conflicts

#### Performance Dashboard
- **Real-time Monitoring**: FPS, memory, battery, network
- **Adaptive Modes**: Power save, balanced, performance
- **Optimization Controls**: Manual performance adjustments
- **Cache Management**: Storage and memory optimization

## 🔧 Configuration

### Environment Variables
```bash
# Backend Configuration
PORT=3001
NODE_ENV=production
DATABASE_URL=sqlite:./data/app.db

# Frontend Configuration
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
```

### Mobile Configuration
```bash
# Termux Configuration
export ANDROID_HOME=/data/data/com.termux/files/home
export PATH=$PATH:$ANDROID_HOME/.local/bin

# Static IP Setup (for hotspot mode)
./mobile-static-ip-setup.sh
```

## 📁 Project Structure

```
ohw-main/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── services/       # API and utility services
│   │   └── hooks/          # Custom React hooks
│   ├── public/             # Static assets and PWA files
│   └── package.json
├── backend/                 # Node.js backend server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   ├── models/         # Database models
│   │   └── config/         # Configuration files
│   └── package.json
├── mobile-scripts/          # Mobile-specific scripts
├── termux-scripts/          # Termux installation scripts
└── docs/                    # Documentation
```

## 🔌 API Endpoints

### Device Management
- `GET /api/devices` - Get all devices
- `POST /api/devices` - Create new device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device

### Data Export
- `GET /api/data/sm/export` - Export Data SM format
- `POST /api/data/sm/auto-export` - Schedule auto-export
- `DELETE /api/data/sm/auto-export/:jobId` - Cancel auto-export

### Mobile Status
- `GET /api/mobile/status` - Get mobile device status
- `POST /api/mobile/optimize` - Control performance optimization

## 📱 Mobile Features

### Progressive Web App (PWA)
- **Installable**: Add to home screen
- **Offline Support**: Service worker caching
- **Push Notifications**: Real-time alerts
- **Background Sync**: Data synchronization

### Performance Optimization
- **Adaptive Rendering**: Adjusts based on device capabilities
- **Battery Management**: Optimizes for mobile battery life
- **Storage Management**: Efficient data storage
- **Network Optimization**: Reduces data usage

### Offline Capabilities
- **Data Caching**: Stores data locally
- **Offline Maps**: Grid-based mapping when online maps unavailable
- **Sync Queue**: Queues operations for when online
- **Conflict Resolution**: Handles data conflicts

## 🛠️ Development

### Prerequisites
- Node.js 16+
- npm or yarn
- Git

### Development Setup
```bash
# Clone repository
git clone https://github.com/haryowl/ohw-enhance.git
cd ohw-enhance

# Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install

# Start development servers
npm run dev
```

### Building for Production
```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
npm start
```

## 📦 Deployment

### GitHub Pages (Frontend)
```bash
# Build and deploy to GitHub Pages
npm run build
git add -A
git commit -m "Deploy to GitHub Pages"
git push origin main
```

### Mobile Deployment
```bash
# Deploy to mobile devices
./mobile-install.sh
```

## 🔒 Security

- **HTTPS**: Secure connections for all API calls
- **Input Validation**: Server-side validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content Security Policy

## 📈 Performance

### Mobile Optimizations
- **Lazy Loading**: Images and components
- **Virtual Scrolling**: Large data tables
- **Image Compression**: Adaptive image quality
- **Code Splitting**: Reduced bundle size

### Monitoring
- **Real-time Metrics**: FPS, memory, battery
- **Performance Dashboard**: Visual monitoring
- **Auto-optimization**: Adaptive performance modes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [Mobile Setup Guide](TERMUX_INSTALL.md)
- [API Documentation](docs/API.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

### Issues
- Report bugs: [GitHub Issues](https://github.com/haryowl/ohw-enhance/issues)
- Feature requests: [GitHub Discussions](https://github.com/haryowl/ohw-enhance/discussions)

### Community
- **GitHub**: [haryowl/ohw-enhance](https://github.com/haryowl/ohw-enhance)
- **Mobile URL**: https://haryowl.github.io/ohw-enhance/

## 🎯 Roadmap

### Upcoming Features
- [ ] Advanced Analytics Dashboard
- [ ] Machine Learning Predictions
- [ ] Multi-language Support
- [ ] Advanced Alert System
- [ ] Cloud Backup Integration

### Mobile Enhancements
- [ ] Native Mobile App (React Native)
- [ ] Advanced Offline Maps
- [ ] Voice Commands
- [ ] Wearable Integration

---

**Install URL for Mobile**: https://haryowl.github.io/ohw-enhance/

**GitHub Repository**: https://github.com/haryowl/ohw-enhance.git 
