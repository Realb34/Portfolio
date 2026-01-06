/**
 * HeroScene - Immersive 3D hero section
 * Floating geometric shapes representing tech stack
 *
 * @enterprise-pattern Component Pattern
 * @responsibility Hero section 3D visualization
 */

import * as THREE from 'three';
import { EventBus } from '../core/EventBus.js';

export class HeroScene {
    /**
     * @param {THREE.Scene} scene
     * @param {Object} options
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        this.eventBus = EventBus.getInstance();

        this.objects = [];
        this.particleSystem = null;

        // Configuration
        this.techStack = options.techStack || [
            { name: 'Python', color: 0x3776ab, shape: 'sphere' },
            { name: 'C++', color: 0x00599c, shape: 'box' },
            { name: 'JavaScript', color: 0xf7df1e, shape: 'octahedron' },
            { name: 'PyTorch', color: 0xee4c2c, shape: 'torus' },
            { name: 'SQL', color: 0x336791, shape: 'cylinder' },
            { name: 'Git', color: 0xf05032, shape: 'dodecahedron' },
            { name: 'HTML/CSS', color: 0xe34c26, shape: 'cone' }
        ];

        this.animationConfig = {
            floatSpeed: 0.0005,
            rotationSpeed: 0.001,
            mouseInfluence: 0.05
        };

        this.mousePosition = new THREE.Vector2();
        this.isInitialized = false;
    }

    /**
     * Initialize hero scene
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            // Create floating tech stack objects
            this.createTechStackObjects();

            // Create particle system
            this.createParticleSystem();

            // Setup event listeners
            this.setupEventListeners();

            this.isInitialized = true;
            this.eventBus.emit('hero:initialized');

            console.log('✅ HeroScene initialized');
        } catch (error) {
            console.error('Failed to initialize HeroScene:', error);
            this.eventBus.emit('hero:error', { error });
        }
    }

    /**
     * Create floating 3D objects for tech stack
     */
    createTechStackObjects() {
        const group = new THREE.Group();

        this.techStack.forEach((tech, index) => {
            const geometry = this.createGeometry(tech.shape);
            const material = new THREE.MeshStandardMaterial({
                color: tech.color,
                roughness: 0.3,
                metalness: 0.7,
                emissive: tech.color,
                emissiveIntensity: 0.2
            });

            const mesh = new THREE.Mesh(geometry, material);

            // Position in circular formation
            const angle = (index / this.techStack.length) * Math.PI * 2;
            const radius = 8;
            mesh.position.x = Math.cos(angle) * radius;
            mesh.position.z = Math.sin(angle) * radius;
            mesh.position.y = (Math.random() - 0.5) * 4;

            // Random rotation
            mesh.rotation.x = Math.random() * Math.PI;
            mesh.rotation.y = Math.random() * Math.PI;

            // Store initial position for animation
            mesh.userData.initialPosition = mesh.position.clone();
            mesh.userData.floatOffset = Math.random() * Math.PI * 2;
            mesh.userData.tech = tech;

            mesh.castShadow = true;
            mesh.receiveShadow = true;

            group.add(mesh);
            this.objects.push(mesh);
        });

        // Position group
        group.position.set(5, 0, -10);
        this.scene.add(group);
        this.techGroup = group;
    }

    /**
     * Create geometry based on shape type
     * @param {string} shape
     * @returns {THREE.BufferGeometry}
     */
    createGeometry(shape) {
        const size = 0.8;

        switch (shape) {
            case 'sphere':
                return new THREE.SphereGeometry(size, 32, 32);
            case 'box':
                return new THREE.BoxGeometry(size * 1.2, size * 1.2, size * 1.2);
            case 'octahedron':
                return new THREE.OctahedronGeometry(size);
            case 'torus':
                return new THREE.TorusGeometry(size * 0.7, size * 0.3, 16, 100);
            case 'cylinder':
                return new THREE.CylinderGeometry(size * 0.6, size * 0.6, size * 1.5, 32);
            case 'dodecahedron':
                return new THREE.DodecahedronGeometry(size);
            case 'cone':
                return new THREE.ConeGeometry(size * 0.7, size * 1.5, 32);
            default:
                return new THREE.SphereGeometry(size, 32, 32);
        }
    }

