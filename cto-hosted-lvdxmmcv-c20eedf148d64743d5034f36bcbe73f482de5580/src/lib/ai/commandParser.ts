import type { PrimitiveParams } from '@/types/cad'

export interface ParsedCommand {
  action: string
  target?: string
  params: Record<string, unknown>
  raw: string
}

interface NumberExtract {
  value: number
  unit?: string
}

function extractNumber(text: string, patterns: RegExp[]): NumberExtract | null {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return { value: parseFloat(match[1]), unit: match[2] }
    }
  }
  return null
}

function extractDimension(text: string, keyword: string): number | null {
  const patterns = [
    new RegExp(`${keyword}[:\\s]+([\\d.]+)\\s*(mm|cm|m|in|ft)?`, 'i'),
    new RegExp(`([\\d.]+)\\s*(mm|cm|m|in|ft)?\\s+${keyword}`, 'i'),
  ]
  const result = extractNumber(text, patterns)
  return result ? result.value : null
}

function extractColor(text: string): string | null {
  const namedColors: Record<string, string> = {
    red: '#ef4444',
    green: '#22c55e',
    blue: '#3b82f6',
    yellow: '#eab308',
    orange: '#f97316',
    purple: '#a855f7',
    pink: '#ec4899',
    cyan: '#06b6d4',
    white: '#ffffff',
    black: '#0f172a',
    gray: '#6b7280',
    grey: '#6b7280',
    silver: '#94a3b8',
    gold: '#f59e0b',
  }
  const lower = text.toLowerCase()
  for (const [name, hex] of Object.entries(namedColors)) {
    if (lower.includes(name)) return hex
  }
  const hexMatch = text.match(/#[0-9a-fA-F]{3,6}/)
  if (hexMatch) return hexMatch[0]
  return null
}

function parseCreateCommand(text: string): ParsedCommand | null {
  const primitiveAliases: Record<string, PrimitiveParams['type']> = {
    box: 'box',
    cube: 'box',
    rectangular: 'box',
    sphere: 'sphere',
    ball: 'sphere',
    circle: 'sphere',
    cylinder: 'cylinder',
    tube: 'cylinder',
    cone: 'cone',
    pyramid: 'cone',
    torus: 'torus',
    donut: 'torus',
    ring: 'torus',
    plane: 'plane',
    flat: 'plane',
    surface: 'plane',
    ground: 'plane',
  }

  let primitiveType: PrimitiveParams['type'] | null = null
  const lower = text.toLowerCase()

  for (const [alias, type] of Object.entries(primitiveAliases)) {
    if (lower.includes(alias)) {
      primitiveType = type
      break
    }
  }

  if (!primitiveType) return null

  const params: Record<string, unknown> = {}

  const radius = extractDimension(text, 'radius') ?? extractDimension(text, 'r')
  const width = extractDimension(text, 'width') ?? extractDimension(text, 'w')
  const height = extractDimension(text, 'height') ?? extractDimension(text, 'h')
  const depth = extractDimension(text, 'depth') ?? extractDimension(text, 'd')
  const size = extractDimension(text, 'size') ?? extractDimension(text, 's')
  const diameter = extractDimension(text, 'diameter')

  const genericNum = text.match(/(?:with|of|,)?\s+([\d.]+)\s*(?:mm|cm|m|in|ft|units?)?/i)
  const genericVal = genericNum ? parseFloat(genericNum[1]) : null

  switch (primitiveType) {
    case 'box':
      if (size) params.width = params.height = params.depth = size
      if (width) params.width = width
      if (height) params.height = height
      if (depth) params.depth = depth
      if (genericVal && !size && !width && !height && !depth) {
        params.width = params.height = params.depth = genericVal
      }
      break
    case 'sphere':
      if (diameter) params.radius = diameter / 2
      else if (radius) params.radius = radius
      else if (genericVal) params.radius = genericVal
      break
    case 'cylinder':
      if (radius) params.radiusTop = params.radiusBottom = radius
      if (diameter) params.radiusTop = params.radiusBottom = diameter / 2
      if (height) params.height = height
      if (genericVal && !radius && !height) params.height = genericVal
      break
    case 'cone':
      if (radius) params.radius = radius
      if (height) params.height = height
      break
    case 'torus':
      if (radius) params.radius = radius
      if (genericVal) params.radius = genericVal
      break
    case 'plane':
      if (size) params.width = params.height = size
      if (width) params.width = width
      if (height) params.height = height
      break
  }

  return {
    action: 'create',
    target: primitiveType,
    params,
    raw: text,
  }
}

function parseTransformCommand(text: string): ParsedCommand | null {
  const lower = text.toLowerCase()

  const movePatterns = ['move', 'translate', 'position', 'place', 'shift']
  const rotatePatterns = ['rotate', 'turn', 'spin', 'angle', 'orient']
  const scalePatterns = ['scale', 'resize', 'size', 'grow', 'shrink', 'stretch']

  let action: string | null = null
  if (movePatterns.some((p) => lower.includes(p))) action = 'move'
  else if (rotatePatterns.some((p) => lower.includes(p))) action = 'rotate'
  else if (scalePatterns.some((p) => lower.includes(p))) action = 'scale'

  if (!action) return null

  const params: Record<string, unknown> = {}

  const xMatch = text.match(/x[:\s]+([+-]?[\d.]+)/i) ?? text.match(/([+-]?[\d.]+)\s*(?:in|along)\s+x/i)
  const yMatch = text.match(/y[:\s]+([+-]?[\d.]+)/i) ?? text.match(/([+-]?[\d.]+)\s*(?:in|along)\s+y/i)
  const zMatch = text.match(/z[:\s]+([+-]?[\d.]+)/i) ?? text.match(/([+-]?[\d.]+)\s*(?:in|along)\s+z/i)

  if (xMatch) params.x = parseFloat(xMatch[1])
  if (yMatch) params.y = parseFloat(yMatch[1])
  if (zMatch) params.z = parseFloat(zMatch[1])

  const angleMatch = text.match(/([+-]?[\d.]+)\s*(?:deg|°|degrees?)/i)
  if (angleMatch) params.angle = parseFloat(angleMatch[1])

  const numMatches = text.match(/([+-]?[\d.]+)/g)
  if (numMatches && numMatches.length > 0 && Object.keys(params).length === 0) {
    const val = parseFloat(numMatches[0])
    if (action === 'move') params.x = val
    else if (action === 'rotate') params.angle = val
    else if (action === 'scale') params.uniform = val
  }

  return { action, target: 'selected', params, raw: text }
}

function parseMaterialCommand(text: string): ParsedCommand | null {
  const lower = text.toLowerCase()
  const colorKeywords = ['color', 'colour', 'material', 'paint', 'make', 'set', 'change']
  if (!colorKeywords.some((k) => lower.includes(k))) return null

  const color = extractColor(text)
  if (!color) return null

  const roughnessMatch = text.match(/roughness[:\s]+([01]?\.\d+)/i)
  const metalnessMatch = text.match(/metalness[:\s]+([01]?\.\d+)/i)

  const params: Record<string, unknown> = { color }
  if (roughnessMatch) params.roughness = parseFloat(roughnessMatch[1])
  if (metalnessMatch) params.metalness = parseFloat(metalnessMatch[1])

  return { action: 'setMaterial', target: 'selected', params, raw: text }
}

function parseViewCommand(text: string): ParsedCommand | null {
  const lower = text.toLowerCase()

  if (lower.includes('wireframe')) return { action: 'setViewMode', target: 'wireframe', params: {}, raw: text }
  if (lower.includes('solid')) return { action: 'setViewMode', target: 'solid', params: {}, raw: text }
  if (lower.includes('xray') || lower.includes('x-ray') || lower.includes('transparent')) {
    return { action: 'setViewMode', target: 'xray', params: {}, raw: text }
  }

  if (lower.includes('top view') || lower.includes('view from top') || lower.match(/^top$/)) {
    return { action: 'setCameraView', target: 'top', params: {}, raw: text }
  }
  if (lower.includes('front view') || lower.match(/^front$/)) {
    return { action: 'setCameraView', target: 'front', params: {}, raw: text }
  }
  if (lower.includes('right view') || lower.match(/^right$/)) {
    return { action: 'setCameraView', target: 'right', params: {}, raw: text }
  }
  if (lower.includes('isometric') || lower.includes('iso') || lower.includes('perspective')) {
    return { action: 'setCameraView', target: 'perspective', params: {}, raw: text }
  }

  return null
}

function parseDeleteCommand(text: string): ParsedCommand | null {
  const lower = text.toLowerCase()
  const deleteKeywords = ['delete', 'remove', 'erase', 'clear', 'destroy']
  if (!deleteKeywords.some((k) => lower.includes(k))) return null

  if (lower.includes('all') || lower.includes('scene') || lower.includes('everything')) {
    return { action: 'clearScene', target: 'all', params: {}, raw: text }
  }

  return { action: 'deleteSelected', target: 'selected', params: {}, raw: text }
}

function parseSelectionCommand(text: string): ParsedCommand | null {
  const lower = text.toLowerCase()
  if (lower.includes('select all')) return { action: 'selectAll', target: 'all', params: {}, raw: text }
  if (lower.includes('deselect') || lower.includes('unselect') || lower.includes('clear selection')) {
    return { action: 'deselectAll', target: 'none', params: {}, raw: text }
  }
  return null
}

function parseDuplicateCommand(text: string): ParsedCommand | null {
  const lower = text.toLowerCase()
  if (lower.includes('duplicate') || lower.includes('copy') || lower.includes('clone')) {
    return { action: 'duplicate', target: 'selected', params: {}, raw: text }
  }
  return null
}

function parseGroupCommand(text: string): ParsedCommand | null {
  const lower = text.toLowerCase()
  if (lower.includes('ungroup')) return { action: 'ungroup', target: 'selected', params: {}, raw: text }
  if (lower.includes('group')) return { action: 'group', target: 'selected', params: {}, raw: text }
  return null
}

function parseUndoRedoCommand(text: string): ParsedCommand | null {
  const lower = text.toLowerCase()
  if (lower === 'undo' || lower.startsWith('undo ')) return { action: 'undo', target: '', params: {}, raw: text }
  if (lower === 'redo' || lower.startsWith('redo ')) return { action: 'redo', target: '', params: {}, raw: text }
  return null
}

function parseGridCommand(text: string): ParsedCommand | null {
  const lower = text.toLowerCase()
  if (lower.includes('show grid') || lower.includes('grid on')) {
    return { action: 'setGrid', target: '', params: { show: true }, raw: text }
  }
  if (lower.includes('hide grid') || lower.includes('grid off') || lower.includes('no grid')) {
    return { action: 'setGrid', target: '', params: { show: false }, raw: text }
  }
  if (lower.includes('toggle grid')) {
    return { action: 'toggleGrid', target: '', params: {}, raw: text }
  }
  return null
}

function parseHelpCommand(text: string): ParsedCommand | null {
  const lower = text.toLowerCase()
  if (lower === 'help' || lower === '?' || lower.startsWith('help ')) {
    return { action: 'help', target: '', params: {}, raw: text }
  }
  return null
}

function parseBooleanCommand(text: string): ParsedCommand | null {
  const lower = text.toLowerCase()
  if (lower.includes('union') || lower.includes('merge') || lower.includes('combine')) {
    return { action: 'booleanUnion', target: 'selected', params: {}, raw: text }
  }
  if (lower.includes('subtract') || lower.includes('cut') || lower.includes('difference')) {
    return { action: 'booleanSubtract', target: 'selected', params: {}, raw: text }
  }
  if (lower.includes('intersect') || lower.includes('intersection')) {
    return { action: 'booleanIntersect', target: 'selected', params: {}, raw: text }
  }
  return null
}

function parseNameCommand(text: string): ParsedCommand | null {
  const match = text.match(/(?:rename|name|call)[:\s]+["']?([a-zA-Z0-9_\s-]+)["']?/i)
  if (match) {
    return { action: 'rename', target: 'selected', params: { name: match[1].trim() }, raw: text }
  }
  return null
}

export function parseCommand(input: string): ParsedCommand {
  const text = input.trim()

  const parsers = [
    parseHelpCommand,
    parseUndoRedoCommand,
    parseDeleteCommand,
    parseSelectionCommand,
    parseDuplicateCommand,
    parseGroupCommand,
    parseBooleanCommand,
    parseViewCommand,
    parseGridCommand,
    parseMaterialCommand,
    parseTransformCommand,
    parseNameCommand,
    parseCreateCommand,
  ]

  for (const parser of parsers) {
    const result = parser(text)
    if (result) return result
  }

  return { action: 'unknown', target: '', params: {}, raw: text }
}
