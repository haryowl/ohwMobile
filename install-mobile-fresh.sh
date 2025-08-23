#!/bin/bash

# 🛰️ OHW Mobile - Fresh Mobile Installation Script
# Complete installation for new Android phones with Termux
# Single command: curl -s https://raw.githubusercontent.com/haryowl/ohw/main/install-mobile-fresh.sh | bash

set -e

echo "========================================"
echo "  OHW Mobile - Fresh Installation"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo ""
print_info "Step 1: Checking prerequisites..."

# Check if running in Termux
if [ ! -d "/data/data/com.termux" ]; then
    print_error "This script must be run in Termux on Android"
    echo "Please install Termux from F-Droid or Google Play Store"
    exit 1
fi

print_status "Termux detected"

echo ""
print_info "Step 2: Fixing package configuration..."

# Fix any stuck package configurations
echo "N" | dpkg --configure -a 2>/dev/null || true

echo ""
print_info "Step 3: Updating package list..."
pkg update -y

echo ""
print_info "Step 4: Installing required packages..."
pkg install -y nodejs git sqlite wget curl

echo ""
print_info "Step 5: Verifying installations..."
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "Git version: $(git --version)"

echo ""
print_info "Step 6: Cleaning up any existing installations..."

# Remove any existing installations
cd ~
if [ -d "ohwMobile" ]; then
    print_warning "Removing old ohwMobile directory..."
    rm -rf ohwMobile
fi

if [ -d "ohw" ]; then
    print_warning "Removing old ohw directory..."
    rm -rf ohw
fi

if [ -d "galileosky-parser" ]; then
    print_warning "Removing old galileosky-parser directory..."
    rm -rf galileosky-parser
fi

# Remove old management scripts
rm -f ~/ohw-*.sh
rm -f ~/galileosky-*.sh

echo ""
print_info "Step 7: Creating OHW Mobile application..."

# Create project directory
mkdir -p ~/ohwMobile
cd ~/ohwMobile

# Create package.json
cat > package.json << 'EOF'
{
  "name": "ohw-mobile",
  "version": "1.0.0",
  "description": "OHW Mobile Application for Galileosky Parser",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js --dev"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sqlite3": "^5.1.6",
    "cors": "^2.8.5",
    "ws": "^8.14.2",
    "body-parser": "^1.20.2",
    "multer": "^1.4.5-lts.1",
    "moment": "^2.29.4",
    "uuid": "^9.0.1"
  },
  "keywords": ["galileosky", "iot", "tracking", "mobile"],
  "author": "OHW Team",
  "license": "MIT"
}
EOF

# Create server.js
cat > server.js << 'EOF'
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Create data directory
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new sqlite3.Database(path.join(dataDir, 'mobile.db'));

// Create tables
db.serialize(() => {
    // Devices table
    db.run(`CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        imei TEXT UNIQUE,
        name TEXT,
        status TEXT DEFAULT 'offline',
        last_seen DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Records table
    db.run(`CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id INTEGER,
        latitude REAL,
        longitude REAL,
        altitude REAL,
        speed REAL,
        course REAL,
        timestamp DATETIME,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (id)
    )`);

    // Settings table
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// API Routes

// Get all devices
app.get('/api/devices', (req, res) => {
    db.all('SELECT * FROM devices ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Add device
app.post('/api/devices', (req, res) => {
    const { imei, name } = req.body;
    if (!imei) {
        res.status(400).json({ error: 'IMEI is required' });
        return;
    }
    
    db.run('INSERT INTO devices (imei, name) VALUES (?, ?)', [imei, name || imei], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, imei, name: name || imei });
    });
});

// Update device
app.put('/api/devices/:id', (req, res) => {
    const { id } = req.params;
    const { imei, name, status } = req.body;
    
    db.run('UPDATE devices SET imei = ?, name = ?, status = ? WHERE id = ?', 
           [imei, name, status, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, changes: this.changes });
    });
});

// Delete device
app.delete('/api/devices/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM devices WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, changes: this.changes });
    });
});

// Get device records
app.get('/api/records/:deviceId', (req, res) => {
    const { deviceId } = req.params;
    const limit = req.query.limit || 100;
    
    db.all('SELECT * FROM records WHERE device_id = ? ORDER BY timestamp DESC LIMIT ?', 
           [deviceId, limit], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Add record
app.post('/api/records', (req, res) => {
    const { device_id, latitude, longitude, altitude, speed, course, timestamp, data } = req.body;
    
    db.run(`INSERT INTO records (device_id, latitude, longitude, altitude, speed, course, timestamp, data) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
           [device_id, latitude, longitude, altitude, speed, course, timestamp, data], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID });
    });
});

// Get system status
app.get('/api/status', (req, res) => {
    const status = {
        server: 'running',
        port: PORT,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        platform: process.platform,
        node_version: process.version
    };
    res.json(status);
});

// Mobile interface route
app.get('/mobile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mobile.html'));
});

