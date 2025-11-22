# Landing Animation Features

## Overview

An impressive landing animation has been added to the deployment map that creates an engaging user experience on every page load.

## Animation Sequence

### 1. **Globe Spin (0-3 seconds)**

- Map starts in **globe projection mode**
- Globe rotates a full 360° around its axis
- Smooth, continuous rotation at 0.3° per frame
- Creates a sense of global reach and scale

### 2. **Zoom to India (3-6 seconds)**

- **Stays in globe mode** (no flattening)
- Camera smoothly flies to India's geographic center
- Zooms from global view (zoom 1.5) to regional view (zoom 5)
- 2.5 second smooth animation with easing
- Centers on coordinates: [78.9629, 20.5937]

### 3. **Marker Animation (6+ seconds)**

- Deployment markers appear with **staggered timing**
- Each marker has a 150ms delay from the previous one
- Markers pop in with a bounce effect:
  - Start: `scale(0)` and `translateY(20px)` (invisible, below position)
  - Animate: Smooth cubic-bezier easing function
  - End: `scale(1)` and `translateY(0)` (normal position)
- Creates a "shooting out in straight lines" visual effect on the 3D globe

## Technical Implementation

### State Management

```typescript
- introAnimationComplete: Tracks if animation has finished
- showMarkers: Controls when markers should be rendered
- animationFrameRef: Manages requestAnimationFrame for smooth rotation
```

### Animation Behavior

- Animation plays **on every page load/reload**
- No session storage - consistent experience every time
- Provides engaging visual every time users visit the page

### Performance Optimizations

- Uses `requestAnimationFrame` for smooth 60fps rotation
- Cancels animation frames on component unmount (prevents memory leaks)
- Staggered marker rendering (150ms intervals) prevents UI jank
- Smooth CSS transitions with hardware acceleration
- Stays in globe mode (no projection switching overhead)

### Visual Effects

#### Marker Animations (CSS)
```css
- Bounce-in animation with scale and translateY
- Continuous pulse effect (ripple shadow)
- Hover effects with scale transform
- Smooth transitions (0.6s cubic-bezier)
```

#### Marker Styles
```css
- Circular design with colored fills
- White borders for contrast
- Drop shadows for depth
- Cursor pointer for interactivity
```

## User Experience

### Every Visit

1. 🌍 **Globe appears** and starts spinning
2. 🔄 **Rotates 360°** smoothly (takes ~3 seconds)
3. 🎯 **Stays as globe** and zooms to India (takes ~3 seconds)
4. 📍 **Markers pop out** one by one on the 3D globe surface
5. ✨ Interactive 3D globe map ready for exploration

The animation plays consistently on every page load, giving users that impressive globe-spinning-to-India effect each time they visit.

## Configuration

### India Center Point
```typescript
const INDIA_CENTER: [number, number] = [78.9629, 20.5937];
```

### Animation Timing
- Globe rotation: ~3 seconds (360° at 0.3°/frame)
- Transition pause: 500ms
- Fly to India: 2500ms
- Marker delay: 150ms per marker

### Customization

To modify the animation:

1. Adjust rotation speed: Change `rotation += 0.3` value
2. Change target location: Modify `INDIA_CENTER` coordinates
3. Adjust zoom level: Change `zoom: 5` in flyTo
4. Modify marker delay: Change `index * 150` multiplier
5. Change animation duration: Adjust timeout values (currently 2500ms)

## Browser Compatibility
- Works on all modern browsers with WebGL support
- Gracefully falls back to Mercator if globe not supported
- Uses MapLibre GL JS v5.13.0
- Tested on Chrome, Firefox, Safari, Edge

## Future Enhancements (Ideas)
- Add connecting lines between markers during animation
- Particle effects during transition
- Sound effects (optional, toggle-able)
- Different animation patterns (spiral, wave, etc.)
- Animation speed controls in settings
- Country-specific landing animations based on user location
