# Riley Bellin - Immersive 3D Portfolio

An enterprise-grade, immersive 3D portfolio built with Three.js, featuring living 3D spaces, advanced WebGL rendering, and performance-optimized architecture.

## 🚀 Features

### Enterprise Architecture
- **Singleton Pattern**: SceneManager, EventBus, PerformanceMonitor, AssetManager
- **Observer Pattern**: Event-driven communication between modules
- **Factory Pattern**: Dynamic light and geometry creation
- **Component Pattern**: Modular 3D scene components
- **Facade Pattern**: Clean API through PortfolioApp

### 3D Capabilities
- ✨ **Immersive Hero Section**: Floating 3D tech stack visualization
- 🎨 **Dynamic Lighting**: Multiple presets (Dramatic, Sunset, Neon)
- 📹 **Advanced Camera Controls**: Parallax, cinematic paths, smooth transitions
- 🌟 **Particle Systems**: Ambient 3D particles for atmosphere
- 🎭 **Glassmorphism**: Modern UI with depth and transparency

### Performance & Optimization
- 🔥 **Auto Quality Scaling**: Adapts to device performance (HIGH/MEDIUM/LOW)
- 📊 **FPS Monitoring**: Real-time performance tracking
- 💾 **Asset Caching**: Intelligent texture and material management
- 🎯 **Lazy Loading**: Progressive asset loading with indicators
- ⚡ **WebGPU Detection**: Future-ready with automatic fallback to WebGL

### Accessibility & Progressive Enhancement
- ♿ **Reduced Motion Support**: Respects user preferences
- 📱 **Responsive Design**: Mobile-first approach with adaptive quality
- 🔄 **Graceful Degradation**: 2D fallback if WebGL unavailable
- 🎮 **Debug Commands**: Console tools for development

## 📁 Project Structure

```
Portfolio/
├── src/
│   ├── core/
│   │   ├── SceneManager.js       # Main Three.js orchestrator
│   │   ├── EventBus.js           # Event communication system
│   │   └── PerformanceMonitor.js # FPS tracking & quality management
│   ├── cameras/
│   │   └── CameraController.js   # Advanced camera controls
│   ├── lighting/
│   │   └── LightingSystem.js     # Dynamic lighting presets
│   ├── loaders/
│   │   └── AssetManager.js       # Asset loading & caching
│   ├── components/
│   │   └── HeroScene.js          # Hero section 3D component
│   ├── PortfolioApp.js           # Application facade
│   └── main.js                   # Entry point
├── index.html                    # Main HTML
├── style.css                     # Styles (2D + 3D)
├── script.js                     # Legacy 2D animations
├── package.json                  # Dependencies
├── vite.config.js                # Build configuration
└── README.md                     # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Starts Vite dev server at `http://localhost:3000`

### Production Build
```bash
npm run build
```
Builds optimized production bundle to `dist/`

### Preview Production Build
```bash
npm run preview
```

## 🎮 Debug Commands

Open browser console and use these commands:

```javascript
// Show performance stats
debug.stats()

// Pause/resume rendering
debug.pause()
debug.resume()

// Change quality level
debug.quality('HIGH')    // HIGH, MEDIUM, LOW
debug.quality('MEDIUM')
debug.quality('LOW')

// Toggle auto quality adjustment
debug.toggleAutoQuality()

// Change lighting preset
debug.lighting('DRAMATIC')  // DEFAULT, DRAMATIC, SUNSET, NEON
debug.lighting('SUNSET')
debug.lighting('NEON')

// Dispose application
debug.dispose()
```

## 🏗️ Architecture Details

### Core Systems

#### SceneManager
- Manages Three.js renderer and scenes
- Handles resize and lifecycle events
- Provides render loop coordination
- WebGL/WebGPU detection and fallback

#### EventBus
- Decoupled module communication
- Subscribe/unsubscribe pattern
- One-time event listeners
- Error handling for listeners

#### PerformanceMonitor
- Real-time FPS tracking
- Frame time analysis
- Automatic quality adjustment
- Memory usage monitoring

#### CameraController
- Smooth camera transitions
- Mouse parallax effects
- Cinematic camera paths
- Orbital rotation
- Camera shake effects

#### LightingSystem
- Multiple light types (ambient, directional, point, spot, hemisphere)
- Preset lighting configurations
- Dynamic light animation
- Shadow mapping support

#### AssetManager
- Texture loading and caching
- Cube textures for environments
- Procedural texture generation
- Progress tracking
- Memory-efficient disposal

### Component Architecture

#### HeroScene
- Floating 3D tech stack objects
- Particle system background
- Mouse interaction
- Scroll-based animation
- Show/hide transitions

