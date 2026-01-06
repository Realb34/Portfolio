/**
 * AssetManager - Centralized asset loading with caching
 * Handles 3D models, textures, fonts with progress tracking
 *
 * @enterprise-pattern Singleton + Strategy Pattern
 * @responsibility Asset loading, caching, progress tracking
 */

import * as THREE from 'three';
import { EventBus } from '../core/EventBus.js';

export class AssetManager {
    static instance = null;

    /**
     * Singleton accessor
     * @returns {AssetManager}
     */
    static getInstance() {
        if (!AssetManager.instance) {
            AssetManager.instance = new AssetManager();
        }
        return AssetManager.instance;
    }

    constructor() {
        if (AssetManager.instance) {
            throw new Error('AssetManager is a singleton. Use getInstance()');
        }

        this.eventBus = EventBus.getInstance();

        // Asset caches
        this.textures = new Map();
        this.models = new Map();
        this.fonts = new Map();
        this.materials = new Map();

        // Loaders
        this.textureLoader = new THREE.TextureLoader();
        this.cubeTextureLoader = new THREE.CubeTextureLoader();

        // Loading state
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.failedAssets = [];

        // Loading manager
        this.loadingManager = new THREE.LoadingManager(
            this.onLoadComplete.bind(this),
            this.onProgress.bind(this),
            this.onError.bind(this)
        );

        // Update loaders to use loading manager
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
        this.cubeTextureLoader = new THREE.CubeTextureLoader(this.loadingManager);
    }

    /**
     * Load texture with caching
     * @param {string} name - Cache key
     * @param {string} url - Texture URL
     * @param {Object} options - Texture options
     * @returns {Promise<THREE.Texture>}
     */
    loadTexture(name, url, options = {}) {
        // Return cached texture if exists
        if (this.textures.has(name)) {
            return Promise.resolve(this.textures.get(name));
        }

        return new Promise((resolve, reject) => {
            this.totalAssets++;

            this.textureLoader.load(
                url,
                (texture) => {
                    // Apply options
                    if (options.wrapS) texture.wrapS = options.wrapS;
                    if (options.wrapT) texture.wrapT = options.wrapT;
                    if (options.repeat) texture.repeat.set(options.repeat.x, options.repeat.y);
                    if (options.encoding) texture.encoding = options.encoding;

                    // Cache texture
                    this.textures.set(name, texture);
                    this.loadedAssets++;

                    this.eventBus.emit('asset:texture-loaded', { name, url });
                    resolve(texture);
                },
                undefined,
                (error) => {
                    this.failedAssets.push({ type: 'texture', name, url, error });
                    this.eventBus.emit('asset:load-error', { type: 'texture', name, error });
                    reject(error);
                }
            );
        });
    }

    /**
     * Load cube texture (for skybox/environment)
     * @param {string} name
     * @param {Array<string>} urls - 6 texture URLs [px, nx, py, ny, pz, nz]
     * @returns {Promise<THREE.CubeTexture>}
     */
    loadCubeTexture(name, urls) {
        if (this.textures.has(name)) {
            return Promise.resolve(this.textures.get(name));
        }

        return new Promise((resolve, reject) => {
            this.totalAssets++;

            this.cubeTextureLoader.load(
                urls,
                (texture) => {
                    this.textures.set(name, texture);
                    this.loadedAssets++;

                    this.eventBus.emit('asset:cube-texture-loaded', { name });
                    resolve(texture);
                },
                undefined,
                (error) => {
                    this.failedAssets.push({ type: 'cube-texture', name, urls, error });
                    this.eventBus.emit('asset:load-error', { type: 'cube-texture', name, error });
                    reject(error);
                }
            );
        });
    }

    /**
     * Create and cache procedural texture
     * @param {string} name
     * @param {Function} generator - Function that returns canvas element
     * @returns {THREE.CanvasTexture}
     */
    createProceduralTexture(name, generator) {
        if (this.textures.has(name)) {
            return this.textures.get(name);
        }

        const canvas = generator();
        const texture = new THREE.CanvasTexture(canvas);
        this.textures.set(name, texture);

        this.eventBus.emit('asset:procedural-texture-created', { name });
        return texture;
    }

