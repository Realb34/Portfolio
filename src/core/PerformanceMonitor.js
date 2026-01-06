/**
 * PerformanceMonitor - Performance tracking and quality scaling
 * Monitors FPS, frame time, and automatically adjusts quality settings
 *
 * @enterprise-pattern Singleton
 * @responsibility Performance monitoring, quality management
 */

import { EventBus } from './EventBus.js';

export class PerformanceMonitor {
    static instance = null;

    /**
     * Singleton accessor
     * @returns {PerformanceMonitor}
     */
    static getInstance() {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    constructor() {
        if (PerformanceMonitor.instance) {
            throw new Error('PerformanceMonitor is a singleton. Use getInstance()');
        }

        this.eventBus = EventBus.getInstance();

        // Performance metrics
        this.fps = 60;
        this.frameTime = 0;
        this.lastTime = performance.now();
        this.frames = 0;
        this.fpsUpdateInterval = 1000; // Update FPS every second
        this.lastFpsUpdate = performance.now();

        // Quality levels
        this.qualityLevels = {
            HIGH: { pixelRatio: 2, shadows: true, particles: 1000, antialiasing: true },
            MEDIUM: { pixelRatio: 1.5, shadows: true, particles: 500, antialiasing: true },
            LOW: { pixelRatio: 1, shadows: false, particles: 200, antialiasing: false }
        };

        this.currentQuality = 'HIGH';

        // Performance thresholds
        this.targetFPS = 60;
        this.minAcceptableFPS = 30;
        this.autoQualityAdjust = true;

        // Frame time tracking for averaging
        this.frameTimes = [];
        this.maxFrameTimeSamples = 60;

        // Memory tracking
        this.memoryWarningThreshold = 0.8; // 80% of available memory
    }

    /**
     * Begin frame timing
     */
    begin() {
        this.beginTime = performance.now();
    }

    /**
     * End frame timing and update metrics
     */
    end() {
        const currentTime = performance.now();
        this.frameTime = currentTime - this.beginTime;
        this.frames++;

        // Track frame times
        this.frameTimes.push(this.frameTime);
        if (this.frameTimes.length > this.maxFrameTimeSamples) {
            this.frameTimes.shift();
        }

        // Update FPS
        if (currentTime - this.lastFpsUpdate >= this.fpsUpdateInterval) {
            this.fps = Math.round((this.frames * 1000) / (currentTime - this.lastFpsUpdate));
            this.frames = 0;
            this.lastFpsUpdate = currentTime;

            // Auto quality adjustment
            if (this.autoQualityAdjust) {
                this.adjustQuality();
            }

            // Emit FPS update
            this.eventBus.emit('performance:fps', { fps: this.fps });
        }

        this.lastTime = currentTime;
    }

    /**
     * Get current FPS
     * @returns {number}
     */
    getFPS() {
        return this.fps;
    }

    /**
     * Get average frame time
     * @returns {number} Average frame time in ms
     */
    getAverageFrameTime() {
        if (this.frameTimes.length === 0) return 0;
        const sum = this.frameTimes.reduce((a, b) => a + b, 0);
        return sum / this.frameTimes.length;
    }

    /**
     * Get current quality level
     * @returns {string}
     */
    getQuality() {
        return this.currentQuality;
    }

    /**
     * Set quality level
     * @param {string} quality - 'HIGH', 'MEDIUM', or 'LOW'
     */
    setQuality(quality) {
        if (!this.qualityLevels[quality]) {
            console.warn(`Invalid quality level: ${quality}`);
            return;
        }

        this.currentQuality = quality;
        this.eventBus.emit('performance:quality-changed', {
            quality,
            settings: this.qualityLevels[quality]
        });
    }

    /**
     * Get quality settings
     * @returns {Object}
     */
    getQualitySettings() {
        return this.qualityLevels[this.currentQuality];
    }

    /**
     * Automatically adjust quality based on performance
     */
    adjustQuality() {
        const avgFrameTime = this.getAverageFrameTime();
        const currentFPS = this.fps;

        // Downgrade quality if performance is poor
        if (currentFPS < this.minAcceptableFPS && avgFrameTime > 33) { // 33ms = ~30fps
            if (this.currentQuality === 'HIGH') {
                this.setQuality('MEDIUM');
                console.log('⚠️ Quality downgraded to MEDIUM (FPS:', currentFPS, ')');
            } else if (this.currentQuality === 'MEDIUM') {
                this.setQuality('LOW');
                console.log('⚠️ Quality downgraded to LOW (FPS:', currentFPS, ')');
            }
        }

        // Upgrade quality if performance is good
        if (currentFPS >= this.targetFPS && avgFrameTime < 16) { // 16ms = 60fps
            if (this.currentQuality === 'LOW') {
                this.setQuality('MEDIUM');
                console.log('✅ Quality upgraded to MEDIUM (FPS:', currentFPS, ')');
            } else if (this.currentQuality === 'MEDIUM') {
                this.setQuality('HIGH');
                console.log('✅ Quality upgraded to HIGH (FPS:', currentFPS, ')');
            }
        }
    }

    /**
     * Enable/disable automatic quality adjustment
     * @param {boolean} enabled
     */
    setAutoQualityAdjust(enabled) {
        this.autoQualityAdjust = enabled;
    }

    /**
     * Check memory usage (if available)
     * @returns {Object|null}
     */
    getMemoryInfo() {
        if (!performance.memory) {
            return null;
        }

        const memory = performance.memory;
        const usedMemoryMB = memory.usedJSHeapSize / 1048576;
        const totalMemoryMB = memory.totalJSHeapSize / 1048576;
        const limitMemoryMB = memory.jsHeapSizeLimit / 1048576;

        const usagePercentage = usedMemoryMB / limitMemoryMB;

        // Emit warning if memory usage is high
        if (usagePercentage > this.memoryWarningThreshold) {
            this.eventBus.emit('performance:memory-warning', {
                usedMemoryMB,
                totalMemoryMB,
                limitMemoryMB,
                usagePercentage
            });
        }

        return {
            used: usedMemoryMB.toFixed(2),
            total: totalMemoryMB.toFixed(2),
            limit: limitMemoryMB.toFixed(2),
            usagePercentage: (usagePercentage * 100).toFixed(2)
        };
    }

    /**
     * Get performance report
     * @returns {Object}
     */
    getReport() {
        return {
            fps: this.fps,
            avgFrameTime: this.getAverageFrameTime().toFixed(2),
            quality: this.currentQuality,
            qualitySettings: this.getQualitySettings(),
            memory: this.getMemoryInfo()
        };
    }

    /**
     * Reset performance metrics
     */
    reset() {
        this.fps = 60;
        this.frameTime = 0;
        this.frames = 0;
        this.frameTimes = [];
        this.lastFpsUpdate = performance.now();
        this.lastTime = performance.now();
    }
}
