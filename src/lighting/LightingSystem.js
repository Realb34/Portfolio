/**
 * LightingSystem - Dynamic lighting management
 * Handles ambient, directional, point, and spot lights with presets
 *
 * @enterprise-pattern Factory Pattern (light creation)
 * @responsibility Light management, presets, dynamic updates
 */

import * as THREE from 'three';
import { EventBus } from '../core/EventBus.js';

export class LightingSystem {
    /**
     * @param {THREE.Scene} scene
     * @param {Object} options
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        this.eventBus = EventBus.getInstance();

        this.lights = new Map();
        this.lightHelpers = new Map();
        this.showHelpers = options.showHelpers || false;

        // Lighting presets
        this.presets = {
            DEFAULT: {
                ambient: { color: 0xffffff, intensity: 0.4 },
                directional: {
                    color: 0xffffff,
                    intensity: 0.8,
                    position: { x: 5, y: 5, z: 5 },
                    castShadow: true
                }
            },
            DRAMATIC: {
                ambient: { color: 0x404040, intensity: 0.2 },
                directional: {
                    color: 0xffffff,
                    intensity: 1.2,
                    position: { x: -5, y: 10, z: 5 },
                    castShadow: true
                },
                point: {
                    color: 0xfacc15,
                    intensity: 0.8,
                    position: { x: 0, y: 3, z: 0 },
                    distance: 10
                }
            },
            SUNSET: {
                ambient: { color: 0xff9966, intensity: 0.3 },
                directional: {
                    color: 0xff6347,
                    intensity: 1.0,
                    position: { x: 10, y: 2, z: 5 },
                    castShadow: true
                },
                hemisphere: {
                    skyColor: 0xff6347,
                    groundColor: 0x1a1a2e,
                    intensity: 0.5
                }
            },
            NEON: {
                ambient: { color: 0x0a0a0a, intensity: 0.1 },
                point: [
                    {
                        color: 0xff1493,
                        intensity: 2.0,
                        position: { x: -3, y: 2, z: 2 },
                        distance: 8
                    },
                    {
                        color: 0x00ffff,
                        intensity: 2.0,
                        position: { x: 3, y: 2, z: -2 },
                        distance: 8
                    }
                ]
            }
        };

        this.currentPreset = 'DEFAULT';
    }

    /**
     * Create ambient light
     * @param {string} name
     * @param {number} color
     * @param {number} intensity
     * @returns {THREE.AmbientLight}
     */
    createAmbientLight(name, color = 0xffffff, intensity = 0.5) {
        const light = new THREE.AmbientLight(color, intensity);
        this.addLight(name, light);
        return light;
    }

    /**
     * Create directional light with shadow support
     * @param {string} name
     * @param {number} color
     * @param {number} intensity
     * @param {THREE.Vector3} position
     * @param {boolean} castShadow
     * @returns {THREE.DirectionalLight}
     */
    createDirectionalLight(name, color = 0xffffff, intensity = 1, position = new THREE.Vector3(5, 5, 5), castShadow = true) {
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.copy(position);

        if (castShadow) {
            light.castShadow = true;
            light.shadow.mapSize.width = 2048;
            light.shadow.mapSize.height = 2048;
            light.shadow.camera.near = 0.5;
            light.shadow.camera.far = 50;
            light.shadow.camera.left = -10;
            light.shadow.camera.right = 10;
            light.shadow.camera.top = 10;
            light.shadow.camera.bottom = -10;
            light.shadow.bias = -0.0001;
        }

        this.addLight(name, light);

        // Add helper if enabled
        if (this.showHelpers) {
            const helper = new THREE.DirectionalLightHelper(light, 1);
            this.scene.add(helper);
            this.lightHelpers.set(name, helper);
        }

        return light;
    }

    /**
     * Create point light
     * @param {string} name
     * @param {number} color
     * @param {number} intensity
     * @param {THREE.Vector3} position
     * @param {number} distance
     * @returns {THREE.PointLight}
     */
    createPointLight(name, color = 0xffffff, intensity = 1, position = new THREE.Vector3(0, 0, 0), distance = 0) {
        const light = new THREE.PointLight(color, intensity, distance);
        light.position.copy(position);

        this.addLight(name, light);

        // Add helper if enabled
        if (this.showHelpers) {
            const helper = new THREE.PointLightHelper(light, 0.5);
            this.scene.add(helper);
            this.lightHelpers.set(name, helper);
        }

        return light;
    }

    /**
     * Create spot light
     * @param {string} name
     * @param {number} color
     * @param {number} intensity
     * @param {THREE.Vector3} position
     * @param {THREE.Vector3} target
     * @returns {THREE.SpotLight}
     */
    createSpotLight(name, color = 0xffffff, intensity = 1, position = new THREE.Vector3(0, 5, 0), target = new THREE.Vector3(0, 0, 0)) {
        const light = new THREE.SpotLight(color, intensity);
        light.position.copy(position);
        light.target.position.copy(target);
        light.angle = Math.PI / 6;
        light.penumbra = 0.2;
        light.castShadow = true;

        this.addLight(name, light);
        this.scene.add(light.target);

        // Add helper if enabled
        if (this.showHelpers) {
            const helper = new THREE.SpotLightHelper(light);
            this.scene.add(helper);
            this.lightHelpers.set(name, helper);
        }

        return light;
    }

