// backend/src/services/dataAggregator.js

const { Record, Device } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class DataAggregator {
    async getDeviceData(deviceId) {
        try {
            const data = await Record.findAll({
                where: { deviceImei: deviceId },
                order: [['datetime', 'DESC']],
                limit: 100
            });
            return data;
        } catch (error) {
            logger.error('Error getting device data:', error);
            throw error;
        }
    }

    async getDeviceStatistics(deviceId, timeRange) {
        try {
            const endDate = new Date();
            const startDate = new Date(endDate - timeRange);

            const data = await Record.findAll({
                where: {
                    deviceImei: deviceId,
                    datetime: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [['datetime', 'ASC']]
            });

            return this.calculateStatistics(data);
        } catch (error) {
            logger.error('Error getting device statistics:', error);
            throw error;
        }
    }

    async getDashboardData() {
        try {
            const now = new Date();
            const dayAgo = new Date(now - 24 * 60 * 60 * 1000);

            const stats = {
                activeDevices: await Device.count({
                    where: {
                        status: 'active',
                        lastSeen: {
                            [Op.gt]: dayAgo
                        }
                    }
                }),
                totalMessages: await Record.count({
                    where: {
                        datetime: {
                            [Op.gt]: dayAgo
                        }
                    }
                }),
                // Add more statistics as needed
            };

            return stats;
        } catch (error) {
            logger.error('Error getting dashboard data:', error);
            throw error;
        }
    }

    async getRealtimeData() {
        try {
            const latestRecords = await Record.findAll({
                order: [['datetime', 'DESC']],
                limit: 10
            });
            return latestRecords;
        } catch (error) {
            logger.error('Error getting realtime data:', error);
            throw error;
        }
    }

    calculateStatistics(data) {
        const stats = {
            totalPoints: data.length,
            averageSpeed: 0,
            maxSpeed: 0,
            distanceTraveled: 0,
            fuelConsumption: 0,
            engineHours: 0,
            alerts: 0
        };

        let prevPoint = null;
        data.forEach(point => {
            // Update statistics based on point data
            if (point.speed) {
                stats.averageSpeed += point.speed;
                stats.maxSpeed = Math.max(stats.maxSpeed, point.speed);
            }

            if (prevPoint) {
                // Calculate distance between points
                const distance = this.calculateDistance(
                    { latitude: prevPoint.latitude, longitude: prevPoint.longitude },
                    { latitude: point.latitude, longitude: point.longitude }
                );
                stats.distanceTraveled += distance;
            }

            prevPoint = point;
        });

        stats.averageSpeed /= data.length || 1;
        return stats;
    }

    calculateDistance(point1, point2) {
        if (!point1 || !point2) return 0;

        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(point2.latitude - point1.latitude);
        const dLon = this.toRad(point2.longitude - point1.longitude);
        const lat1 = this.toRad(point1.latitude);
        const lat2 = this.toRad(point2.latitude);

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * 
                Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    toRad(value) {
        return value * Math.PI / 180;
    }
}

module.exports = new DataAggregator();
