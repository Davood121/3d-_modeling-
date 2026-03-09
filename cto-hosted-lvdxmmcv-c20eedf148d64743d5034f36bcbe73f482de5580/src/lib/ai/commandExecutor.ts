import { parseCommand } from './commandParser'
import type { ParsedCommand } from './commandParser'
import type { AIResponse } from '@/types/cad'
import { useSceneStore } from '@/stores/sceneStore'
import { formatNumber } from '@/lib/utils/math'
import { generateId } from '@/lib/utils/id'

const HELP_TEXT = `
Available commands:

PRIMITIVES:
  create box [width] [height] [depth]
  create sphere [radius]
  create cylinder [radius] [height]
  create cone [radius] [height]
  create torus [radius]
  create plane [width] [height]

TRANSFORM (on selected objects):
  move x [value] y [value] z [value]
  rotate [angle] degrees
  scale [value]

SELECTION:
  select all
  deselect / clear selection

OPERATIONS:
  duplicate / copy
  group / ungroup
  delete / remove
  boolean union / subtract / intersect
  undo / redo

MATERIALS:
  color [red|green|blue|#hex...]
  set color to orange

VIEW:
  wireframe / solid / xray
  top view / front view / right view / perspective
  show/hide grid

OTHER:
  rename [name]
  clear scene / delete all
  help
`.trim()

export interface ExecutionResult {
  success: boolean
  message: string
  objectIds?: string[]
  data?: Record<string, unknown>
}