// Root route
app.get('/', (req, res) => {
    res.redirect('/mobile');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 OHW Mobile Server running on http://localhost:${PORT}`);
    console.log(`📱 Mobile Interface: http://localhost:${PORT}/mobile`);
    console.log(`🌐 API Server: http://localhost:${PORT}/api`);
    console.log(`📊 Press Ctrl+C to stop`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close();
    process.exit(0);
});
EOF

# Create public directory and mobile interface
mkdir -p public

# Create mobile.html
cat > public/mobile.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OHW Mobile - Galileosky Parser</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-5px);
        }
        
        .card h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.3rem;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-online {
            background: #4CAF50;
        }
        
        .status-offline {
            background: #f44336;
        }
        
        .device-list {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .device-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        
        .device-item:last-child {
            border-bottom: none;
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            margin: 5px;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        .btn-secondary {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .stat {
            text-align: center;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-label {
            font-size: 0.9rem;
            color: #666;
            margin-top: 5px;
        }
        
        .loading {
            text-align: center;
            padding: 20px;
            color: #666;
        }
        
        .error {
            background: #ffebee;
            color: #c62828;
            padding: 15px;
            border-radius: 10px;
            margin: 10px 0;
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2rem;
            }
            
            .container {
                padding: 15px;
            }
            
            .card {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛰️ OHW Mobile</h1>
            <p>Galileosky Parser - Mobile Interface</p>
        </div>
        
        <div class="dashboard">
            <div class="card">
                <h3>📊 System Status</h3>
                <div id="systemStatus">
                    <div class="loading">Loading system status...</div>
                </div>
            </div>
            
            <div class="card">
                <h3>📱 Devices</h3>
                <div id="deviceList">
                    <div class="loading">Loading devices...</div>
                </div>
                <div style="margin-top: 15px;">
                    <button class="btn" onclick="addDevice()">➕ Add Device</button>
                    <button class="btn btn-secondary" onclick="refreshDevices()">🔄 Refresh</button>
                </div>
            </div>
            
            <div class="card">
                <h3>📈 Quick Actions</h3>
                <div style="text-align: center;">
                    <a href="/api/status" class="btn" target="_blank">📊 API Status</a>
                    <a href="/api/devices" class="btn btn-secondary" target="_blank">📱 Device API</a>
                    <button class="btn" onclick="exportData()">📤 Export Data</button>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h3>🎯 Features</h3>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">📍</div>
                    <div class="stat-label">Live Tracking</div>
                </div>
                <div class="stat">
                    <div class="stat-value">📊</div>
                    <div class="stat-label">Device Management</div>
                </div>
                <div class="stat">
                    <div class="stat-value">📈</div>
                    <div class="stat-label">Data Export</div>
                </div>
                <div class="stat">
                    <div class="stat-value">🔄</div>
                    <div class="stat-label">Peer Sync</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // API base URL
        const API_BASE = '/api';
        
        // Load system status
        async function loadSystemStatus() {
            try {
                const response = await fetch(`${API_BASE}/status`);
                const status = await response.json();
                
                document.getElementById('systemStatus').innerHTML = `
                    <div class="stats">
                        <div class="stat">
                            <div class="stat-value">🟢</div>
                            <div class="stat-label">Server Running</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${status.port}</div>
                            <div class="stat-label">Port</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${Math.round(status.uptime / 60)}m</div>
                            <div class="stat-label">Uptime</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${status.platform}</div>
                            <div class="stat-label">Platform</div>
                        </div>
                    </div>
                `;
            } catch (error) {
                document.getElementById('systemStatus').innerHTML = `
                    <div class="error">Error loading system status: ${error.message}</div>
                `;
            }
        }
        
        // Load devices
        async function loadDevices() {
            try {
                const response = await fetch(`${API_BASE}/devices`);
                const devices = await response.json();
                
                if (devices.length === 0) {
                    document.getElementById('deviceList').innerHTML = `
                        <div style="text-align: center; color: #666; padding: 20px;">
                            No devices found. Add your first device!
                        </div>
                    `;
                    return;
                }
                
                const deviceHtml = devices.map(device => `
                    <div class="device-item">
                        <div>
                            <span class="status-indicator ${device.status === 'online' ? 'status-online' : 'status-offline'}"></span>
                            <strong>${device.name}</strong>
                            <br><small>IMEI: ${device.imei}</small>
                        </div>
                        <div>
                            <button class="btn" onclick="editDevice(${device.id})">✏️</button>
                            <button class="btn btn-secondary" onclick="deleteDevice(${device.id})">🗑️</button>
                        </div>
                    </div>
                `).join('');
                
                document.getElementById('deviceList').innerHTML = deviceHtml;
            } catch (error) {
                document.getElementById('deviceList').innerHTML = `
                    <div class="error">Error loading devices: ${error.message}</div>
                `;
            }
        }
        
        // Add device
        function addDevice() {
            const imei = prompt('Enter device IMEI:');
            if (!imei) return;
            
            const name = prompt('Enter device name (optional):') || imei;
            
            fetch(`${API_BASE}/devices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imei, name })
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
            .catch(error => {
                alert('Error adding device: ' + error.message);
            });
        }
        
        // Edit device
        function editDevice(id) {
            const name = prompt('Enter new device name:');
            if (!name) return;
            
            fetch(`${API_BASE}/devices/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
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
            .catch(error => {
                alert('Error updating device: ' + error.message);
            });
        }
        
        // Delete device
        function deleteDevice(id) {
            if (!confirm('Are you sure you want to delete this device?')) return;
            
            fetch(`${API_BASE}/devices/${id}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert('Error: ' + data.error);
                } else {
                    alert('Device deleted successfully!');
                    loadDevices();
                }
            })
            .catch(error => {
                alert('Error deleting device: ' + error.message);
            });
        }
        
        // Refresh devices
        function refreshDevices() {
            loadDevices();
        }
        
        // Export data
        function exportData() {
            alert('Export feature coming soon!');
        }
        
        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            loadSystemStatus();
            loadDevices();
            
            // Refresh every 30 seconds
            setInterval(() => {
                loadSystemStatus();
                loadDevices();
            }, 30000);
        });
    </script>
</body>
</html>
EOF

echo ""
print_info "Step 8: Installing dependencies..."

# Install npm dependencies
npm install --no-optional --ignore-scripts

echo ""
print_info "Step 9: Creating management scripts..."

# Create start script
cat > ~/ohw-start.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash

echo "🚀 Starting OHW Mobile Application..."

cd ~/ohwMobile

# Check if already running
if [ -f "$HOME/ohw-server.pid" ]; then
    PID=$(cat "$HOME/ohw-server.pid")
    if kill -0 $PID 2>/dev/null; then
        echo "✅ Server is already running (PID: $PID)"
        echo "📱 Access at: http://localhost:3001/mobile"
        exit 0
    fi
fi

# Start server
nohup node server.js > server.log 2>&1 &
echo $! > "$HOME/ohw-server.pid"

echo "✅ Server started successfully!"
echo "📱 Mobile Interface: http://localhost:3001/mobile"
echo "🌐 API Server: http://localhost:3001/api"
echo "📊 Logs: tail -f ~/ohwMobile/server.log"
echo "🛑 Stop: ~/ohw-stop.sh"
EOF

# Create stop script
cat > ~/ohw-stop.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash

echo "🛑 Stopping OHW Mobile Application..."

if [ -f "$HOME/ohw-server.pid" ]; then
    PID=$(cat "$HOME/ohw-server.pid")
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "✅ Server stopped (PID: $PID)"
    else
        echo "⚠️  Server was not running"
    fi
    rm -f "$HOME/ohw-server.pid"
else
    echo "⚠️  No server PID file found"
fi

# Kill any remaining node processes
pkill -f "node server.js" 2>/dev/null || true
echo "✅ All OHW processes stopped"
EOF

# Create status script
cat > ~/ohw-status.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash

echo "📊 OHW Mobile Application Status"
echo "================================"

if [ -f "$HOME/ohw-server.pid" ]; then
    PID=$(cat "$HOME/ohw-server.pid")
    if kill -0 $PID 2>/dev/null; then
        echo "✅ Server is running (PID: $PID)"
        echo "📱 Mobile Interface: http://localhost:3001/mobile"
        echo "🌐 API Server: http://localhost:3001/api"
    else
        echo "❌ Server is not running (stale PID file)"
        rm -f "$HOME/ohw-server.pid"
    fi
else
    echo "❌ Server is not running"
fi

echo ""
echo "🔍 Process Check:"
ps aux | grep -E "(node|ohw)" | grep -v grep || echo "No OHW processes found"

echo ""
echo "🌐 Port Check:"
if command -v ss >/dev/null 2>&1; then
    ss -tulpn | grep :3001 || echo "Port 3001 not in use"
elif command -v netstat >/dev/null 2>&1; then
    netstat -tulpn | grep :3001 || echo "Port 3001 not in use"
else
    echo "Cannot check ports (ss/netstat not available)"
fi
EOF

# Create restart script
cat > ~/ohw-restart.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash

echo "🔄 Restarting OHW Mobile Application..."

~/ohw-stop.sh
sleep 2
~/ohw-start.sh
EOF

# Make scripts executable
chmod +x ~/ohw-*.sh

echo ""
print_info "Step 10: Creating data directories..."

# Create data directories
mkdir -p ~/ohwMobile/data
mkdir -p ~/ohwMobile/logs

echo ""
print_info "🎉 Installation completed successfully!"
echo ""
echo "🎯 Next Steps:"
echo "1. Start the application: ~/ohw-start.sh"
echo "2. Open browser: http://localhost:3001/mobile"
echo "3. Check status: ~/ohw-status.sh"
echo "4. Stop server: ~/ohw-stop.sh"
echo "5. Restart server: ~/ohw-restart.sh"
echo ""
echo "📱 Mobile Interface Features:"
echo "- 📍 Live device tracking and management"
echo "- 📊 Real-time system status monitoring"
echo "- 📈 Device data visualization"
echo "- 🔄 API endpoints for integration"
echo "- 💾 SQLite database for data storage"
echo "- ⚡ Optimized for mobile performance"
echo ""
echo "🚀 Ready to use! Run '~/ohw-start.sh' to begin."