    /**
     * Create particle system for background ambiance
     */
    createParticleSystem() {
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const color = new THREE.Color();

        for (let i = 0; i < particleCount; i++) {
            // Random positions in large sphere
            const i3 = i * 3;
            const radius = 30;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            // Random colors (gold to orange gradient)
            color.setHSL(0.1 + Math.random() * 0.1, 0.8, 0.5);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.eventBus.on('scroll:update', this.handleScroll.bind(this));
    }

    /**
     * Handle mouse movement
     * @param {MouseEvent} event
     */
    handleMouseMove(event) {
        this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    /**
     * Handle scroll events
     * @param {Object} data
     */
    handleScroll(data) {
        if (!this.techGroup) return;

        // Move scene based on scroll
        const scrollProgress = data.scrollY / window.innerHeight;
        this.techGroup.position.y = -scrollProgress * 5;
        this.techGroup.rotation.y = scrollProgress * Math.PI * 0.5;
    }

    /**
     * Update animation (called each frame)
     * @param {number} time
     */
    update(time) {
        if (!this.isInitialized) return;

        // Animate tech stack objects
        this.objects.forEach((obj) => {
            // Floating animation
            const floatOffset = obj.userData.floatOffset;
            obj.position.y = obj.userData.initialPosition.y + Math.sin(time * this.animationConfig.floatSpeed + floatOffset) * 2;

            // Rotation
            obj.rotation.x += this.animationConfig.rotationSpeed;
            obj.rotation.y += this.animationConfig.rotationSpeed * 1.5;

            // Mouse influence
            obj.position.x += (this.mousePosition.x * this.animationConfig.mouseInfluence - (obj.position.x - obj.userData.initialPosition.x)) * 0.05;
            obj.position.z += (this.mousePosition.y * this.animationConfig.mouseInfluence - (obj.position.z - obj.userData.initialPosition.z)) * 0.05;
        });

        // Rotate particle system
        if (this.particleSystem) {
            this.particleSystem.rotation.y = time * 0.0001;
            this.particleSystem.rotation.x = time * 0.00005;
        }

        // Rotate tech group
        if (this.techGroup) {
            this.techGroup.rotation.y += 0.0002;
        }
    }

    /**
     * Show hero scene with animation
     * @returns {Promise}
     */
    show() {
        return new Promise((resolve) => {
            // Fade in animation
            this.objects.forEach((obj, index) => {
                setTimeout(() => {
                    obj.visible = true;
                    obj.scale.set(0, 0, 0);

                    const animate = (startTime) => {
                        const elapsed = performance.now() - startTime;
                        const progress = Math.min(elapsed / 1000, 1);

                        obj.scale.setScalar(progress);

                        if (progress < 1) {
                            requestAnimationFrame(() => animate(startTime));
                        } else if (index === this.objects.length - 1) {
                            resolve();
                        }
                    };

                    requestAnimationFrame(() => animate(performance.now()));
                }, index * 100);
            });
        });
    }

    /**
     * Hide hero scene
     * @returns {Promise}
     */
    hide() {
        return new Promise((resolve) => {
            this.objects.forEach((obj, index) => {
                setTimeout(() => {
                    const startScale = obj.scale.x;
                    const animate = (startTime) => {
                        const elapsed = performance.now() - startTime;
                        const progress = Math.min(elapsed / 500, 1);

                        obj.scale.setScalar(startScale * (1 - progress));

                        if (progress >= 1) {
                            obj.visible = false;
                            if (index === this.objects.length - 1) {
                                resolve();
                            }
                        } else {
                            requestAnimationFrame(() => animate(startTime));
                        }
                    };

                    requestAnimationFrame(() => animate(performance.now()));
                }, index * 50);
            });
        });
    }

    /**
     * Cleanup
     */
    dispose() {
        window.removeEventListener('mousemove', this.handleMouseMove.bind(this));

        // Dispose geometries and materials
        this.objects.forEach((obj) => {
            obj.geometry.dispose();
            obj.material.dispose();
            this.scene.remove(obj);
        });

        if (this.particleSystem) {
            this.particleSystem.geometry.dispose();
            this.particleSystem.material.dispose();
            this.scene.remove(this.particleSystem);
        }

        if (this.techGroup) {
            this.scene.remove(this.techGroup);
        }

        this.objects = [];
        this.isInitialized = false;
    }
}
