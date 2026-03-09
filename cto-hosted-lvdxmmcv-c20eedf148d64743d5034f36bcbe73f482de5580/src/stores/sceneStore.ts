import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import * as THREE from 'three'
import type {
  CADObject,
  Layer,
  SceneSettings,
  HistoryEntry,
  ToolMode,
  ViewMode,
  PrimitiveParams,
  Transform,
  Material,
} from '@/types/cad'
import { generateId } from '@/lib/utils/id'

interface SceneState {
  objects: Record<string, CADObject>
  selectedIds: string[]
  hoveredId: string | null
  layers: Layer[]
  activeLayerId: string
  settings: SceneSettings
  history: HistoryEntry[]
  historyIndex: number
  undoStack: Array<{ description: string; snapshot: Record<string, CADObject> }>
  redoStack: Array<{ description: string; snapshot: Record<string, CADObject> }>
  toolMode: ToolMode
  viewMode: ViewMode
  cameraView: 'perspective' | 'top' | 'front' | 'right' | 'isometric'

  addObject: (object: CADObject) => void
  removeObject: (id: string) => void
  updateObject: (id: string, updates: Partial<CADObject>) => void
  selectObject: (id: string, additive?: boolean) => void
  deselectAll: () => void
  setHovered: (id: string | null) => void
  setToolMode: (mode: ToolMode) => void
  setViewMode: (mode: ViewMode) => void
  setCameraView: (view: SceneState['cameraView']) => void
  updateSettings: (settings: Partial<SceneSettings>) => void
  updateTransform: (id: string, transform: Partial<Transform>) => void
  updateMaterial: (id: string, material: Partial<Material>) => void
  addPrimitive: (type: PrimitiveParams['type'], params?: Partial<PrimitiveParams['params']>) => string
  duplicateObjects: (ids: string[]) => string[]
  groupObjects: (ids: string[]) => string
  ungroupObject: (id: string) => string[]
  deleteSelected: () => void
  addLayer: (name: string) => void
  removeLayer: (id: string) => void
  updateLayer: (id: string, updates: Partial<Layer>) => void
  setActiveLayer: (id: string) => void
  pushHistory: (description: string) => void
  undo: () => void
  redo: () => void
  clearScene: () => void
}

const defaultMaterial: Material = {
  color: '#5b9bd5',
  roughness: 0.5,
  metalness: 0.1,
  opacity: 1,
  wireframe: false,
}

const defaultTransform: Transform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
}

const defaultSettings: SceneSettings = {
  units: 'mm',
  gridSize: 100,
  gridDivisions: 20,
  showGrid: true,
  showAxes: true,
  showGizmo: true,
  backgroundColor: '#1a1a2e',
  ambientLightIntensity: 0.4,
  directionalLightIntensity: 1.0,
  shadowsEnabled: true,
  viewMode: 'solid',
  snapToGrid: false,
  snapAngle: 15,
  snapDistance: 0.5,
}

const defaultLayer: Layer = {
  id: 'default',
  name: 'Default',
  visible: true,
  locked: false,
  color: '#ffffff',
}

