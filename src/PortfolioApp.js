/**
 * PortfolioApp - Main application orchestrator
 * Coordinates all 3D systems and integrates with existing portfolio
 *
 * @enterprise-pattern Facade Pattern
 * @responsibility Application lifecycle, module orchestration
 */

import * as THREE from 'three';
import { SceneManager } from './core/SceneManager.js';
import { EventBus } from './core/EventBus.js';
import { PerformanceMonitor } from './core/PerformanceMonitor.js';
import { CameraController } from './cameras/CameraController.js';
import { LightingSystem } from './lighting/LightingSystem.js';
import { AssetManager } from './loaders/AssetManager.js';
import { HeroScene } from './components/HeroScene.js';

export class PortfolioApp {
    constructor() {
        // Core systems
        this.sceneManager = SceneManager.getInstance();
        this.eventBus = EventBus.getInstance();
        this.performanceMonitor = PerformanceMonitor.getInstance();
        this.assetManager = AssetManager.getInstance();

        // Scene components
        this.camera = null;
        this.cameraController = null;
        this.lightingSystem = null;
        this.heroScene = null;

        // State
        this.isInitialized = false;
        this.isRunning = false;

        // Configuration
        this.config = {
            enableWebGPU: true,
            enableShadows: true,
            enablePostProcessing: false,
            enablePerformanceMonitoring: true,
            targetFPS: 60
        };

        // Bind methods
        this.update = this.update.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    /**
     * Initialize application
     * @param {HTMLElement} container - Container for 3D renderer
     * @returns {Promise<boolean>}
     */
    async initialize(container) {
        if (this.isInitialized) {
            console.warn('PortfolioApp already initialized');
            return true;
        }

        try {
            console.log('🚀 Initializing PortfolioApp...');

            // Initialize scene manager
            await this.sceneManager.initialize(container, {
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
            });

            // Create camera
            this.createCamera();

            // Setup lighting
            this.setupLighting();

            // Load assets
            await this.loadAssets();

            // Initialize hero scene
            await this.initializeHeroScene();

            // Setup event listeners
            this.setupEventListeners();

            // Start render loop
            this.start();

            this.isInitialized = true;
            this.eventBus.emit('app:initialized');

            console.log('✅ PortfolioApp initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize PortfolioApp:', error);
            this.eventBus.emit('app:error', { error });
            return false;
        }
    }

    /**
     * Create and configure camera
     */
    createCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

        // Initial camera position
        this.camera.position.set(0, 0, 15);
        this.camera.lookAt(0, 0, 0);

        // Create camera controller
        this.cameraController = new CameraController(this.camera, {
            parallax: true,
            parallaxStrength: 0.05,
            smoothing: 0.1,
            scrollControlled: true
        });

        // Set active camera in scene manager
        this.sceneManager.setActiveCamera(this.camera);
    }

    /**
     * Setup lighting system
     */
    setupLighting() {
        this.lightingSystem = new LightingSystem(this.sceneManager.scene, {
            showHelpers: false
        });

        // Apply dramatic lighting preset
        this.lightingSystem.applyPreset('DRAMATIC');
    }

    /**
     * Load required assets
     * @returns {Promise}
     */
    async loadAssets() {
        console.log('📦 Loading assets...');

        // Define assets to load (if any)
        const assets = [
            // Add texture/model assets here as needed
            // { type: 'texture', name: 'gradient', url: '/textures/gradient.jpg' }
        ];

        if (assets.length > 0) {
            await this.assetManager.loadAssets(assets);
        }

        console.log('✅ Assets loaded');
    }

    /**
     * Initialize hero scene component
     * @returns {Promise}
     */
    async initializeHeroScene() {
        console.log('🎨 Initializing hero scene...');

        this.heroScene = new HeroScene(this.sceneManager.scene, {
            techStack: [
                { name: 'Python', color: 0x3776ab, shape: 'sphere' },
                { name: 'C++', color: 0x00599c, shape: 'box' },
                { name: 'JavaScript', color: 0xf7df1e, shape: 'octahedron' },
                { name: 'PyTorch', color: 0xee4c2c, shape: 'torus' },
                { name: 'SQL', color: 0x336791, shape: 'cylinder' },
                { name: 'Git', color: 0xf05032, shape: 'dodecahedron' },
                { name: 'HTML/CSS', color: 0xe34c26, shape: 'cone' }
            ]
        });

        await this.heroScene.initialize();
        await this.heroScene.show();

        console.log('✅ Hero scene initialized');
    }

