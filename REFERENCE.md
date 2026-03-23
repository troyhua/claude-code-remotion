# Remotion Ecosystem Reference

## Official @remotion/* Packages

### Core
- `remotion` - Core: Composition, Sequence, AbsoluteFill, useCurrentFrame, interpolate, spring, Easing
- `@remotion/cli` - CLI for preview, render, upgrade
- `@remotion/studio` - Visual preview with props editor & timeline
- `@remotion/renderer` - Node.js API: renderMedia, renderStill, renderFrames
- `@remotion/player` - Embeddable Player component for React apps
- `@remotion/preload` - Preload video/audio/image/font assets
- `@remotion/animation-utils` - Shared animation utilities

### Visual Effects & Drawing
- `@remotion/transitions` - Scene transitions: fade, slide, wipe, flip, clockWipe
- `@remotion/shapes` - SVG shapes: circle, rect, triangle, star, heart, pie
- `@remotion/paths` - SVG path utils: evolvePath (draw-on), getLength, interpolatePath
- `@remotion/noise` - 2D/3D/4D Perlin noise
- `@remotion/motion-blur` - CameraMotionBlur, Trail effects
- `@remotion/layout-utils` - Measure text/DOM for dynamic layouts
- `@remotion/svg-3d-engine` - Lightweight 3D via SVG extrusion
- `@remotion/light-leaks` - Cinematic light leak overlays
- `@remotion/starburst` - Starburst/ray effects
- `@remotion/rounded-text-box` - Caption-style rounded text boxes

### Media & Integrations
- `@remotion/media` - Video/audio with frame-perfect sync
- `@remotion/media-utils` - Media metadata (duration, dimensions)
- `@remotion/lottie` - After Effects/Lottie animations
- `@remotion/rive` - Rive animations synced to timeline
- `@remotion/three` - React Three Fiber (3D)
- `@remotion/skia` - React Native Skia (GPU 2D)
- `@remotion/gif` - Frame-accurate GIF embedding
- `@remotion/animated-emoji` - Google animated emoji

### Fonts & Text
- `@remotion/google-fonts` - Load any Google Font
- `@remotion/fonts` - Load local or URL-based fonts

### Captions & Transcription
- `@remotion/captions` - SRT, VTT, word-level captions
- `@remotion/install-whisper-cpp` - Local Whisper.cpp install
- `@remotion/openai-whisper` - OpenAI Whisper → Remotion Captions
- `@remotion/whisper-web` - Browser Whisper via WASM

### Styling
- `@remotion/tailwind` - TailwindCSS v3
- `@remotion/tailwind-v4` - TailwindCSS v4
- `@remotion/enable-scss` - SCSS/Sass

### Cloud Rendering
- `@remotion/lambda` - AWS Lambda rendering
- `@remotion/cloudrun` - Google Cloud Run rendering
- `@remotion/web-renderer` - Browser-only rendering
- `@remotion/webcodecs` - WebCodecs API encoding

## Community Libraries
- remotion-animated - Declarative animation primitives
- remotion-time - Timings in seconds instead of frames
- remotion-animate-text - Text effects (typewriter, word-by-word)
- Remotion Bits - Reusable building blocks
- ClippKit - Free component library

## Animation Compatibility
- Works: Anime.js, GSAP, Lottie, Rive, CSS Animations, D3.js
- Does NOT work: Framer Motion, react-spring (real-time model conflicts)

## Alternatives (all MIT/free)
- Motion Canvas - Generator-based TS, built-in GUI, best for explainer videos
- Revideo - Fork of Motion Canvas as library, WebCodecs, best for SaaS
- Rendervid - AI-agent-first with MCP server, best for AI pipelines
- Twick - JSON timeline, headless React, best for custom editors
