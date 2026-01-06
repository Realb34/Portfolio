/**
 * CameraController - Advanced camera management and animations
 * Handles orbital controls, cinematic paths, and smooth transitions
 *
 * @enterprise-pattern Strategy Pattern (different camera modes)
 * @responsibility Camera positioning, movement, transitions
 */

import * as THREE from 'three';
import { EventBus } from '../core/EventBus.js';

export class CameraController {
    /**
     * @param {THREE.Camera} camera
     * @param {Object} options
     */
    constructor(camera, options = {}) {
        this.camera = camera;
        this.eventBus = EventBus.getInstance();

        // Camera settings
        this.fov = options.fov || 75;
        this.near = options.near || 0.1;
        this.far = options.far || 1000;

        // Movement settings
        this.smoothing = options.smoothing || 0.1;
        this.targetPosition = new THREE.Vector3();
        this.targetLookAt = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();

        // Scroll-based movement
        this.scrollSensitivity = options.scrollSensitivity || 0.001;
        this.isScrollControlled = options.scrollControlled || false;

        // Cinematic paths
        this.activePath = null;
        this.pathProgress = 0;
        this.isPlayingPath = false;

        // Mouse parallax
        this.enableParallax = options.parallax || false;
        this.parallaxStrength = options.parallaxStrength || 0.02;
        this.mousePosition = new THREE.Vector2();

        // Initialize camera position
        if (options.position) {
            this.camera.position.copy(options.position);
            this.targetPosition.copy(options.position);
        }

        if (options.lookAt) {
            this.camera.lookAt(options.lookAt);
            this.targetLookAt.copy(options.lookAt);
            this.currentLookAt.copy(options.lookAt);
        }

        this.setupEventListeners();
    }

    /**
     * Setup event listeners for camera control
     */
    setupEventListeners() {
        // Mouse parallax effect
        if (this.enableParallax) {
            window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        }

        // Scroll control
        if (this.isScrollControlled) {
            window.addEventListener('scroll', this.handleScroll.bind(this));
        }
    }

