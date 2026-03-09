# AI CAD System

An AI-powered 3D CAD system with comprehensive modeling tools, a natural language terminal interface, and support for external AI integration.

## Features

### 3D Modeling
- **Primitives**: Box, Sphere, Cylinder, Cone, Torus, Plane
- **Transform tools**: Move (G), Rotate (R), Scale (S) with interactive gizmos
- **View modes**: Solid, Wireframe, Shaded Wireframe, X-Ray
- **Camera views**: Perspective, Top, Front, Right, Isometric

### Scene Management
- Object tree with hierarchy support (groups/children)
- Layer system (create, toggle visibility, lock)
- History panel with undo/redo (Ctrl+Z / Ctrl+Y)
- Object properties: transform, material, primitive parameters

### AI Terminal
- **Natural language commands** in demo mode (no API key required)
- **OpenAI API integration** for advanced AI understanding
- **Custom endpoint support** for self-hosted models
- Command autocomplete and history navigation (↑/↓)

### Import/Export
- Native `.cadscene` JSON format (full fidelity)
- OBJ export
- STL export

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Terminal Commands

Open the AI Terminal with the button in the bottom bar, then type natural language commands:

```
create box                         # Create a 1×1×1 box
create sphere radius 2             # Create a sphere with radius 2
create cylinder with height 3      # Create a cylinder
move x 2 y 1 z 0                   # Move selected objects
rotate 45 degrees                  # Rotate selected 45° around Y
scale 2                            # Scale selected uniformly by 2
color red                          # Set material color to red
wireframe                          # Switch to wireframe view
select all                         # Select all objects
duplicate                          # Duplicate selected objects
delete                             # Delete selected objects
undo / redo                        # Undo/redo operations
help                               # Show all available commands
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| V | Select tool |
| G | Move tool |
| R | Rotate tool |
| S | Scale tool |
| Delete/Backspace | Delete selected |
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| Ctrl+D | Duplicate selected |
| Escape | Back to select tool |

## Viewport Controls

| Action | Control |
|--------|---------|
| Orbit | Left mouse drag |
| Pan | Right mouse drag / Middle mouse drag |
| Zoom | Scroll wheel |
| Select | Left click |
| Multi-select | Ctrl+Click |

## AI Integration

### Demo Mode (Default)
No API key required. Uses built-in natural language parsing for common CAD commands.

### OpenAI API
1. Open AI Terminal → Settings (gear icon)
2. Set mode to "OpenAI API"
3. Enter your API key (sk-...)
4. Commands will be processed with GPT for advanced understanding

### Custom Endpoint
For self-hosted models (Ollama, LM Studio, etc.) compatible with the OpenAI API format:
1. Open AI Terminal → Settings
2. Set mode to "Custom Endpoint"
3. Enter your endpoint URL (e.g., `http://localhost:11434/v1`)
4. Enter your model name

## Tech Stack

- **React 18** + TypeScript
- **Three.js** + React Three Fiber for 3D rendering
- **@react-three/drei** for helpers (OrbitControls, Grid, Gizmos)
- **Zustand** + Immer for state management
- **Tailwind CSS** for styling
- **Vite** for building

## Project Structure

```
src/
├── components/
│   ├── panels/          # UI panels (Toolbar, PropertyPanel, ObjectTree, etc.)
│   ├── terminal/        # AI terminal interface
│   ├── ui/              # Reusable UI components
│   └── viewport/        # 3D viewport components
├── lib/
│   ├── ai/              # Command parsing and AI execution
│   ├── formats/         # Import/export (OBJ, STL, native)
│   └── utils/           # Math, ID generation, time formatting
├── stores/              # Zustand state stores (scene, terminal)
├── types/               # TypeScript type definitions
└── styles/              # Global CSS
```
