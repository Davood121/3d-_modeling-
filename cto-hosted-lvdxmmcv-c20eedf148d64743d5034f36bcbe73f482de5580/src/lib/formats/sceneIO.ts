import type { CADObject } from '@/types/cad'
import { useSceneStore } from '@/stores/sceneStore'

export interface SceneFile {
  version: string
  timestamp: number
  metadata: {
    name: string
    description: string
    units: string
  }
  objects: CADObject[]
}

export function exportScene(objects: Record<string, CADObject>): void {
  const sceneData: SceneFile = {
    version: '0.1.0',
    timestamp: Date.now(),
    metadata: {
      name: 'Untitled',
      description: 'AI CAD System export',
      units: 'mm',
    },
    objects: Object.values(objects),
  }

  const json = JSON.stringify(sceneData, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `scene_${Date.now()}.cadscene`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importScene(): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.cadscene,.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text) as SceneFile

      if (!data.objects || !Array.isArray(data.objects)) {
        throw new Error('Invalid scene file format')
      }

      const store = useSceneStore.getState()
      store.clearScene()

      data.objects.forEach((obj) => {
        store.addObject(obj)
      })
    } catch (err) {
      console.error('Import failed:', err)
      alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }
  document.body.appendChild(input)
  input.click()
  document.body.removeChild(input)
}

export function exportOBJ(objects: Record<string, CADObject>): void {
  let objContent = '# AI CAD System - OBJ Export\n'
  objContent += `# Generated: ${new Date().toISOString()}\n\n`

  let vertexOffset = 1

  Object.values(objects).forEach((obj) => {
    if (obj.kind !== 'primitive' || !obj.visible) return

    objContent += `# Object: ${obj.name}\n`
    objContent += `o ${obj.name}\n`

    const { position, rotation, scale } = obj.transform
    const { type, params } = (obj as import('@/types/cad').PrimitiveObject).primitive

    if (type === 'box') {
      const p = params as import('@/types/cad').BoxParams
      const hx = p.width / 2
      const hy = p.height / 2
      const hz = p.depth / 2

      const verts = [
        [-hx, -hy, -hz],
        [hx, -hy, -hz],
        [hx, hy, -hz],
        [-hx, hy, -hz],
        [-hx, -hy, hz],
        [hx, -hy, hz],
        [hx, hy, hz],
        [-hx, hy, hz],
      ]

      verts.forEach(([x, y, z]) => {
        const wx = x * scale.x + position.x
        const wy = y * scale.y + position.y
        const wz = z * scale.z + position.z
        objContent += `v ${wx.toFixed(6)} ${wy.toFixed(6)} ${wz.toFixed(6)}\n`
      })

      const faces = [
        [1, 2, 3, 4],
        [8, 7, 6, 5],
        [4, 3, 7, 8],
        [5, 6, 2, 1],
        [5, 1, 4, 8],
        [2, 6, 7, 3],
      ]

      faces.forEach((face) => {
        const indices = face.map((i) => i + vertexOffset - 1)
        objContent += `f ${indices.join(' ')}\n`
      })

      vertexOffset += verts.length
    }

    objContent += '\n'
  })

  const blob = new Blob([objContent], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `scene_${Date.now()}.obj`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportSTL(objects: Record<string, CADObject>): void {
  let stlContent = 'solid ai_cad_scene\n'

  const writeTriangle = (
    n: [number, number, number],
    v1: [number, number, number],
    v2: [number, number, number],
    v3: [number, number, number]
  ) => {
    stlContent += `  facet normal ${n[0].toFixed(6)} ${n[1].toFixed(6)} ${n[2].toFixed(6)}\n`
    stlContent += `    outer loop\n`
    stlContent += `      vertex ${v1[0].toFixed(6)} ${v1[1].toFixed(6)} ${v1[2].toFixed(6)}\n`
    stlContent += `      vertex ${v2[0].toFixed(6)} ${v2[1].toFixed(6)} ${v2[2].toFixed(6)}\n`
    stlContent += `      vertex ${v3[0].toFixed(6)} ${v3[1].toFixed(6)} ${v3[2].toFixed(6)}\n`
    stlContent += `    endloop\n`
    stlContent += `  endfacet\n`
  }

  Object.values(objects).forEach((obj) => {
    if (obj.kind !== 'primitive' || !obj.visible) return
    const { type, params } = (obj as import('@/types/cad').PrimitiveObject).primitive
    const { position, scale } = obj.transform

    if (type === 'box') {
      const p = params as import('@/types/cad').BoxParams
      const hx = (p.width * scale.x) / 2
      const hy = (p.height * scale.y) / 2
      const hz = (p.depth * scale.z) / 2
      const px = position.x
      const py = position.y
      const pz = position.z

      writeTriangle([0, 0, -1], [px - hx, py - hy, pz - hz], [px + hx, py + hy, pz - hz], [px + hx, py - hy, pz - hz])
      writeTriangle([0, 0, -1], [px - hx, py - hy, pz - hz], [px - hx, py + hy, pz - hz], [px + hx, py + hy, pz - hz])
      writeTriangle([0, 0, 1], [px - hx, py - hy, pz + hz], [px + hx, py - hy, pz + hz], [px + hx, py + hy, pz + hz])
      writeTriangle([0, 0, 1], [px - hx, py - hy, pz + hz], [px + hx, py + hy, pz + hz], [px - hx, py + hy, pz + hz])
    }
  })

  stlContent += 'endsolid ai_cad_scene\n'

  const blob = new Blob([stlContent], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `scene_${Date.now()}.stl`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