export function executeCommand(command: ParsedCommand): ExecutionResult {
  const store = useSceneStore.getState()

  switch (command.action) {
    case 'help':
      return { success: true, message: HELP_TEXT }

    case 'create': {
      if (!command.target) {
        return { success: false, message: 'No primitive type specified.' }
      }
      const validTypes = ['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane']
      if (!validTypes.includes(command.target)) {
        return { success: false, message: `Unknown primitive type: ${command.target}` }
      }
      const id = store.addPrimitive(
        command.target as import('@/types/cad').PrimitiveParams['type'],
        command.params as Partial<import('@/types/cad').PrimitiveParams['params']>
      )
      store.selectObject(id)
      const obj = useSceneStore.getState().objects[id]
      return {
        success: true,
        message: `✓ Created ${command.target}: ${obj?.name || id}`,
        objectIds: [id],
      }
    }

    case 'deleteSelected': {
      const { selectedIds } = store
      if (selectedIds.length === 0) {
        return { success: false, message: 'No objects selected.' }
      }
      const count = selectedIds.length
      store.deleteSelected()
      return { success: true, message: `✓ Deleted ${count} object(s)` }
    }

    case 'clearScene': {
      const count = Object.keys(store.objects).length
      store.clearScene()
      return { success: true, message: `✓ Cleared scene (removed ${count} objects)` }
    }

    case 'selectAll': {
      const ids = Object.keys(store.objects)
      if (ids.length === 0) {
        return { success: false, message: 'No objects in scene.' }
      }
      store.deselectAll()
      ids.forEach((id, i) => store.selectObject(id, i > 0))
      return { success: true, message: `✓ Selected ${ids.length} object(s)` }
    }

    case 'deselectAll': {
      store.deselectAll()
      return { success: true, message: '✓ Deselected all' }
    }

    case 'duplicate': {
      const { selectedIds } = store
      if (selectedIds.length === 0) {
        return { success: false, message: 'No objects selected to duplicate.' }
      }
      const newIds = store.duplicateObjects(selectedIds)
      return {
        success: true,
        message: `✓ Duplicated ${newIds.length} object(s)`,
        objectIds: newIds,
      }
    }

    case 'group': {
      const { selectedIds } = store
      if (selectedIds.length < 2) {
        return { success: false, message: 'Select at least 2 objects to group.' }
      }
      const groupId = store.groupObjects(selectedIds)
      return { success: true, message: '✓ Grouped objects', objectIds: [groupId] }
    }

    case 'ungroup': {
      const { selectedIds } = store
      if (selectedIds.length === 0) {
        return { success: false, message: 'No group selected.' }
      }
      const children = store.ungroupObject(selectedIds[0])
      return { success: true, message: `✓ Ungrouped into ${children.length} objects` }
    }

    case 'move': {
      const { selectedIds } = store
      if (selectedIds.length === 0) {
        return { success: false, message: 'No objects selected to move.' }
      }
      store.pushHistory('Move objects')
      const x = typeof command.params.x === 'number' ? command.params.x : 0
      const y = typeof command.params.y === 'number' ? command.params.y : 0
      const z = typeof command.params.z === 'number' ? command.params.z : 0
      selectedIds.forEach((id) => {
        const obj = store.objects[id]
        if (!obj) return
        store.updateTransform(id, {
          position: {
            x: obj.transform.position.x + x,
            y: obj.transform.position.y + y,
            z: obj.transform.position.z + z,
          },
        })
      })
      return {
        success: true,
        message: `✓ Moved ${selectedIds.length} object(s) by (${formatNumber(x)}, ${formatNumber(y)}, ${formatNumber(z)})`,
      }
    }

    case 'rotate': {
      const { selectedIds } = store
      if (selectedIds.length === 0) {
        return { success: false, message: 'No objects selected to rotate.' }
      }
      store.pushHistory('Rotate objects')
      const angle = typeof command.params.angle === 'number' ? command.params.angle : 0
      const axis = (command.params.axis as string) || 'y'
      const radians = (angle * Math.PI) / 180
      selectedIds.forEach((id) => {
        const obj = store.objects[id]
        if (!obj) return
        const rot = { ...obj.transform.rotation }
        if (axis === 'x') rot.x += radians
        else if (axis === 'z') rot.z += radians
        else rot.y += radians
        store.updateTransform(id, { rotation: rot })
      })
      return {
        success: true,
        message: `✓ Rotated ${selectedIds.length} object(s) by ${formatNumber(angle)}° around ${axis.toUpperCase()}`,
      }
    }

    case 'scale': {
      const { selectedIds } = store
      if (selectedIds.length === 0) {
        return { success: false, message: 'No objects selected to scale.' }
      }
      store.pushHistory('Scale objects')
      const uniform = typeof command.params.uniform === 'number' ? command.params.uniform : 1
      const sx = typeof command.params.x === 'number' ? command.params.x : uniform
      const sy = typeof command.params.y === 'number' ? command.params.y : uniform
      const sz = typeof command.params.z === 'number' ? command.params.z : uniform
      selectedIds.forEach((id) => {
        const obj = store.objects[id]
        if (!obj) return
        store.updateTransform(id, {
          scale: {
            x: obj.transform.scale.x * sx,
            y: obj.transform.scale.y * sy,
            z: obj.transform.scale.z * sz,
          },
        })
      })
      return {
        success: true,
        message: `✓ Scaled ${selectedIds.length} object(s)`,
      }
    }

    case 'setMaterial': {
      const { selectedIds } = store
      if (selectedIds.length === 0) {
        return { success: false, message: 'No objects selected.' }
      }
      store.pushHistory('Set material')
      selectedIds.forEach((id) => {
        store.updateMaterial(id, command.params as Partial<import('@/types/cad').Material>)
      })
      return {
        success: true,
        message: `✓ Updated material for ${selectedIds.length} object(s)`,
      }
    }

    case 'setViewMode': {
      const mode = command.target as import('@/types/cad').ViewMode
      store.setViewMode(mode)
      return { success: true, message: `✓ View mode: ${mode}` }
    }

    case 'setCameraView': {
      type CameraView = 'perspective' | 'top' | 'front' | 'right' | 'isometric'
      const view = command.target as CameraView
      store.setCameraView(view)
      return { success: true, message: `✓ Camera: ${command.target} view` }
    }

    case 'setGrid': {
      const show = command.params.show as boolean
      store.updateSettings({ showGrid: show })
      return { success: true, message: `✓ Grid ${show ? 'shown' : 'hidden'}` }
    }

    case 'toggleGrid': {
      const current = store.settings.showGrid
      store.updateSettings({ showGrid: !current })
      return { success: true, message: `✓ Grid ${!current ? 'shown' : 'hidden'}` }
    }

    case 'undo': {
      const { undoStack } = store
      if (undoStack.length === 0) {
        return { success: false, message: 'Nothing to undo.' }
      }
      const last = undoStack[undoStack.length - 1]
      store.undo()
      return { success: true, message: `✓ Undid: ${last.description}` }
    }

    case 'redo': {
      const { redoStack } = store
      if (redoStack.length === 0) {
        return { success: false, message: 'Nothing to redo.' }
      }
      const next = redoStack[redoStack.length - 1]
      store.redo()
      return { success: true, message: `✓ Redid: ${next.description}` }
    }

    case 'rename': {
      const { selectedIds } = store
      if (selectedIds.length === 0) {
        return { success: false, message: 'No objects selected.' }
      }
      const name = command.params.name as string
      store.updateObject(selectedIds[0], { name })
      return { success: true, message: `✓ Renamed to "${name}"` }
    }

    case 'booleanUnion':
    case 'booleanSubtract':
    case 'booleanIntersect': {
      const { selectedIds } = store
      if (selectedIds.length < 2) {
        return { success: false, message: 'Select at least 2 objects for boolean operation.' }
      }
      const opType = command.action.replace('boolean', '').toLowerCase() as 'union' | 'subtract' | 'intersect'
      const id = performBooleanOperation(selectedIds[0], selectedIds[1], opType)
      return {
        success: true,
        message: `✓ Boolean ${opType} applied`,
        objectIds: [id],
      }
    }

    case 'unknown':
    default: {
      const suggestions = getSuggestions(command.raw)
      return {
        success: false,
        message: `Unknown command: "${command.raw}"\n${suggestions}`,
      }
    }
  }
}