    /**
     * Create and cache material
     * @param {string} name
     * @param {THREE.Material} material
     * @returns {THREE.Material}
     */
    cacheMaterial(name, material) {
        this.materials.set(name, material);
        return material;
    }

    /**
     * Get cached material
     * @param {string} name
     * @returns {THREE.Material|null}
     */
    getMaterial(name) {
        return this.materials.get(name) || null;
    }

    /**
     * Load multiple assets in parallel
     * @param {Array<Object>} assets - Array of asset definitions
     * @returns {Promise<Map>}
     */
    async loadAssets(assets) {
        const promises = assets.map((asset) => {
            switch (asset.type) {
                case 'texture':
                    return this.loadTexture(asset.name, asset.url, asset.options);
                case 'cube-texture':
                    return this.loadCubeTexture(asset.name, asset.urls);
                default:
                    return Promise.reject(new Error(`Unknown asset type: ${asset.type}`));
            }
        });

        try {
            await Promise.all(promises);
            return this.getLoadedAssets();
        } catch (error) {
            console.error('Error loading assets:', error);
            throw error;
        }
    }

    /**
     * Get all loaded assets
     * @returns {Map}
     */
    getLoadedAssets() {
        return new Map([
            ...this.textures,
            ...this.models,
            ...this.fonts,
            ...this.materials
        ]);
    }

    /**
     * Get loading progress
     * @returns {number} Progress percentage (0-100)
     */
    getProgress() {
        if (this.totalAssets === 0) return 100;
        return (this.loadedAssets / this.totalAssets) * 100;
    }

    /**
     * Check if all assets are loaded
     * @returns {boolean}
     */
    isComplete() {
        return this.totalAssets > 0 && this.loadedAssets === this.totalAssets;
    }

    /**
     * Loading manager callbacks
     */
    onLoadComplete() {
        this.eventBus.emit('asset:all-loaded', {
            total: this.totalAssets,
            loaded: this.loadedAssets,
            failed: this.failedAssets.length
        });
    }

    onProgress(url, itemsLoaded, itemsTotal) {
        const progress = (itemsLoaded / itemsTotal) * 100;
        this.eventBus.emit('asset:progress', {
            url,
            itemsLoaded,
            itemsTotal,
            progress
        });
    }

    onError(url) {
        console.error('Error loading asset:', url);
        this.eventBus.emit('asset:error', { url });
    }

    /**
     * Clear specific asset from cache
     * @param {string} name
     */
    clearAsset(name) {
        const texture = this.textures.get(name);
        if (texture) {
            texture.dispose();
            this.textures.delete(name);
        }

        const material = this.materials.get(name);
        if (material) {
            material.dispose();
            this.materials.delete(name);
        }

        this.eventBus.emit('asset:cleared', { name });
    }

    /**
     * Clear all cached assets
     */
    clearAll() {
        // Dispose textures
        this.textures.forEach((texture) => {
            texture.dispose();
        });
        this.textures.clear();

        // Dispose materials
        this.materials.forEach((material) => {
            material.dispose();
        });
        this.materials.clear();

        // Clear models and fonts
        this.models.clear();
        this.fonts.clear();

        // Reset counters
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.failedAssets = [];

        this.eventBus.emit('asset:all-cleared');
    }

    /**
     * Get memory usage stats
     * @returns {Object}
     */
    getStats() {
        return {
            textures: this.textures.size,
            materials: this.materials.size,
            models: this.models.size,
            fonts: this.fonts.size,
            totalAssets: this.totalAssets,
            loadedAssets: this.loadedAssets,
            failedAssets: this.failedAssets.length,
            progress: this.getProgress()
        };
    }

    /**
     * Cleanup
     */
    dispose() {
        this.clearAll();
    }
}
