import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const OfflineMapLayer = ({ offlineData, showOfflineIndicator = true }) => {
  const map = useMap();
  const gridLayerRef = useRef(null);
  const deviceMarkersRef = useRef([]);

  useEffect(() => {
    // Create a custom layer for the offline grid
    const OfflineGridLayer = L.Layer.extend({
      onAdd: function(map) {
        this._map = map;
        this._container = L.DomUtil.create('div', 'offline-grid-layer');
        this._container.style.position = 'absolute';
        this._container.style.top = '0';
        this._container.style.left = '0';
        this._container.style.width = '100%';
        this._container.style.height = '100%';
        this._container.style.pointerEvents = 'none';
        this._container.style.zIndex = '1';
        
        // Add to overlay pane so it's below markers
        map.getPanes().overlayPane.appendChild(this._container);
        this._redraw();
        
        map.on('viewreset', this._redraw, this);
        map.on('zoom', this._redraw, this);
        map.on('move', this._redraw, this);
      },

      onRemove: function(map) {
        if (this._container && this._container.parentNode) {
          this._container.parentNode.removeChild(this._container);
        }
        map.off('viewreset', this._redraw, this);
        map.off('zoom', this._redraw, this);
        map.off('move', this._redraw, this);
      },

      _redraw: function() {
        if (!this._container) return;

        this._container.innerHTML = '';
        const bounds = this._map.getBounds();
        const zoom = this._map.getZoom();
        
        // Create grid lines
        this._drawGrid(bounds, zoom);
        
        // Create coordinate labels
        this._drawCoordinates(bounds, zoom);
        
        // Add offline indicator
        if (showOfflineIndicator) {
          this._drawOfflineIndicator();
        }
      },

      _drawGrid: function(bounds, zoom) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = this._map.getSize();
        
        canvas.width = size.x;
        canvas.height = size.y;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '1';
        
        this._container.appendChild(canvas);

        // Calculate grid spacing based on zoom level
        const gridSpacing = this._getGridSpacing(zoom);
        
        // Draw vertical lines (longitude)
        const startLng = Math.floor(bounds.getWest() / gridSpacing) * gridSpacing;
        const endLng = Math.ceil(bounds.getEast() / gridSpacing) * gridSpacing;
        
        for (let lng = startLng; lng <= endLng; lng += gridSpacing) {
          const startPoint = this._map.latLngToLayerPoint([bounds.getSouth(), lng]);
          const endPoint = this._map.latLngToLayerPoint([bounds.getNorth(), lng]);
          
          ctx.beginPath();
          ctx.strokeStyle = '#e0e0e0';
          ctx.lineWidth = 1;
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(endPoint.x, endPoint.y);
          ctx.stroke();
        }

        // Draw horizontal lines (latitude)
        const startLat = Math.floor(bounds.getSouth() / gridSpacing) * gridSpacing;
        const endLat = Math.ceil(bounds.getNorth() / gridSpacing) * gridSpacing;
        
        for (let lat = startLat; lat <= endLat; lat += gridSpacing) {
          const startPoint = this._map.latLngToLayerPoint([lat, bounds.getWest()]);
          const endPoint = this._map.latLngToLayerPoint([lat, bounds.getEast()]);
          
          ctx.beginPath();
          ctx.strokeStyle = '#e0e0e0';
          ctx.lineWidth = 1;
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(endPoint.x, endPoint.y);
          ctx.stroke();
        }
      },

      _drawCoordinates: function(bounds, zoom) {
        const gridSpacing = this._getGridSpacing(zoom);
        const fontSize = Math.max(10, Math.min(14, 12 + zoom - 10));
        
        // Draw longitude labels (vertical)
        const startLng = Math.floor(bounds.getWest() / gridSpacing) * gridSpacing;
        const endLng = Math.ceil(bounds.getEast() / gridSpacing) * gridSpacing;
        
        for (let lng = startLng; lng <= endLng; lng += gridSpacing) {
          const point = this._map.latLngToLayerPoint([bounds.getCenter().lat, lng]);
          const label = document.createElement('div');
          label.textContent = `${lng.toFixed(2)}°`;
          label.style.position = 'absolute';
          label.style.left = `${point.x + 5}px`;
          label.style.top = '10px';
          label.style.fontSize = `${fontSize}px`;
          label.style.color = '#666';
          label.style.fontWeight = 'bold';
          label.style.pointerEvents = 'none';
          label.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
          label.style.padding = '2px 4px';
          label.style.borderRadius = '2px';
          label.style.zIndex = '2';
          
          this._container.appendChild(label);
        }

        // Draw latitude labels (horizontal)
        const startLat = Math.floor(bounds.getSouth() / gridSpacing) * gridSpacing;
        const endLat = Math.ceil(bounds.getNorth() / gridSpacing) * gridSpacing;
        
        for (let lat = startLat; lat <= endLat; lat += gridSpacing) {
          const point = this._map.latLngToLayerPoint([lat, bounds.getCenter().lng]);
          const label = document.createElement('div');
          label.textContent = `${lat.toFixed(2)}°`;
          label.style.position = 'absolute';
          label.style.left = '10px';
          label.style.top = `${point.y + 5}px`;
          label.style.fontSize = `${fontSize}px`;
          label.style.color = '#666';
          label.style.fontWeight = 'bold';
          label.style.pointerEvents = 'none';
          label.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
          label.style.padding = '2px 4px';
          label.style.borderRadius = '2px';
          label.style.zIndex = '2';
          
          this._container.appendChild(label);
        }
      },

      _drawOfflineIndicator: function() {
        const indicator = document.createElement('div');
        indicator.innerHTML = `
          <div style="
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255, 193, 7, 0.9);
            color: #000;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          ">
            📡 Offline Grid View
          </div>
        `;
        this._container.appendChild(indicator);
      },

      _getGridSpacing: function(zoom) {
        // Adjust grid spacing based on zoom level
        if (zoom >= 15) return 0.01; // 0.01 degrees (roughly 1km)
        if (zoom >= 12) return 0.1;  // 0.1 degrees (roughly 10km)
        if (zoom >= 8) return 1;     // 1 degree (roughly 100km)
        if (zoom >= 4) return 5;     // 5 degrees
        return 10;                   // 10 degrees
      }
    });

    // Add the offline grid layer to the map
    gridLayerRef.current = new OfflineGridLayer();
    map.addLayer(gridLayerRef.current);

    return () => {
      if (gridLayerRef.current) {
        map.removeLayer(gridLayerRef.current);
      }
    };
  }, [map, showOfflineIndicator]);

  // Handle offline data and device markers
  useEffect(() => {
    if (!offlineData || !map) return;

    // Clear existing device markers
    deviceMarkersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    deviceMarkersRef.current = [];

    // Add device markers from offline data
    if (offlineData.devices && Array.isArray(offlineData.devices)) {
      offlineData.devices.forEach(device => {
        if (device.lastLocation && device.lastLocation.latitude && device.lastLocation.longitude) {
          const marker = L.marker([device.lastLocation.latitude, device.lastLocation.longitude], {
            icon: L.divIcon({
              className: 'offline-device-marker',
              html: `
                <div style="
                  background: #ff6b6b;
                  border: 2px solid white;
                  border-radius: 50%;
                  width: 20px;
                  height: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-size: 12px;
                  font-weight: bold;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">
                  📱
                </div>
              `,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })
          });

          // Create popup with device information
          const popupContent = `
            <div style="min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: #333;">${device.name || device.imei || 'Unknown Device'}</h4>
              <p style="margin: 4px 0; font-size: 12px;">
                <strong>IMEI:</strong> ${device.imei || 'N/A'}
              </p>
              <p style="margin: 4px 0; font-size: 12px;">
                <strong>Last Seen:</strong> ${device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'N/A'}
              </p>
              <p style="margin: 4px 0; font-size: 12px;">
                <strong>Records:</strong> ${device.totalRecords || 0}
              </p>
              <p style="margin: 4px 0; font-size: 12px;">
                <strong>Coordinates:</strong><br>
                ${device.lastLocation.latitude.toFixed(6)}, ${device.lastLocation.longitude.toFixed(6)}
              </p>
              <div style="
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 4px;
                padding: 4px;
                margin-top: 8px;
                font-size: 11px;
                color: #856404;
              ">
                📡 Offline Data
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);
          marker.addTo(map);
          deviceMarkersRef.current.push(marker);
        }
      });
    }

    // Add record markers if available
    if (offlineData.records && Array.isArray(offlineData.records)) {
      // Group records by device and show recent locations
      const deviceRecords = {};
      
      offlineData.records.forEach(record => {
        if (record.deviceImei && record.latitude && record.longitude) {
          if (!deviceRecords[record.deviceImei]) {
            deviceRecords[record.deviceImei] = [];
          }
          deviceRecords[record.deviceImei].push(record);
        }
      });

      // Show recent locations for each device
      Object.entries(deviceRecords).forEach(([imei, records]) => {
        // Sort by timestamp and take the most recent
        const recentRecords = records
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5); // Show last 5 locations

        recentRecords.forEach((record, index) => {
          const marker = L.circleMarker([record.latitude, record.longitude], {
            radius: 6 - index, // Smaller circles for older records
            fillColor: '#667eea',
            color: '#fff',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.6
          });

          const popupContent = `
            <div style="min-width: 180px;">
              <h4 style="margin: 0 0 8px 0; color: #333;">Device: ${imei}</h4>
              <p style="margin: 4px 0; font-size: 12px;">
                <strong>Time:</strong> ${new Date(record.timestamp).toLocaleString()}
              </p>
              <p style="margin: 4px 0; font-size: 12px;">
                <strong>Coordinates:</strong><br>
                ${record.latitude.toFixed(6)}, ${record.longitude.toFixed(6)}
              </p>
              ${record.speed ? `<p style="margin: 4px 0; font-size: 12px;"><strong>Speed:</strong> ${record.speed} km/h</p>` : ''}
              <div style="
                background: #d1ecf1;
                border: 1px solid #bee5eb;
                border-radius: 4px;
                padding: 4px;
                margin-top: 8px;
                font-size: 11px;
                color: #0c5460;
              ">
                📊 Historical Record ${index + 1}
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);
          marker.addTo(map);
          deviceMarkersRef.current.push(marker);
        });
      });
    }

    // Cleanup function
    return () => {
      deviceMarkersRef.current.forEach(marker => {
        map.removeLayer(marker);
      });
      deviceMarkersRef.current = [];
    };
  }, [offlineData, map]);

  return null;
};

export default OfflineMapLayer; 