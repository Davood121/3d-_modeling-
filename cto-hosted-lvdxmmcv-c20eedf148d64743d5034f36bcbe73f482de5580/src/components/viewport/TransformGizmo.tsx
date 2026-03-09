import { useRef, useCallback } from 'react'
import { ThreeEvent, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSceneStore } from '@/stores/sceneStore'

interface TransformGizmoProps {
  selectedIds: string[]
}

export function TransformGizmo({ selectedIds }: TransformGizmoProps) {
  const { objects, toolMode, updateTransform, pushHistory } = useSceneStore()
  const { camera, gl } = useThree()
  const isDragging = useRef(false)
  const dragAxis = useRef<'x' | 'y' | 'z' | null>(null)
  const dragStart = useRef<THREE.Vector2>(new THREE.Vector2())
  const objectStartPositions = useRef<Record<string, THREE.Vector3>>({})

  if (!['move', 'rotate', 'scale'].includes(toolMode)) return null

  const selectedObjects = selectedIds.map((id) => objects[id]).filter(Boolean)
  if (selectedObjects.length === 0) return null

  const center = new THREE.Vector3()
  selectedObjects.forEach((obj) => {
    center.add(new THREE.Vector3(
      obj.transform.position.x,
      obj.transform.position.y,
      obj.transform.position.z
    ))
  })
  center.divideScalar(selectedObjects.length)

  const gizmoSize = 0.8

  const handleArrowPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>, axis: 'x' | 'y' | 'z') => {
      e.stopPropagation()
      isDragging.current = true
      dragAxis.current = axis
      dragStart.current.set(e.clientX, e.clientY)

      selectedIds.forEach((id) => {
        const obj = objects[id]
        if (obj) {
          objectStartPositions.current[id] = new THREE.Vector3(
            obj.transform.position.x,
            obj.transform.position.y,
            obj.transform.position.z
          )
        }
      })

      pushHistory('Move objects')

      const onMove = (ev: PointerEvent) => {
        if (!isDragging.current) return
        const delta = new THREE.Vector2(ev.clientX, ev.clientY).sub(dragStart.current)
        const sensitivity = 0.01
        let moveAmount = 0

        if (axis === 'x') moveAmount = delta.x * sensitivity
        else if (axis === 'y') moveAmount = -delta.y * sensitivity
        else if (axis === 'z') moveAmount = delta.x * sensitivity

        selectedIds.forEach((id) => {
          const startPos = objectStartPositions.current[id]
          if (!startPos) return
          updateTransform(id, {
            position: {
              x: startPos.x + (axis === 'x' ? moveAmount : 0),
              y: startPos.y + (axis === 'y' ? moveAmount : 0),
              z: startPos.z + (axis === 'z' ? moveAmount : 0),
            },
          })
        })
      }

      const onUp = () => {
        isDragging.current = false
        dragAxis.current = null
        gl.domElement.removeEventListener('pointermove', onMove)
        gl.domElement.removeEventListener('pointerup', onUp)
      }

      gl.domElement.addEventListener('pointermove', onMove)
      gl.domElement.addEventListener('pointerup', onUp)
    },
    [selectedIds, objects, pushHistory, updateTransform, gl]
  )

  return (
    <group position={[center.x, center.y, center.z]}>
      {toolMode === 'move' && (
        <>
          <ArrowGizmo
            direction={[1, 0, 0]}
            color="#ef4444"
            size={gizmoSize}
            axis="x"
            onPointerDown={handleArrowPointerDown}
          />
          <ArrowGizmo
            direction={[0, 1, 0]}
            color="#22c55e"
            size={gizmoSize}
            axis="y"
            onPointerDown={handleArrowPointerDown}
          />
          <ArrowGizmo
            direction={[0, 0, 1]}
            color="#3b82f6"
            size={gizmoSize}
            axis="z"
            onPointerDown={handleArrowPointerDown}
          />
          <CenterHandle />
        </>
      )}
      {toolMode === 'scale' && (
        <>
          <ScaleHandle direction={[gizmoSize + 0.1, 0, 0]} color="#ef4444" />
          <ScaleHandle direction={[0, gizmoSize + 0.1, 0]} color="#22c55e" />
          <ScaleHandle direction={[0, 0, gizmoSize + 0.1]} color="#3b82f6" />
        </>
      )}
      {toolMode === 'rotate' && (
        <RotateRing />
      )}
    </group>
  )
}

interface ArrowGizmoProps {
  direction: [number, number, number]
  color: string
  size: number
  axis: 'x' | 'y' | 'z'
  onPointerDown: (e: ThreeEvent<PointerEvent>, axis: 'x' | 'y' | 'z') => void
}

function ArrowGizmo({ direction, color, size, axis, onPointerDown }: ArrowGizmoProps) {
  const quaternion = new THREE.Quaternion()
  const dir = new THREE.Vector3(...direction).normalize()
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)

  return (
    <group quaternion={quaternion}>
      <mesh
        position={[0, size / 2, 0]}
        onPointerDown={(e) => onPointerDown(e, axis)}
      >
        <cylinderGeometry args={[0.025, 0.025, size, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh
        position={[0, size, 0]}
        onPointerDown={(e) => onPointerDown(e, axis)}
      >
        <coneGeometry args={[0.07, 0.2, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

function ScaleHandle({ direction, color }: { direction: [number, number, number]; color: string }) {
  return (
    <mesh position={direction}>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

function CenterHandle() {
  return (
    <mesh>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  )
}

function RotateRing() {
  return (
    <group>
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[0.9, 0.02, 8, 64]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.02, 8, 64]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.9, 0.02, 8, 64]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  )
}