    /**
     * Handle mouse movement for parallax effect
     * @param {MouseEvent} event
     */
    handleMouseMove(event) {
        this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    /**
     * Handle scroll for camera movement
     */
    handleScroll() {
        const scrollY = window.scrollY;
        this.eventBus.emit('camera:scroll', { scrollY });
    }

    /**
     * Smoothly move camera to target position
     * @param {THREE.Vector3} position
     * @param {number} duration - Duration in ms
     * @returns {Promise}
     */
    moveTo(position, duration = 1000) {
        return new Promise((resolve) => {
            this.targetPosition.copy(position);

            if (duration === 0) {
                this.camera.position.copy(position);
                resolve();
                return;
            }

            const startTime = performance.now();
            const startPosition = this.camera.position.clone();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function (ease-in-out cubic)
                const eased = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                this.camera.position.lerpVectors(startPosition, position, eased);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.eventBus.emit('camera:move-complete', { position });
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    /**
     * Smoothly look at target
     * @param {THREE.Vector3} target
     * @param {number} duration - Duration in ms
     * @returns {Promise}
     */
    lookAtSmooth(target, duration = 1000) {
        return new Promise((resolve) => {
            this.targetLookAt.copy(target);

            if (duration === 0) {
                this.camera.lookAt(target);
                this.currentLookAt.copy(target);
                resolve();
                return;
            }

            const startTime = performance.now();
            const startLookAt = this.currentLookAt.clone();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                const eased = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                this.currentLookAt.lerpVectors(startLookAt, target, eased);
                this.camera.lookAt(this.currentLookAt);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.eventBus.emit('camera:lookat-complete', { target });
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    /**
     * Create cinematic camera path from curve
     * @param {THREE.Curve} curve - Path curve
     * @param {Array<THREE.Vector3>} lookAtPoints - Look at targets along path
     */
    createCinematicPath(curve, lookAtPoints = []) {
        this.activePath = {
            curve,
            lookAtPoints,
            duration: 5000 // Default 5 seconds
        };
    }

    /**
     * Play cinematic path
     * @param {number} duration - Duration in ms
     * @returns {Promise}
     */
    playCinematicPath(duration = null) {
        if (!this.activePath) {
            console.warn('No active path to play');
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const pathDuration = duration || this.activePath.duration;
            const startTime = performance.now();
            this.isPlayingPath = true;

            const animate = (currentTime) => {
                if (!this.isPlayingPath) {
                    resolve();
                    return;
                }

                const elapsed = currentTime - startTime;
                this.pathProgress = Math.min(elapsed / pathDuration, 1);

                // Get position on curve
                const position = this.activePath.curve.getPoint(this.pathProgress);
                this.camera.position.copy(position);

                // Interpolate look at target
                if (this.activePath.lookAtPoints.length > 0) {
                    const lookAtIndex = Math.floor(this.pathProgress * (this.activePath.lookAtPoints.length - 1));
                    const lookAt = this.activePath.lookAtPoints[lookAtIndex];
                    if (lookAt) {
                        this.camera.lookAt(lookAt);
                    }
                }

                if (this.pathProgress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.isPlayingPath = false;
                    this.eventBus.emit('camera:path-complete');
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    /**
     * Stop cinematic path playback
     */
    stopCinematicPath() {
        this.isPlayingPath = false;
    }

    /**
     * Update camera (called each frame)
     * @param {number} deltaTime
     */
    update(deltaTime) {
        // Apply mouse parallax
        if (this.enableParallax && !this.isPlayingPath) {
            const parallaxX = this.mousePosition.x * this.parallaxStrength;
            const parallaxY = this.mousePosition.y * this.parallaxStrength;

            this.camera.position.x += (parallaxX - this.camera.position.x) * this.smoothing;
            this.camera.position.y += (parallaxY - this.camera.position.y) * this.smoothing;
        }

        // Smooth camera movement to target
        if (!this.isPlayingPath) {
            this.camera.position.lerp(this.targetPosition, this.smoothing);
        }
    }

    /**
     * Create orbital rotation around target
     * @param {THREE.Vector3} target - Center point
     * @param {number} radius - Distance from target
     * @param {number} speed - Rotation speed
     */
    orbitAround(target, radius, speed = 0.001) {
        const time = performance.now() * speed;
        this.camera.position.x = target.x + Math.cos(time) * radius;
        this.camera.position.z = target.z + Math.sin(time) * radius;
        this.camera.lookAt(target);
    }

    /**
     * Shake camera effect
     * @param {number} intensity - Shake intensity
     * @param {number} duration - Duration in ms
     * @returns {Promise}
     */
    shake(intensity = 0.1, duration = 500) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            const originalPosition = this.camera.position.clone();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = elapsed / duration;

                if (progress < 1) {
                    const shake = intensity * (1 - progress);
                    this.camera.position.x = originalPosition.x + (Math.random() - 0.5) * shake;
                    this.camera.position.y = originalPosition.y + (Math.random() - 0.5) * shake;
                    this.camera.position.z = originalPosition.z + (Math.random() - 0.5) * shake;

                    requestAnimationFrame(animate);
                } else {
                    this.camera.position.copy(originalPosition);
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    /**
     * Reset camera to default position
     * @param {number} duration
     */
    reset(duration = 1000) {
        return Promise.all([
            this.moveTo(new THREE.Vector3(0, 0, 5), duration),
            this.lookAtSmooth(new THREE.Vector3(0, 0, 0), duration)
        ]);
    }

    /**
     * Cleanup
     */
    dispose() {
        if (this.enableParallax) {
            window.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        }

        if (this.isScrollControlled) {
            window.removeEventListener('scroll', this.handleScroll.bind(this));
        }

        this.stopCinematicPath();
    }
}
