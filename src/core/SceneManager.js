/**
 * SceneManager - Centralized Three.js scene orchestration
 * Implements Singleton pattern for global scene management
 * Handles WebGL/WebGPU detection, renderer setup, and scene lifecycle
 *
 * @enterprise-pattern Singleton
 * @responsibility Scene lifecycle, renderer management, render loop
 */

import * as THREE from 'three';
import { PerformanceMonitor } from './PerformanceMonitor.js';
import { EventBus } from './EventBus.js';

export class SceneManager {
    static instance = null;

    /**
     * Singleton accessor
     * @returns {SceneManager}
     */
    static getInstance() {
        if (!SceneManager.instance) {
            SceneManager.instance = new SceneManager();
        }
        return SceneManager.instance;
    }

    constructor() {
        if (SceneManager.instance) {
            throw new Error('SceneManager is a singleton. Use getInstance()');
        }

        this.scene = null;
        this.renderer = null;
        this.activeCamera = null;
        this.renderTargets = new Map();
        this.activeScenes = new Map();
        this.animationFrameId = null;
        this.isInitialized = false;

        // Performance monitoring
        this.performanceMonitor = PerformanceMonitor.getInstance();
        this.eventBus = EventBus.getInstance();

        // Render callbacks
        this.beforeRenderCallbacks = [];
        this.afterRenderCallbacks = [];
    }

    /**
     * Initialize Three.js renderer with WebGPU/WebGL detection
     * @param {HTMLElement} container - DOM container for renderer
     * @param {Object} options - Renderer configuration
     * @returns {Promise<boolean>} Success status
     */
    async initialize(container, options = {}) {
        if (this.isInitialized) {
            console.warn('SceneManager already initialized');
            return true;
        }

        try {
            // Detect WebGPU support
            const hasWebGPU = 'gpu' in navigator;

            // Configure renderer with fallback
            const rendererConfig = {
                antialias: options.antialias ?? true,
                alpha: options.alpha ?? true,
                powerPreference: options.powerPreference ?? 'high-performance',
                stencil: options.stencil ?? false,
                preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
                ...options
            };

            // Create renderer
            this.renderer = new THREE.WebGLRenderer(rendererConfig);
            this.renderer.setSize(container.clientWidth, container.clientHeight);
            this.renderer.setPixelRatio(this.getOptimalPixelRatio());
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.0;
            this.renderer.outputEncoding = THREE.sRGBEncoding;

            // Append to container
            container.appendChild(this.renderer.domElement);
            this.renderer.domElement.style.position = 'fixed';
            this.renderer.domElement.style.top = '0';
            this.renderer.domElement.style.left = '0';
            this.renderer.domElement.style.zIndex = '-1';
            this.renderer.domElement.style.pointerEvents = 'none';

            // Create main scene
            this.scene = new THREE.Scene();
            this.scene.background = null; // Transparent for layering

            // Setup resize observer
            this.setupResizeObserver(container);

            // Setup render loop
            this.startRenderLoop();

            this.isInitialized = true;
            this.eventBus.emit('scene:initialized', { hasWebGPU });

            console.log(`✅ SceneManager initialized (WebGPU: ${hasWebGPU})`);
            return true;

        } catch (error) {
            console.error('Failed to initialize SceneManager:', error);
            this.eventBus.emit('scene:error', { error });
            return false;
        }
    }

    /**
     * Calculate optimal pixel ratio based on device and performance
     * @returns {number} Pixel ratio
     */
    getOptimalPixelRatio() {
        const devicePixelRatio = window.devicePixelRatio || 1;

        // Cap pixel ratio for performance
        // Mobile devices: max 2, Desktop: max 2.5
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const maxRatio = isMobile ? 2 : 2.5;

        return Math.min(devicePixelRatio, maxRatio);
    }