    /**
     * Create hemisphere light
     * @param {string} name
     * @param {number} skyColor
     * @param {number} groundColor
     * @param {number} intensity
     * @returns {THREE.HemisphereLight}
     */
    createHemisphereLight(name, skyColor = 0xffffff, groundColor = 0x444444, intensity = 0.5) {
        const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
        this.addLight(name, light);

        // Add helper if enabled
        if (this.showHelpers) {
            const helper = new THREE.HemisphereLightHelper(light, 1);
            this.scene.add(helper);
            this.lightHelpers.set(name, helper);
        }

        return light;
    }

    /**
     * Add light to scene and registry
     * @param {string} name
     * @param {THREE.Light} light
     */
    addLight(name, light) {
        this.lights.set(name, light);
        this.scene.add(light);
        this.eventBus.emit('lighting:light-added', { name, light });
    }

    /**
     * Remove light from scene
     * @param {string} name
     */
    removeLight(name) {
        const light = this.lights.get(name);
        if (light) {
            this.scene.remove(light);
            this.lights.delete(name);

            // Remove helper
            const helper = this.lightHelpers.get(name);
            if (helper) {
                this.scene.remove(helper);
                this.lightHelpers.delete(name);
            }

            this.eventBus.emit('lighting:light-removed', { name });
        }
    }

    /**
     * Get light by name
     * @param {string} name
     * @returns {THREE.Light|null}
     */
    getLight(name) {
        return this.lights.get(name) || null;
    }

    /**
     * Update light properties
     * @param {string} name
     * @param {Object} properties
     */
    updateLight(name, properties) {
        const light = this.lights.get(name);
        if (!light) return;

        if (properties.color !== undefined) {
            light.color.setHex(properties.color);
        }
        if (properties.intensity !== undefined) {
            light.intensity = properties.intensity;
        }
        if (properties.position !== undefined) {
            light.position.set(properties.position.x, properties.position.y, properties.position.z);
        }

        this.eventBus.emit('lighting:light-updated', { name, properties });
    }

    /**
     * Apply lighting preset
     * @param {string} presetName
     */
    applyPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) {
            console.warn(`Preset "${presetName}" not found`);
            return;
        }

        // Clear existing lights
        this.clearLights();

        // Apply ambient light
        if (preset.ambient) {
            this.createAmbientLight(
                'ambient',
                preset.ambient.color,
                preset.ambient.intensity
            );
        }

        // Apply directional light
        if (preset.directional) {
            const pos = preset.directional.position;
            this.createDirectionalLight(
                'directional',
                preset.directional.color,
                preset.directional.intensity,
                new THREE.Vector3(pos.x, pos.y, pos.z),
                preset.directional.castShadow
            );
        }

        // Apply point lights
        if (preset.point) {
            if (Array.isArray(preset.point)) {
                preset.point.forEach((point, index) => {
                    const pos = point.position;
                    this.createPointLight(
                        `point-${index}`,
                        point.color,
                        point.intensity,
                        new THREE.Vector3(pos.x, pos.y, pos.z),
                        point.distance
                    );
                });
            } else {
                const pos = preset.point.position;
                this.createPointLight(
                    'point',
                    preset.point.color,
                    preset.point.intensity,
                    new THREE.Vector3(pos.x, pos.y, pos.z),
                    preset.point.distance
                );
            }
        }

        // Apply hemisphere light
        if (preset.hemisphere) {
            this.createHemisphereLight(
                'hemisphere',
                preset.hemisphere.skyColor,
                preset.hemisphere.groundColor,
                preset.hemisphere.intensity
            );
        }

        this.currentPreset = presetName;
        this.eventBus.emit('lighting:preset-applied', { presetName });
    }

    /**
     * Animate light intensity
     * @param {string} name
     * @param {number} targetIntensity
     * @param {number} duration
     * @returns {Promise}
     */
    animateIntensity(name, targetIntensity, duration = 1000) {
        const light = this.lights.get(name);
        if (!light) return Promise.resolve();

        return new Promise((resolve) => {
            const startIntensity = light.intensity;
            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                light.intensity = startIntensity + (targetIntensity - startIntensity) * progress;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    /**
     * Clear all lights
     */
    clearLights() {
        this.lights.forEach((light, name) => {
            this.removeLight(name);
        });
    }

    /**
     * Update helpers (if enabled)
     */
    updateHelpers() {
        this.lightHelpers.forEach((helper) => {
            if (helper.update) {
                helper.update();
            }
        });
    }

    /**
     * Cleanup
     */
    dispose() {
        this.clearLights();
        this.lightHelpers.clear();
    }
}
