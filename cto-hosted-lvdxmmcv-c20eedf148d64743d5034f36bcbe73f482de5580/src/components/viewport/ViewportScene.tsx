import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei'
import * as THREE from 'three'
import { useSceneStore } from '@/stores/sceneStore'
import { SceneObjectMesh } from './SceneObject'
import { TransformGizmo } from './TransformGizmo'

type OrbitControlsRef = {
  target: THREE.Vector3
  update: () => void
}

export function ViewportScene() {
  const {
    objects,
    settings,
    viewMode,
    selectedIds,
    deselectAll,
    toolMode,
    cameraView,
  } = useSceneStore()

  const { camera } = useThree()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null)
  const directionalLightRef = useRef<THREE.DirectionalLight>(null)

  useEffect(() => {
    if (!controlsRef.current) return
    const controls = controlsRef.current as OrbitControlsRef
    const cam = camera as THREE.PerspectiveCamera

    const setView = (pos: THREE.Vector3, target: THREE.Vector3) => {
      cam.position.copy(pos)
      controls.target.copy(target)
      controls.update()
    }

    switch (cameraView) {
      case 'top':
        setView(new THREE.Vector3(0, 10, 0.001), new THREE.Vector3(0, 0, 0))
        break
      case 'front':
        setView(new THREE.Vector3(0, 0, 10), new THREE.Vector3(0, 0, 0))
        break
      case 'right':
        setView(new THREE.Vector3(10, 0, 0), new THREE.Vector3(0, 0, 0))
        break
      case 'isometric':
        setView(new THREE.Vector3(7, 7, 7), new THREE.Vector3(0, 0, 0))
        break
      case 'perspective':
        setView(new THREE.Vector3(5, 4, 6), new THREE.Vector3(0, 0, 0))
        break
    }
  }, [cameraView, camera])

  useFrame(() => {
    if (directionalLightRef.current) {
      const cam = camera as THREE.PerspectiveCamera
      directionalLightRef.current.position.set(
        cam.position.x + 5,
        cam.position.y + 8,
        cam.position.z + 5
      )
    }
  })

  const handleBackgroundClick = () => {
    if (toolMode === 'select') {
      deselectAll()
    }
  }

  const visibleObjects = Object.values(objects).filter(
    (obj) => obj.visible && obj.kind === 'primitive' && !obj.parentId
  )

  return (
    <>
      <color attach="background" args={[settings.backgroundColor]} />
      <fog attach="fog" args={[settings.backgroundColor, 30, 120]} />

      <ambientLight intensity={settings.ambientLightIntensity} />
      <directionalLight
        ref={directionalLightRef}
        intensity={settings.directionalLightIntensity}
        position={[5, 8, 5]}
        castShadow={settings.shadowsEnabled}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[-5, 5, -5]} intensity={0.3} />
      <hemisphereLight
        args={['#dbeafe', '#1e293b', 0.3]}
      />

      {settings.showGrid && (
        <Grid
          args={[settings.gridSize, settings.gridDivisions]}
          position={[0, -0.01, 0]}
          cellColor="#1e3a5f"
          sectionColor="#2563eb"
          sectionThickness={1}
          fadeDistance={50}
          fadeStrength={1}
        />
      )}

      {settings.showGizmo && (
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport
            axisColors={['#ef4444', '#22c55e', '#3b82f6']}
            labelColor="white"
          />
        </GizmoHelper>
      )}

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        onPointerDown={handleBackgroundClick}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>

      {visibleObjects.map((obj) => (
        <SceneObjectMesh key={obj.id} object={obj} viewMode={viewMode} />
      ))}

      {selectedIds.length > 0 && (
        <TransformGizmo selectedIds={selectedIds} />
      )}

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        screenSpacePanning={false}
        minDistance={0.5}
        maxDistance={100}
        makeDefault
      />
    </>
  )
}