    /**
     * Setup application event listeners
     */
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', this.handleResize);

        // Visibility change (pause when hidden)
        document.addEventListener('visibilitychange', this.handleVisibilityChange);

        // Scroll events
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            this.eventBus.emit('scroll:update', { scrollY });
        });

        // Performance monitoring
        if (this.config.enablePerformanceMonitoring) {
            this.eventBus.on('performance:quality-changed', (data) => {
                console.log(`🎯 Quality changed to ${data.quality}`);
                this.handleQualityChange(data);
            });

            this.eventBus.on('performance:memory-warning', (data) => {
                console.warn('⚠️ Memory usage high:', data);
            });
        }

        // Scene events
        this.eventBus.on('scene:render', ({ time }) => {
            this.update(time);
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (!this.camera) return;

        const aspect = window.innerWidth / window.innerHeight;
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    }

    /**
     * Handle visibility change (tab switching)
     */
    handleVisibilityChange() {
        if (document.hidden) {
            this.pause();
        } else {
            this.resume();
        }
    }

    /**
     * Handle quality change
     * @param {Object} data
     */
    handleQualityChange(data) {
        const settings = data.settings;

        // Update renderer pixel ratio
        if (this.sceneManager.renderer) {
            this.sceneManager.renderer.setPixelRatio(settings.pixelRatio);
        }

        // Update shadows
        if (this.sceneManager.renderer) {
            this.sceneManager.renderer.shadowMap.enabled = settings.shadows;
        }

        // Update particle count in hero scene
        if (this.heroScene && this.heroScene.particleSystem) {
            // Recreate particle system with new count
            // Implementation depends on your needs
        }
    }

    /**
     * Update loop (called each frame)
     * @param {number} time
     */
    update(time) {
        if (!this.isRunning) return;

        const deltaTime = time * 0.001; // Convert to seconds

        // Update camera controller
        if (this.cameraController) {
            this.cameraController.update(deltaTime);
        }

        // Update hero scene
        if (this.heroScene) {
            this.heroScene.update(time);
        }

        // Update lighting helpers
        if (this.lightingSystem) {
            this.lightingSystem.updateHelpers();
        }
    }

    /**
     * Start application
     */
    start() {
        if (this.isRunning) return;

        this.sceneManager.resume();
        this.isRunning = true;
        this.eventBus.emit('app:started');

        console.log('▶️ PortfolioApp started');
    }

    /**
     * Pause application
     */
    pause() {
        if (!this.isRunning) return;

        this.sceneManager.pause();
        this.isRunning = false;
        this.eventBus.emit('app:paused');

        console.log('⏸️ PortfolioApp paused');
    }

    /**
     * Resume application
     */
    resume() {
        if (this.isRunning) return;

        this.sceneManager.resume();
        this.isRunning = true;
        this.eventBus.emit('app:resumed');

        console.log('▶️ PortfolioApp resumed');
    }

    /**
     * Get application stats
     * @returns {Object}
     */
    getStats() {
        return {
            renderer: this.sceneManager.getStats(),
            performance: this.performanceMonitor.getReport(),
            assets: this.assetManager.getStats()
        };
    }

    /**
     * Log stats to console
     */
    logStats() {
        const stats = this.getStats();
        console.table(stats.renderer);
        console.table(stats.performance);
        console.table(stats.assets);
    }

    /**
     * Cleanup and destroy application
     */
    dispose() {
        console.log('🧹 Disposing PortfolioApp...');

        // Pause rendering
        this.pause();

        // Dispose components
        if (this.heroScene) {
            this.heroScene.dispose();
        }

        if (this.lightingSystem) {
            this.lightingSystem.dispose();
        }

        if (this.cameraController) {
            this.cameraController.dispose();
        }

        // Dispose managers
        this.assetManager.dispose();
        this.sceneManager.dispose();

        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);

        // Clear event bus
        this.eventBus.clearAll();

        this.isInitialized = false;
        this.isRunning = false;

        console.log('✅ PortfolioApp disposed');
    }
}

// Export singleton instance creator
export function createPortfolioApp() {
    return new PortfolioApp();
}