## 🎨 Customization

### Adding New Tech Stack Items
Edit `src/PortfolioApp.js`:

```javascript
this.heroScene = new HeroScene(this.sceneManager.scene, {
    techStack: [
        { name: 'React', color: 0x61dafb, shape: 'sphere' },
        { name: 'Node.js', color: 0x339933, shape: 'box' },
        // Add more...
    ]
});
```

Available shapes: `sphere`, `box`, `octahedron`, `torus`, `cylinder`, `dodecahedron`, `cone`

### Creating New Lighting Presets
Edit `src/lighting/LightingSystem.js`:

```javascript
this.presets = {
    CUSTOM: {
        ambient: { color: 0xffffff, intensity: 0.5 },
        directional: {
            color: 0xffffff,
            intensity: 1.0,
            position: { x: 5, y: 5, z: 5 },
            castShadow: true
        }
    }
};
```

### Adding New 3D Components
Create a new component in `src/components/`:

```javascript
import * as THREE from 'three';
import { EventBus } from '../core/EventBus.js';

export class MyScene {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.eventBus = EventBus.getInstance();
        // Your implementation
    }

    async initialize() {
        // Setup 3D objects
    }

    update(time) {
        // Animation logic
    }

    dispose() {
        // Cleanup
    }
}
```

Register in `src/PortfolioApp.js`:

```javascript
import { MyScene } from './components/MyScene.js';

// In initialize()
this.myScene = new MyScene(this.sceneManager.scene);
await this.myScene.initialize();

// In update()
if (this.myScene) {
    this.myScene.update(time);
}
```

## 📊 Performance Optimization

### Quality Levels
- **HIGH**: Full shadows, high pixel ratio, 1000 particles
- **MEDIUM**: Shadows enabled, medium pixel ratio, 500 particles
- **LOW**: No shadows, low pixel ratio, 200 particles

### Auto-Scaling
The system automatically adjusts quality based on FPS:
- FPS < 30: Downgrade quality
- FPS >= 60: Upgrade quality (if stable)

### Manual Optimization
```javascript
// Disable auto quality
debug.toggleAutoQuality()

// Set specific quality
debug.quality('MEDIUM')

// Monitor performance
debug.stats()
```

## 🔧 Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Adaptive quality

Requires WebGL support. Automatic fallback to 2D if unavailable.

## 📝 Event System

Subscribe to application events:

```javascript
const eventBus = window.portfolioApp.eventBus;

eventBus.on('scene:initialized', (data) => {
    console.log('Scene ready!', data);
});

eventBus.on('performance:fps', (data) => {
    console.log('FPS:', data.fps);
});

eventBus.on('hero:initialized', () => {
    console.log('Hero scene ready!');
});
```

Available events:
- `scene:initialized`, `scene:resize`, `scene:render`
- `camera:move-complete`, `camera:lookat-complete`
- `lighting:preset-applied`, `lighting:light-updated`
- `performance:fps`, `performance:quality-changed`
- `asset:texture-loaded`, `asset:all-loaded`
- `app:initialized`, `app:started`, `app:paused`

## 🚦 Development vs Production

### Development
```bash
npm run dev
```
- Source maps enabled
- Debug commands available
- Performance logging
- Hot module replacement

### Production
```bash
npm run build
```
- Minified bundles
- Tree shaking
- Code splitting (three-core, app-core chunks)
- No console logs
- Optimized assets

## 📦 Dependencies

### Production
- `three` (^0.160.0) - 3D rendering engine

### Development
- `vite` (^5.0.12) - Build tool and dev server
- `eslint` (^8.56.0) - Code linting

## 🐛 Troubleshooting

### 3D Scene Not Showing
1. Check browser console for errors
2. Verify WebGL support: `debug.stats()`
3. Try different quality: `debug.quality('LOW')`

### Low FPS
1. Enable auto quality: `debug.toggleAutoQuality()`
2. Manually lower quality: `debug.quality('LOW')`
3. Check performance: `debug.stats()`

### Memory Warnings
The system monitors memory usage. If warnings appear:
1. Reduce quality level
2. Clear asset cache
3. Check for memory leaks in custom components

## 📄 License

MIT License - See LICENSE file for details

## 👤 Author

**Riley Bellin**
- Portfolio: [Your URL]
- GitHub: [@Realb34](https://github.com/Realb34)
- LinkedIn: [Riley Bellin](https://www.linkedin.com/in/riley-bellin-969020171/)

## 🙏 Acknowledgments

- Three.js team for the amazing 3D library
- Vite team for the blazing-fast build tool
- Open source community

---

Built with ❤️ and Three.js
