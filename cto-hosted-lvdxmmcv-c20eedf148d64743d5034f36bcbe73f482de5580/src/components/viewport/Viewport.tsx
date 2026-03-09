import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ViewportScene } from './ViewportScene'
import { useSceneStore } from '@/stores/sceneStore'

function ViewportLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-surface-200 text-sm">Loading 3D viewport...</div>
    </div>
  )
}

export function Viewport() {
  const { settings } = useSceneStore()

  return (
    <div className="relative w-full h-full bg-[#1a1a2e]">
      <Canvas
        shadows={settings.shadowsEnabled}
        camera={{ position: [5, 4, 6], fov: 60, near: 0.01, far: 1000 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ViewportScene />
        </Suspense>
      </Canvas>
      <ViewportOverlay />
    </div>
  )
}

function ViewportOverlay() {
  const { settings, viewMode, objects, selectedIds } = useSceneStore()
  const objectCount = Object.keys(objects).length

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-3 left-3 flex gap-2 items-center">
        <span className="text-xs text-surface-200 bg-black/40 backdrop-blur-sm px-2 py-1 rounded">
          {viewMode.toUpperCase()}
        </span>
        <span className="text-xs text-surface-200 bg-black/40 backdrop-blur-sm px-2 py-1 rounded">
          {settings.units.toUpperCase()}
        </span>
      </div>

      <div className="absolute bottom-3 left-3 text-xs text-surface-200 bg-black/40 backdrop-blur-sm px-2 py-1 rounded">
        Objects: {objectCount} | Selected: {selectedIds.length}
      </div>

      <div className="absolute bottom-3 right-3 text-xs text-surface-200 bg-black/40 backdrop-blur-sm px-2 py-1 rounded">
        AI CAD System v0.1
      </div>
    </div>
  )
}
