/**
 * Main entry point for Portfolio 3D Application
 * Initializes and bootstraps the immersive 3D experience
 */

import { createPortfolioApp } from './PortfolioApp.js';

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

/**
 * Initialize application
 */
async function init() {
    console.log('🎨 Initializing Portfolio 3D Experience...');

    try {
        // Create 3D canvas container
        const container = createCanvasContainer();

        // Create and initialize app
        const app = createPortfolioApp();
        const success = await app.initialize(container);

        if (success) {
            // Store app instance globally for debugging
            window.portfolioApp = app;

            // Setup debug commands
            setupDebugCommands(app);

            // Log stats periodically in development
            if (process.env.NODE_ENV === 'development') {
                setInterval(() => {
                    console.log('📊 Stats:', app.getStats());
                }, 5000);
            }

            console.log('✨ Portfolio 3D Experience ready!');
        } else {
            console.error('Failed to initialize 3D experience');
            showFallback();
        }

    } catch (error) {
        console.error('Error during initialization:', error);
        showFallback();
    }
}

/**
 * Create canvas container for 3D rendering
 * @returns {HTMLElement}
 */
function createCanvasContainer() {
    // Check if container already exists
    let container = document.getElementById('three-canvas-container');

    if (!container) {
        // Create container
        container = document.createElement('div');
        container.id = 'three-canvas-container';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.zIndex = '-1';
        container.style.pointerEvents = 'none';

        // Insert at beginning of body
        document.body.insertBefore(container, document.body.firstChild);
    }

    return container;
}

/**
 * Setup debug commands in console
 * @param {PortfolioApp} app
 */
function setupDebugCommands(app) {
    // Make debug commands available in console
    window.debug = {
        stats: () => app.logStats(),
        pause: () => app.pause(),
        resume: () => app.resume(),
        quality: (level) => {
            const monitor = app.performanceMonitor;
            monitor.setQuality(level);
            console.log(`Quality set to ${level}`);
        },
        toggleAutoQuality: () => {
            const monitor = app.performanceMonitor;
            const current = monitor.autoQualityAdjust;
            monitor.setAutoQualityAdjust(!current);
            console.log(`Auto quality: ${!current ? 'ON' : 'OFF'}`);
        },
        lighting: (preset) => {
            app.lightingSystem.applyPreset(preset);
            console.log(`Lighting preset: ${preset}`);
        },
        dispose: () => app.dispose()
    };

    console.log(`
🎮 Debug Commands Available:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
debug.stats()           - Show performance stats
debug.pause()           - Pause rendering
debug.resume()          - Resume rendering
debug.quality('HIGH')   - Set quality (HIGH/MEDIUM/LOW)
debug.toggleAutoQuality() - Toggle auto quality adjustment
debug.lighting('DRAMATIC') - Change lighting preset
debug.dispose()         - Cleanup app

Presets: DEFAULT, DRAMATIC, SUNSET, NEON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
}

/**
 * Show 2D fallback if 3D fails
 */
function showFallback() {
    console.log('📱 Showing 2D fallback experience');

    // Remove loading indicator if exists
    const loader = document.getElementById('three-loader');
    if (loader) {
        loader.remove();
    }

    // Ensure existing 2D content is visible
    const container = document.querySelector('.container');
    if (container) {
        container.style.opacity = '1';
    }

    // Show notification to user
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-family: 'Montserrat', sans-serif;
        font-size: 14px;
        z-index: 10000;
        backdrop-filter: blur(10px);
    `;
    notification.textContent = '3D features unavailable. Showing 2D experience.';
    document.body.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.style.transition = 'opacity 0.5s';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}

/**
 * Handle page unload
 */
window.addEventListener('beforeunload', () => {
    if (window.portfolioApp) {
        window.portfolioApp.dispose();
    }
});