function buildPrimitiveObject(
  type: PrimitiveParams['type'],
  params?: Partial<PrimitiveParams['params']>,
  layerId = 'default'
): CADObject {
  const id = generateId()
  const base = {
    id,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)}_${id.slice(0, 4)}`,
    visible: true,
    locked: false,
    selected: false,
    transform: { ...defaultTransform },
    material: { ...defaultMaterial },
    parentId: null,
    childIds: [],
    layer: layerId,
    userData: {},
  }

  switch (type) {
    case 'box':
      return {
        ...base,
        kind: 'primitive',
        primitive: {
          type: 'box',
          params: { width: 1, height: 1, depth: 1, ...params } as import('@/types/cad').BoxParams,
        },
      }
    case 'sphere':
      return {
        ...base,
        kind: 'primitive',
        primitive: {
          type: 'sphere',
          params: {
            radius: 0.5,
            widthSegments: 32,
            heightSegments: 16,
            ...params,
          } as import('@/types/cad').SphereParams,
        },
      }
    case 'cylinder':
      return {
        ...base,
        kind: 'primitive',
        primitive: {
          type: 'cylinder',
          params: {
            radiusTop: 0.5,
            radiusBottom: 0.5,
            height: 1,
            radialSegments: 32,
            ...params,
          } as import('@/types/cad').CylinderParams,
        },
      }
    case 'cone':
      return {
        ...base,
        kind: 'primitive',
        primitive: {
          type: 'cone',
          params: {
            radius: 0.5,
            height: 1,
            radialSegments: 32,
            ...params,
          } as import('@/types/cad').ConeParams,
        },
      }
    case 'torus':
      return {
        ...base,
        kind: 'primitive',
        primitive: {
          type: 'torus',
          params: {
            radius: 0.5,
            tube: 0.2,
            radialSegments: 16,
            tubularSegments: 100,
            ...params,
          } as import('@/types/cad').TorusParams,
        },
      }
    case 'plane':
      return {
        ...base,
        kind: 'primitive',
        primitive: {
          type: 'plane',
          params: { width: 2, height: 2, ...params } as import('@/types/cad').PlaneParams,
        },
      }
    default: {
      const _exhaustive: never = type
      throw new Error(`Unknown primitive type: ${_exhaustive}`)
    }
  }
}

export const useSceneStore = create<SceneState>()(
  immer((set, get) => ({
    objects: {},
    selectedIds: [],
    hoveredId: null,
    layers: [defaultLayer],
    activeLayerId: 'default',
    settings: defaultSettings,
    history: [],
    historyIndex: -1,
    undoStack: [],
    redoStack: [],
    toolMode: 'select',
    viewMode: 'solid',
    cameraView: 'perspective',

    addObject: (object) => {
      set((state) => {
        state.objects[object.id] = object
      })
    },

    removeObject: (id) => {
      set((state) => {
        const obj = state.objects[id]
        if (!obj) return
        if (obj.parentId && state.objects[obj.parentId]) {
          const parent = state.objects[obj.parentId]
          parent.childIds = parent.childIds.filter((cid) => cid !== id)
        }
        obj.childIds.forEach((cid) => {
          if (state.objects[cid]) {
            state.objects[cid].parentId = null
          }
        })
        delete state.objects[id]
        state.selectedIds = state.selectedIds.filter((sid) => sid !== id)
      })
    },

    updateObject: (id, updates) => {
      set((state) => {
        if (state.objects[id]) {
          Object.assign(state.objects[id], updates)
        }
      })
    },

    selectObject: (id, additive = false) => {
      set((state) => {
        if (!additive) {
          Object.values(state.objects).forEach((obj) => {
            obj.selected = false
          })
          state.selectedIds = []
        }
        if (state.objects[id]) {
          state.objects[id].selected = true
          if (!state.selectedIds.includes(id)) {
            state.selectedIds.push(id)
          }
        }
      })
    },

    deselectAll: () => {
      set((state) => {
        Object.values(state.objects).forEach((obj) => {
          obj.selected = false
        })
        state.selectedIds = []
      })
    },

    setHovered: (id) => {
      set((state) => {
        state.hoveredId = id
      })
    },

    setToolMode: (mode) => {
      set((state) => {
        state.toolMode = mode
      })
    },

    setViewMode: (mode) => {
      set((state) => {
        state.viewMode = mode
        state.settings.viewMode = mode
      })
    },

    setCameraView: (view) => {
      set((state) => {
        state.cameraView = view
      })
    },

    updateSettings: (settings) => {
      set((state) => {
        Object.assign(state.settings, settings)
      })
    },

    updateTransform: (id, transform) => {
      set((state) => {
        if (state.objects[id]) {
          Object.assign(state.objects[id].transform, transform)
        }
      })
    },

    updateMaterial: (id, material) => {
      set((state) => {
        if (state.objects[id]) {
          Object.assign(state.objects[id].material, material)
        }
      })
    },

    addPrimitive: (type, params) => {
      const { activeLayerId } = get()
      const object = buildPrimitiveObject(type, params, activeLayerId)
      get().pushHistory(`Add ${type}`)
      set((state) => {
        state.objects[object.id] = object as unknown as CADObject
      })
      return object.id
    },

    duplicateObjects: (ids) => {
      const { objects } = get()
      const newIds: string[] = []
      get().pushHistory('Duplicate objects')
      set((state) => {
        ids.forEach((id) => {
          const source = objects[id]
          if (!source) return
          const newId = generateId()
          const copy = JSON.parse(JSON.stringify(source)) as CADObject
          copy.id = newId
          copy.name = `${source.name}_copy`
          copy.selected = true
          copy.transform.position.x += 0.5
          copy.transform.position.y += 0.5
          state.objects[newId] = copy
          newIds.push(newId)
        })
        ids.forEach((id) => {
          if (state.objects[id]) state.objects[id].selected = false
        })
        state.selectedIds = newIds
      })
      return newIds
    },

    groupObjects: (ids) => {
      const { activeLayerId } = get()
      const groupId = generateId()
      get().pushHistory('Group objects')
      set((state) => {
        const group: import('@/types/cad').GroupObject = {
          id: groupId,
          kind: 'group',
          name: `Group_${groupId.slice(0, 4)}`,
          visible: true,
          locked: false,
          selected: true,
          transform: { ...defaultTransform },
          material: { ...defaultMaterial },
          parentId: null,
          childIds: [...ids],
          layer: activeLayerId,
          userData: {},
        }
        state.objects[groupId] = group
        ids.forEach((id) => {
          if (state.objects[id]) {
            state.objects[id].parentId = groupId
            state.objects[id].selected = false
          }
        })
        state.selectedIds = [groupId]
      })
      return groupId
    },

    ungroupObject: (id) => {
      const { objects } = get()
      const group = objects[id]
      if (!group || group.kind !== 'group') return []
      const childIds = [...group.childIds]
      get().pushHistory('Ungroup')
      set((state) => {
        childIds.forEach((cid) => {
          if (state.objects[cid]) {
            state.objects[cid].parentId = null
            state.objects[cid].selected = true
          }
        })
        delete state.objects[id]
        state.selectedIds = childIds
      })
      return childIds
    },

    deleteSelected: () => {
      const { selectedIds } = get()
      if (selectedIds.length === 0) return
      get().pushHistory(`Delete ${selectedIds.length} object(s)`)
      set((state) => {
        selectedIds.forEach((id) => {
          delete state.objects[id]
        })
        state.selectedIds = []
      })
    },

    addLayer: (name) => {
      const id = generateId()
      set((state) => {
        state.layers.push({
          id,
          name,
          visible: true,
          locked: false,
          color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'),
        })
      })
    },

    removeLayer: (id) => {
      if (id === 'default') return
      set((state) => {
        state.layers = state.layers.filter((l) => l.id !== id)
        Object.values(state.objects).forEach((obj) => {
          if (obj.layer === id) obj.layer = 'default'
        })
        if (state.activeLayerId === id) state.activeLayerId = 'default'
      })
    },

    updateLayer: (id, updates) => {
      set((state) => {
        const layer = state.layers.find((l) => l.id === id)
        if (layer) Object.assign(layer, updates)
      })
    },

    setActiveLayer: (id) => {
      set((state) => {
        state.activeLayerId = id
      })
    },

    pushHistory: (description) => {
      const { objects } = get()
      const snapshot = JSON.parse(JSON.stringify(objects)) as Record<string, CADObject>
      set((state) => {
        state.undoStack.push({ description, snapshot })
        if (state.undoStack.length > 50) state.undoStack.shift()
        state.redoStack = []
        state.history.push({
          id: generateId(),
          description,
          timestamp: Date.now(),
          objectIds: Object.keys(objects),
        })
        if (state.history.length > 100) state.history.shift()
      })
    },

    undo: () => {
      const { undoStack, objects } = get()
      if (undoStack.length === 0) return
      const entry = undoStack[undoStack.length - 1]
      const currentSnapshot = JSON.parse(JSON.stringify(objects)) as Record<string, CADObject>
      set((state) => {
        state.redoStack.push({ description: entry.description, snapshot: currentSnapshot })
        state.undoStack.pop()
        state.objects = entry.snapshot as typeof state.objects
        state.selectedIds = []
      })
    },

    redo: () => {
      const { redoStack, objects } = get()
      if (redoStack.length === 0) return
      const entry = redoStack[redoStack.length - 1]
      const currentSnapshot = JSON.parse(JSON.stringify(objects)) as Record<string, CADObject>
      set((state) => {
        state.undoStack.push({ description: entry.description, snapshot: currentSnapshot })
        state.redoStack.pop()
        state.objects = entry.snapshot as typeof state.objects
        state.selectedIds = []
      })
    },

    clearScene: () => {
      get().pushHistory('Clear scene')
      set((state) => {
        state.objects = {}
        state.selectedIds = []
        state.hoveredId = null
      })
    },
  }))
)

export function useSelectedObjects() {
  return useSceneStore((state) =>
    state.selectedIds.map((id) => state.objects[id]).filter(Boolean)
  )
}

export function useObjectById(id: string) {
  return useSceneStore((state) => state.objects[id])
}

export function useLayerObjects(layerId: string) {
  return useSceneStore((state) =>
    Object.values(state.objects).filter((obj) => obj.layer === layerId)
  )
}

export const cameraTargetRef = { current: new THREE.Vector3(0, 0, 0) }
