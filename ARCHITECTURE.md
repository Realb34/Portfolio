# 🏗️ Architecture Overview - 3D Portfolio

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Browser Window                                │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    HTML/CSS Layer (2D)                         │  │
│  │  • Navigation, Text, Forms                                     │  │
│  │  • Z-index: 1+                                                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                ↓                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │              Three.js Canvas (3D) - Z-index: -1                │  │
│  │                                                                 │  │
│  │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │  │
│  │  ┃                   PortfolioApp (Facade)                   ┃  │  │
│  │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │  │
│  │         ↓              ↓              ↓              ↓           │  │
│  │  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │  │
│  │  │  Scene   │   │ Camera   │   │ Lighting │   │  Asset   │    │  │
│  │  │ Manager  │   │Controller│   │  System  │   │ Manager  │    │  │
│  │  │(Singleton│   │          │   │ (Factory)│   │(Singleton│    │  │
│  │  └──────────┘   └──────────┘   └──────────┘   └──────────┘    │  │
│  │         ↓              ↓              ↓              ↓           │  │
│  │  ┌────────────────────────────────────────────────────────┐    │  │
│  │  │              Core Systems (Singletons)                 │    │  │
│  │  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐ │    │  │
│  │  │  │  EventBus   │  │ Performance  │  │    WebGL/    │ │    │  │
│  │  │  │  (PubSub)   │  │   Monitor    │  │ WebGPU Check │ │    │  │
│  │  │  └─────────────┘  └──────────────┘  └──────────────┘ │    │  │
│  │  └────────────────────────────────────────────────────────┘    │  │
│  │         ↓                                                        │  │
│  │  ┌────────────────────────────────────────────────────────┐    │  │
│  │  │                3D Components (Modules)                  │    │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │    │  │
│  │  │  │   Hero   │  │ Project  │  │  Future  │             │    │  │
│  │  │  │  Scene   │  │  Scenes  │  │Components│             │    │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘             │    │  │
│  │  └────────────────────────────────────────────────────────┘    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

## Design Patterns Map

### 1. Singleton Pattern
**Purpose**: Ensure single instance of critical systems

```javascript
SceneManager.getInstance()  ──┐
EventBus.getInstance()      ──┤─→ Single shared instance
PerformanceMonitor.getInstance() ─┤
AssetManager.getInstance()  ──┘
```

**Benefits**:
- Global access point
- Memory efficient
- Consistent state

### 2. Observer Pattern (Pub/Sub)
**Purpose**: Decoupled module communication

```javascript
┌─────────────┐
│  EventBus   │
├─────────────┤
│  emit()     │ ←── Publishers
│  on()       │ ──→ Subscribers
│  off()      │
│  once()     │
└─────────────┘

Example Flow:
Camera moves ──→ emit('camera:moved') ──→ HeroScene updates
```

**Benefits**:
- Loose coupling
- Easy to extend
- No direct dependencies

### 3. Factory Pattern
**Purpose**: Consistent object creation

```javascript
LightingSystem
├── createDirectionalLight()
├── createPointLight()
├── createSpotLight()
├── createHemisphereLight()
└── applyPreset('DRAMATIC')
```

**Benefits**:
- Encapsulated creation logic
- Consistent configuration
- Easy to modify

### 4. Facade Pattern
**Purpose**: Simple API for complex systems

```javascript
┌─────────────────────┐
│   PortfolioApp      │  ← Simple interface
├─────────────────────┤
│ initialize()        │
│ start()             │
│ pause()             │
│ dispose()           │
└─────────────────────┘
         ↓
    Coordinates
         ↓
┌─────────────────────┐
│ 10+ Internal Systems│  ← Complex internals
└─────────────────────┘
```

**Benefits**:
- Easy to use
- Hides complexity
- Centralized control

### 5. Component Pattern
**Purpose**: Modular, reusable 3D scenes

```javascript
Component Interface:
├── constructor(scene, options)
├── async initialize()
├── update(time)
├── show() / hide()
└── dispose()

Implementations:
├── HeroScene
├── ProjectScene (future)
└── ContactScene (future)
```

**Benefits**:
- Self-contained modules
- Reusable
- Easy to test

## Data Flow

### Initialization Flow
```
1. User loads page
   ↓
2. main.js creates PortfolioApp
   ↓
3. PortfolioApp.initialize()
   ├─→ SceneManager.initialize()  (WebGL/WebGPU setup)
   ├─→ Create Camera
   ├─→ LightingSystem.applyPreset('DRAMATIC')
   ├─→ AssetManager.loadAssets()  (if any)
   └─→ HeroScene.initialize()
   ↓
4. PortfolioApp.start()
   ├─→ SceneManager.startRenderLoop()
   └─→ Components.update() each frame
   ↓
5. Application running (60 FPS)
```

### Render Loop Flow
```
requestAnimationFrame
   ↓
PerformanceMonitor.begin()
   ↓
beforeRenderCallbacks[]
   ├─→ CameraController.update()
   └─→ Component updates
   ↓
Renderer.render(scene, camera)
   ↓
afterRenderCallbacks[]
   ↓
PerformanceMonitor.end()
   ├─→ Calculate FPS
   ├─→ Check thresholds
   └─→ emit('performance:fps')
   ↓
Auto quality adjustment (if enabled)
   ↓
Next frame
```

### Event Flow Example
```
User moves mouse
   ↓
CameraController.handleMouseMove()
   ↓
Update camera.position
   ↓
eventBus.emit('camera:moved', { position })
   ↓
HeroScene receives event
   ↓
Update 3D objects based on camera
```

## Performance Architecture

### Quality Scaling System
```
┌──────────────────────────────────────┐
│       PerformanceMonitor             │
│  Tracks: FPS, Frame Time, Memory     │
└──────────────────────────────────────┘
                 ↓
         Check FPS < 30?
                 ↓
        ┌────────┴────────┐
       Yes               No
        ↓                 ↓
   Downgrade        FPS >= 60?
   Quality               ↓
        ↓           ┌────┴────┐
   ┌────────┐     Yes        No
   │ MEDIUM │      ↓          ↓
   └────────┘  Upgrade    Maintain
        ↓       Quality
   Check again?
        ↓
   ┌────────┐
   │  LOW   │
   └────────┘
```

### Quality Levels Impact
```
HIGH:
├── Pixel Ratio: 2.0
├── Shadows: Enabled (2048x2048)
├── Particles: 1000
├── Antialiasing: Enabled
└── Post-processing: Ready

MEDIUM:
├── Pixel Ratio: 1.5
├── Shadows: Enabled (1024x1024)
├── Particles: 500
├── Antialiasing: Enabled
└── Post-processing: Disabled

LOW:
├── Pixel Ratio: 1.0
├── Shadows: Disabled
├── Particles: 200
├── Antialiasing: Disabled
└── Post-processing: Disabled
```

## Memory Management

### Asset Lifecycle
```
Load → Cache → Use → Dispose
  ↓      ↓      ↓       ↓
Fetch  Store  Render  Clean
       Map    Scene   Memory
```

### Cleanup Strategy
```
Component.dispose()
   ├─→ Traverse scene objects
   ├─→ Dispose geometries
   ├─→ Dispose materials
   ├─→ Dispose textures
   ├─→ Remove from scene
   └─→ Clear references
```

### Event Listener Management
```
Component.initialize()
   ├─→ addEventListener()
   └─→ Store reference

Component.dispose()
   └─→ removeEventListener()
       (prevents memory leaks)
```

## Module Dependencies

```
main.js
   └─→ PortfolioApp.js
         ├─→ core/SceneManager.js
         │     ├─→ three (THREE.WebGLRenderer)
         │     ├─→ core/PerformanceMonitor.js
         │     └─→ core/EventBus.js
         │
         ├─→ cameras/CameraController.js
         │     ├─→ three (THREE.Camera)
         │     └─→ core/EventBus.js
         │
         ├─→ lighting/LightingSystem.js
         │     ├─→ three (THREE.Light)
         │     └─→ core/EventBus.js
         │
         ├─→ loaders/AssetManager.js
         │     ├─→ three (THREE.TextureLoader)
         │     └─→ core/EventBus.js
         │
         └─→ components/HeroScene.js
               ├─→ three (THREE.Mesh, THREE.Geometry)
               └─→ core/EventBus.js
```

## Security Considerations

### XSS Prevention
- No `innerHTML` or `eval()` used
- No user-generated content in 3D
- Sanitized asset URLs

### Asset Security
- Assets loaded from same origin or trusted CDN
- CORS headers properly configured
- Content Security Policy compatible

### Performance Security
- Frame rate limiting (prevents DOS)
- Memory monitoring (prevents crashes)
- Automatic quality reduction (graceful degradation)

## Scalability

### Adding New Features
1. **New 3D Component**: Create class in `src/components/`
2. **Register in App**: Add to `PortfolioApp.js`
3. **Subscribe to Events**: Use EventBus for communication
4. **Cleanup**: Implement `dispose()` method

### Extending Systems
```javascript
// Add new light preset
LightingSystem.presets.CUSTOM = {
    ambient: { color: 0xffffff, intensity: 0.5 },
    // ...
};

// Add new quality level
PerformanceMonitor.qualityLevels.ULTRA = {
    pixelRatio: 3,
    shadows: true,
    // ...
};
```

## Testing Strategy

### Unit Testing
- Core systems in isolation
- Mock Three.js dependencies
- Test event flow

### Integration Testing
- Component initialization
- Asset loading
- Performance monitoring

### Visual Testing
- Screenshot comparison
- 3D scene rendering
- Cross-browser compatibility

## Build Optimization

### Code Splitting
```
dist/
├── three-core-[hash].js    # Three.js library
├── app-core-[hash].js      # Core systems
└── components-[hash].js    # 3D components
```

### Tree Shaking
- ES6 modules enable dead code elimination
- Only used Three.js features included
- ~200KB gzipped (vs 600KB full Three.js)

### Lazy Loading
```javascript
// Load components on demand
const ProjectScene = await import('./components/ProjectScene.js');
```

## Future Enhancements

### Planned Features
1. **WebGPU Support**: When browser support improves
2. **Post-Processing**: Bloom, DOF, color grading
3. **Physics Engine**: Cannon.js or Ammo.js integration
4. **VR/AR Support**: WebXR implementation
5. **Advanced Shaders**: Custom GLSL materials

### Architecture Evolution
- Add state management for complex scenes
- Implement scene graph optimization
- Add level-of-detail (LOD) system
- Implement frustum culling

---

**This architecture supports**:
- ✅ Scalability
- ✅ Maintainability
- ✅ Performance
- ✅ Security
- ✅ Testability
- ✅ Extensibility
