import * as THREE from 'three'

export type PrimitiveType =
  | 'box'
  | 'sphere'
  | 'cylinder'
  | 'cone'
  | 'torus'
  | 'plane'

export type OperationType =
  | 'union'
  | 'subtract'
  | 'intersect'
  | 'extrude'
  | 'revolve'
  | 'fillet'
  | 'chamfer'

export type ToolMode =
  | 'select'
  | 'move'
  | 'rotate'
  | 'scale'
  | 'box'
  | 'sphere'
  | 'cylinder'
  | 'cone'
  | 'torus'
  | 'plane'
  | 'sketch'
  | 'measure'
  | 'boolean-union'
  | 'boolean-subtract'
  | 'boolean-intersect'

export type ViewMode = 'solid' | 'wireframe' | 'shaded-wireframe' | 'xray'

export type SketchEntityType = 'line' | 'circle' | 'arc' | 'rectangle' | 'polygon' | 'spline'

export interface Transform {
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
}

export interface Material {
  color: string
  roughness: number
  metalness: number
  opacity: number
  wireframe: boolean
}

export interface CADObjectBase {
  id: string
  name: string
  visible: boolean
  locked: boolean
  selected: boolean
  transform: Transform
  material: Material
  parentId: string | null
  childIds: string[]
  layer: string
  userData: Record<string, unknown>
}

export interface BoxParams {
  width: number
  height: number
  depth: number
}

export interface SphereParams {
  radius: number
  widthSegments: number
  heightSegments: number
}

export interface CylinderParams {
  radiusTop: number
  radiusBottom: number
  height: number
  radialSegments: number
}

export interface ConeParams {
  radius: number
  height: number
  radialSegments: number
}

export interface TorusParams {
  radius: number
  tube: number
  radialSegments: number
  tubularSegments: number
}

export interface PlaneParams {
  width: number
  height: number
}

export type PrimitiveParams =
  | { type: 'box'; params: BoxParams }
  | { type: 'sphere'; params: SphereParams }
  | { type: 'cylinder'; params: CylinderParams }
  | { type: 'cone'; params: ConeParams }
  | { type: 'torus'; params: TorusParams }
  | { type: 'plane'; params: PlaneParams }

export interface PrimitiveObject extends CADObjectBase {
  kind: 'primitive'
  primitive: PrimitiveParams
}

export interface GroupObject extends CADObjectBase {
  kind: 'group'
}

export interface SketchPoint {
  id: string
  x: number
  y: number
}

export interface SketchLine {
  id: string
  type: 'line'
  startId: string
  endId: string
}

export interface SketchCircle {
  id: string
  type: 'circle'
  centerId: string
  radius: number
}

export interface SketchArc {
  id: string
  type: 'arc'
  centerId: string
  radius: number
  startAngle: number
  endAngle: number
}

export interface SketchRectangle {
  id: string
  type: 'rectangle'
  x: number
  y: number
  width: number
  height: number
}

export type SketchEntity = SketchLine | SketchCircle | SketchArc | SketchRectangle

export interface SketchConstraint {
  id: string
  type: 'coincident' | 'parallel' | 'perpendicular' | 'horizontal' | 'vertical' | 'distance' | 'angle' | 'tangent'
  entityIds: string[]
  value?: number
}

export interface SketchObject extends CADObjectBase {
  kind: 'sketch'
  planeNormal: { x: number; y: number; z: number }
  planeOrigin: { x: number; y: number; z: number }
  points: Record<string, SketchPoint>
  entities: SketchEntity[]
  constraints: SketchConstraint[]
}

export interface ExtrudeObject extends CADObjectBase {
  kind: 'extrude'
  sketchId: string
  distance: number
  symmetric: boolean
}

export interface RevolveObject extends CADObjectBase {
  kind: 'revolve'
  sketchId: string
  axis: { x: number; y: number; z: number }
  angle: number
}

export interface BooleanObject extends CADObjectBase {
  kind: 'boolean'
  operation: 'union' | 'subtract' | 'intersect'
  targetId: string
  toolId: string
}

export interface MeasurementObject extends CADObjectBase {
  kind: 'measurement'
  measureType: 'distance' | 'angle' | 'area' | 'volume'
  points: { x: number; y: number; z: number }[]
  value: number
  unit: string
}

export type CADObject =
  | PrimitiveObject
  | GroupObject
  | SketchObject
  | ExtrudeObject
  | RevolveObject
  | BooleanObject
  | MeasurementObject

export interface Layer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  color: string
}

export interface UndoCommand {
  id: string
  type: string
  description: string
  timestamp: number
  undo: () => void
  redo: () => void
}

export interface HistoryEntry {
  id: string
  description: string
  timestamp: number
  objectIds: string[]
}

export interface SceneSettings {
  units: 'mm' | 'cm' | 'm' | 'in' | 'ft'
  gridSize: number
  gridDivisions: number
  showGrid: boolean
  showAxes: boolean
  showGizmo: boolean
  backgroundColor: string
  ambientLightIntensity: number
  directionalLightIntensity: number
  shadowsEnabled: boolean
  viewMode: ViewMode
  snapToGrid: boolean
  snapAngle: number
  snapDistance: number
}

export interface CameraState {
  position: THREE.Vector3
  target: THREE.Vector3
  up: THREE.Vector3
  fov: number
  near: number
  far: number
  orthographic: boolean
  orthographicZoom: number
}

export interface TerminalEntry {
  id: string
  type: 'user' | 'system' | 'error' | 'info' | 'result'
  content: string
  timestamp: number
}

export interface AIToolCall {
  tool: string
  params: Record<string, unknown>
  result?: unknown
  error?: string
}

export interface AIResponse {
  content: string
  toolCalls?: AIToolCall[]
  success: boolean
}
