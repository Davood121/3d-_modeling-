import { useRef, useMemo, useCallback } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { CADObject, PrimitiveObject, ViewMode } from '@/types/cad'
import { useSceneStore } from '@/stores/sceneStore'

interface SceneObjectProps {
  object: CADObject
  viewMode: ViewMode
}

function createGeometry(obj: PrimitiveObject): THREE.BufferGeometry {
  const { primitive } = obj
  switch (primitive.type) {
    case 'box': {
      const p = primitive.params
      return new THREE.BoxGeometry(p.width, p.height, p.depth)
    }
    case 'sphere': {
      const p = primitive.params
      return new THREE.SphereGeometry(p.radius, p.widthSegments, p.heightSegments)
    }
    case 'cylinder': {
      const p = primitive.params
      return new THREE.CylinderGeometry(p.radiusTop, p.radiusBottom, p.height, p.radialSegments)
    }
    case 'cone': {
      const p = primitive.params
      return new THREE.ConeGeometry(p.radius, p.height, p.radialSegments)
    }
    case 'torus': {
      const p = primitive.params
      return new THREE.TorusGeometry(p.radius, p.tube, p.radialSegments, p.tubularSegments)
    }
    case 'plane': {
      const p = primitive.params
      return new THREE.PlaneGeometry(p.width, p.height)
    }
    default:
      return new THREE.BoxGeometry(1, 1, 1)
  }
}

export function SceneObjectMesh({ object, viewMode }: SceneObjectProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { selectObject, setHovered, hoveredId, toolMode } = useSceneStore()

  const geometry = useMemo(() => {
    if (object.kind === 'primitive') {
      return createGeometry(object as PrimitiveObject)
    }
    return new THREE.BoxGeometry(1, 1, 1)
  }, [object])

  const isSelected = object.selected
  const isHovered = hoveredId === object.id
  const isWireframe = viewMode === 'wireframe'
  const isXray = viewMode === 'xray'

  const material = useMemo(() => {
    const color = new THREE.Color(object.material.color)

    if (isWireframe) {
      return new THREE.MeshBasicMaterial({ color, wireframe: true })
    }

    if (isSelected) {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color('#60a5fa'),
        roughness: 0.3,
        metalness: 0.1,
        emissive: new THREE.Color('#1d4ed8'),
        emissiveIntensity: 0.15,
        transparent: isXray,
        opacity: isXray ? 0.6 : 1,
      })
    }

    if (isHovered && toolMode === 'select') {
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(object.material.color).lerp(new THREE.Color('#93c5fd'), 0.3),
        roughness: object.material.roughness,
        metalness: object.material.metalness,
        emissive: new THREE.Color('#1e3a5f'),
        emissiveIntensity: 0.1,
        transparent: isXray,
        opacity: isXray ? 0.6 : object.material.opacity,
      })
    }

    return new THREE.MeshStandardMaterial({
      color,
      roughness: object.material.roughness,
      metalness: object.material.metalness,
      transparent: isXray || object.material.opacity < 1,
      opacity: isXray ? 0.5 : object.material.opacity,
      wireframe: object.material.wireframe,
    })
  }, [object.material, isSelected, isHovered, isWireframe, isXray, toolMode])

  const wireframeOverlay = useMemo(() => {
    if (viewMode !== 'shaded-wireframe') return null
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color('#1e3a5f'),
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    })
  }, [viewMode])

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      if (toolMode === 'select' || toolMode === 'move' || toolMode === 'rotate' || toolMode === 'scale') {
        selectObject(object.id, e.ctrlKey || e.metaKey || e.shiftKey)
      }
    },
    [object.id, selectObject, toolMode]
  )

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      setHovered(object.id)
      document.body.style.cursor = 'pointer'
    },
    [object.id, setHovered]
  )

  const handlePointerOut = useCallback(
    (_e: ThreeEvent<PointerEvent>) => {
      setHovered(null)
      document.body.style.cursor = 'default'
    },
    [setHovered]
  )

  if (!object.visible) return null

  const { position, rotation, scale } = object.transform

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
      scale={[scale.x, scale.y, scale.z]}
    >
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      />
      {wireframeOverlay && (
        <mesh geometry={geometry} material={wireframeOverlay} />
      )}
      {isSelected && (
        <mesh geometry={geometry}>
          <meshBasicMaterial
            color="#60a5fa"
            wireframe
            transparent
            opacity={0.4}
          />
        </mesh>
      )}
    </group>
  )
}