    /**
     * Setup responsive resize handling
     * @param {HTMLElement} container
     */
    setupResizeObserver(container) {
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                this.handleResize(width, height);
            }
        });

        resizeObserver.observe(container);
        this.resizeObserver = resizeObserver;
    }

    /**
     * Handle window/container resize
     * @param {number} width
     * @param {number} height
     */
    handleResize(width, height) {
        if (!this.renderer) return;

        this.renderer.setSize(width, height);

        // Update all active cameras
        this.activeScenes.forEach((sceneData) => {
            if (sceneData.camera && sceneData.camera.isPerspectiveCamera) {
                sceneData.camera.aspect = width / height;
                sceneData.camera.updateProjectionMatrix();
            }
        });

        this.eventBus.emit('scene:resize', { width, height });
    }

    /**
     * Register a named scene with its camera
     * @param {string} name - Scene identifier
     * @param {THREE.Scene} scene
     * @param {THREE.Camera} camera
     */
    registerScene(name, scene, camera) {
        this.activeScenes.set(name, { scene, camera, enabled: true });
        this.eventBus.emit('scene:registered', { name });
    }

    /**
     * Set active camera for rendering
     * @param {THREE.Camera} camera
     */
    setActiveCamera(camera) {
        this.activeCamera = camera;
        this.eventBus.emit('camera:changed', { camera });
    }

    /**
     * Add callback to execute before each render
     * @param {Function} callback
     */
    onBeforeRender(callback) {
        this.beforeRenderCallbacks.push(callback);
    }

    /**
     * Add callback to execute after each render
     * @param {Function} callback
     */
    onAfterRender(callback) {
        this.afterRenderCallbacks.push(callback);
    }

    /**
     * Main render loop
     */
    startRenderLoop() {
        const render = (time) => {
            this.animationFrameId = requestAnimationFrame(render);

            // Performance monitoring
            this.performanceMonitor.begin();

            // Execute before render callbacks
            this.beforeRenderCallbacks.forEach(cb => cb(time));

            // Render all active scenes
            if (this.scene && this.activeCamera) {
                this.renderer.render(this.scene, this.activeCamera);
            }

            // Execute after render callbacks
            this.afterRenderCallbacks.forEach(cb => cb(time));

            // End performance monitoring
            this.performanceMonitor.end();

            // Emit render event
            this.eventBus.emit('scene:render', { time });
        };

        this.animationFrameId = requestAnimationFrame(render);
    }

    /**
     * Pause render loop
     */
    pause() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            this.eventBus.emit('scene:paused');
        }
    }

    /**
     * Resume render loop
     */
    resume() {
        if (!this.animationFrameId) {
            this.startRenderLoop();
            this.eventBus.emit('scene:resumed');
        }
    }

    /**
     * Clean up resources and destroy scene
     */
    dispose() {
        // Cancel animation frame
        this.pause();

        // Dispose renderer
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.domElement.remove();
            this.renderer = null;
        }

        // Dispose scenes
        this.activeScenes.forEach(({ scene }) => {
            this.disposeScene(scene);
        });
        this.activeScenes.clear();

        // Clear callbacks
        this.beforeRenderCallbacks = [];
        this.afterRenderCallbacks = [];

        // Dispose resize observer
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }

        this.isInitialized = false;
        this.eventBus.emit('scene:disposed');
    }

    /**
     * Recursively dispose Three.js scene objects
     * @param {THREE.Scene|THREE.Object3D} object
     */
    disposeScene(object) {
        if (!object) return;

        // Traverse and dispose
        object.traverse((child) => {
            if (child.geometry) {
                child.geometry.dispose();
            }

            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => this.disposeMaterial(material));
                } else {
                    this.disposeMaterial(child.material);
                }
            }

            if (child.dispose) {
                child.dispose();
            }
        });
    }

    /**
     * Dispose material and its textures
     * @param {THREE.Material} material
     */
    disposeMaterial(material) {
        if (!material) return;

        // Dispose textures
        Object.keys(material).forEach((key) => {
            const value = material[key];
            if (value && value.isTexture) {
                value.dispose();
            }
        });

        material.dispose();
    }

    /**
     * Get renderer stats for debugging
     * @returns {Object}
     */
    getStats() {
        if (!this.renderer) return null;

        return {
            triangles: this.renderer.info.render.triangles,
            calls: this.renderer.info.render.calls,
            geometries: this.renderer.info.memory.geometries,
            textures: this.renderer.info.memory.textures,
            fps: this.performanceMonitor.getFPS()
        };
    }
}