function performBooleanOperation(
  targetId: string,
  toolId: string,
  operation: 'union' | 'subtract' | 'intersect'
): string {
  const store = useSceneStore.getState()

  const targetObj = store.objects[targetId]

  store.pushHistory(`Boolean ${operation}`)

  const boolId = generateId()
  const boolObj: import('@/types/cad').BooleanObject = {
    id: boolId,
    kind: 'boolean',
    operation,
    targetId,
    toolId,
    name: `${operation}_${boolId.slice(0, 4)}`,
    visible: true,
    locked: false,
    selected: true,
    transform: targetObj ? { ...targetObj.transform } : {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    material: targetObj ? { ...targetObj.material } : {
      color: '#5b9bd5',
      roughness: 0.5,
      metalness: 0.1,
      opacity: 1,
      wireframe: false,
    },
    parentId: null,
    childIds: [],
    layer: targetObj?.layer || 'default',
    userData: {},
  }

  const updatedStore = useSceneStore.getState()
  updatedStore.addObject(boolObj as import('@/types/cad').CADObject)
  updatedStore.updateObject(targetId, { visible: false })
  updatedStore.updateObject(toolId, { visible: false })
  updatedStore.deselectAll()
  updatedStore.selectObject(boolId)

  return boolId
}

function getSuggestions(input: string): string {
  const lower = input.toLowerCase()
  const suggestions: string[] = []

  if (lower.length < 3) {
    return 'Type "help" to see available commands.'
  }

  const keywords = [
    ['box', 'cube', 'rectangular'],
    ['sphere', 'ball'],
    ['cylinder', 'tube'],
    ['cone', 'pyramid'],
    ['torus', 'donut', 'ring'],
    ['move', 'translate'],
    ['rotate', 'spin'],
    ['scale', 'resize'],
    ['delete', 'remove'],
    ['color', 'material'],
  ]

  for (const group of keywords) {
    if (group.some((k) => k.includes(lower) || lower.includes(k))) {
      if (group[0] === 'box') suggestions.push('  create box [size]')
      else if (group[0] === 'sphere') suggestions.push('  create sphere [radius]')
      else if (group[0] === 'move') suggestions.push('  move x 1 y 2 z 0')
      else if (group[0] === 'rotate') suggestions.push('  rotate 45 degrees')
      else if (group[0] === 'scale') suggestions.push('  scale 2')
      else if (group[0] === 'color') suggestions.push('  color red / color #ff0000')
    }
  }

  if (suggestions.length > 0) {
    return `Did you mean:\n${suggestions.join('\n')}`
  }

  return 'Type "help" to see all available commands.'
}

export async function processWithAI(
  input: string,
  apiKey: string,
  endpoint: string,
  model: string
): Promise<AIResponse> {
  const store = useSceneStore.getState()
  const sceneContext = {
    objectCount: Object.keys(store.objects).length,
    selectedCount: store.selectedIds.length,
    selectedObjects: store.selectedIds.map((id) => {
      const obj = store.objects[id]
      return obj ? { id: obj.id, name: obj.name, kind: obj.kind } : null
    }).filter(Boolean),
    units: store.settings.units,
  }

  const systemPrompt = `You are an AI assistant for a 3D CAD system. Help users create and modify 3D models.
Current scene: ${JSON.stringify(sceneContext)}

You can help with natural language commands. Always be concise and helpful.
When the user wants to create objects, describe what you're doing.
Format responses as JSON: { "command": "natural language command", "explanation": "what you're doing" }
If you cannot perform an action, explain why.`

  try {
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json() as {
      choices: Array<{
        message: {
          content: string
        }
      }>
    }
    const content = data.choices[0]?.message?.content || ''

    try {
      const parsed = JSON.parse(content) as { command?: string; explanation?: string }
      if (parsed.command) {
        const cmd = parseCommand(parsed.command)
        const result = executeCommand(cmd)
        return {
          content: parsed.explanation || result.message,
          success: result.success,
          toolCalls: [{ tool: cmd.action, params: cmd.params, result: result.message }],
        }
      }
      return { content: content, success: true }
    } catch {
      return { content, success: true }
    }
  } catch (error) {
    return {
      content: error instanceof Error ? error.message : 'AI request failed',
      success: false,
    }
  }
}
