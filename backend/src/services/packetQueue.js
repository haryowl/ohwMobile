// backend/src/services/packetQueue.js
const EventEmitter = require('events');
const logger = require('../utils/logger');

class PacketQueue extends EventEmitter {
    constructor() {
        super();
        this.queue = [];
        this.processing = new Set();
        this.maxRetries = 3;
        this.maxConcurrent = 5;
        this.isProcessing = false;
    }

    // Add packet to queue
    add(packet, priority = 0) {
        const queueItem = {
            id: Date.now() + Math.random(),
            packet,
            priority,
            retries: 0,
            timestamp: new Date(),
            addedAt: Date.now()
        };

        this.queue.push(queueItem);
        this.queue.sort((a, b) => b.priority - a.priority); // Higher priority first

        this.emit('queued', queueItem);
        this.processQueue();

        return queueItem.id;
    }

    // Process queue
    async processQueue() {
        if (this.isProcessing || this.processing.size >= this.maxConcurrent) {
            return;
        }

        this.isProcessing = true;

        while (this.queue.length > 0 && this.processing.size < this.maxConcurrent) {
            const item = this.queue.shift();
            if (!item) continue;

            this.processing.add(item.id);
            this.processItem(item);
        }

        this.isProcessing = false;
    }

    // Process individual item
    async processItem(item) {
        const startTime = Date.now();

        try {
            // Simulate packet processing
            await this.processPacket(item.packet);
            
            const processingTime = Date.now() - startTime;
            this.emit('processed', item, processingTime);
            
            logger.info('Packet processed successfully', {
                packetId: item.id,
                processingTime,
                retries: item.retries
            });

        } catch (error) {
            item.retries++;
            
            if (item.retries <= this.maxRetries) {
                // Re-queue with lower priority
                item.priority = Math.max(0, item.priority - 1);
                this.queue.push(item);
                this.queue.sort((a, b) => b.priority - a.priority);
                
                logger.warn('Packet processing failed, retrying', {
                    packetId: item.id,
                    retries: item.retries,
                    error: error.message
                });
            } else {
                this.emit('failed', item, error);
                logger.error('Packet processing failed permanently', {
                    packetId: item.id,
                    retries: item.retries,
                    error: error.message
                });
            }
        } finally {
            this.processing.delete(item.id);
            this.processQueue(); // Continue processing
        }
    }

    // Process packet (placeholder implementation)
    async processPacket(packet) {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        
        // Simulate occasional failures
        if (Math.random() < 0.1) {
            throw new Error('Simulated processing error');
        }
    }

    // Get queue statistics
    getStats() {
        return {
            queueSize: this.queue.length,
            processingCount: this.processing.size,
            isProcessing: this.isProcessing,
            maxConcurrent: this.maxConcurrent,
            maxRetries: this.maxRetries
        };
    }

    // Clear queue
    clear() {
        this.queue = [];
        this.processing.clear();
        this.isProcessing = false;
        this.emit('cleared');
    }

    // Get queue length
    get length() {
        return this.queue.length;
    }

    // Check if queue is empty
    get isEmpty() {
        return this.queue.length === 0;
    }

    // Check if queue is processing
    get isCurrentlyProcessing() {
        return this.isProcessing || this.processing.size > 0;
    }
}

// Create singleton instance
const packetQueue = new PacketQueue();

module.exports = packetQueue;
