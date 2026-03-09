import { useState } from 'react'
import { useSceneStore, useSelectedObjects } from '@/stores/sceneStore'
import type { CADObject, PrimitiveObject, Transform, Material } from '@/types/cad'
import { formatNumber } from '@/lib/utils/math'
import { Settings2, Box, Palette } from 'lucide-react'

interface NumberInputProps {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  width?: string
}

function NumberInput({ label, value, onChange, step = 0.1, min, max, width = 'w-20' }: NumberInputProps) {
  const [localValue, setLocalValue] = useState(String(formatNumber(value)))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value)
    const parsed = parseFloat(e.target.value)
    if (!isNaN(parsed)) onChange(parsed)
  }

  const handleBlur = () => {
    setLocalValue(String(formatNumber(value)))
  }

  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[10px] text-surface-400 uppercase tracking-wider">{label}</label>
      <input
        type="number"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        step={step}
        min={min}
        max={max}
        className={`${width} px-2 py-1 text-xs font-mono bg-surface-800 border border-surface-700 rounded text-white 
          focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30`}
      />
    </div>
  )
}

function Vec3Input({
  label,
  value,
  onChange,
  step = 0.1,
}: {
  label: string
  value: { x: number; y: number; z: number }
  onChange: (v: { x: number; y: number; z: number }) => void
  step?: number
}) {
  return (
    <div className="mb-3">
      <label className="text-[10px] text-surface-400 uppercase tracking-wider mb-1 block">{label}</label>
      <div className="flex gap-1">
        <NumberInput
          label="X"
          value={value.x}
          onChange={(v) => onChange({ ...value, x: v })}
          step={step}
          width="w-full"
        />
        <NumberInput
          label="Y"
          value={value.y}
          onChange={(v) => onChange({ ...value, y: v })}
          step={step}
          width="w-full"
        />
        <NumberInput
          label="Z"
          value={value.z}
          onChange={(v) => onChange({ ...value, z: v })}
          step={step}
          width="w-full"
        />
      </div>
    </div>
  )
}

function TransformSection({ object }: { object: CADObject }) {
  const { updateTransform } = useSceneStore()

  const updatePos = (pos: Transform['position']) =>
    updateTransform(object.id, { position: pos })
  const updateRot = (rot: Transform['rotation']) => {
    updateTransform(object.id, { rotation: rot })
  }
  const updateScale = (scale: Transform['scale']) =>
    updateTransform(object.id, { scale })

  const rotDeg = {
    x: (object.transform.rotation.x * 180) / Math.PI,
    y: (object.transform.rotation.y * 180) / Math.PI,
    z: (object.transform.rotation.z * 180) / Math.PI,
  }

  const setRotDeg = (deg: { x: number; y: number; z: number }) => {
    updateRot({
      x: (deg.x * Math.PI) / 180,
      y: (deg.y * Math.PI) / 180,
      z: (deg.z * Math.PI) / 180,
    })
  }

  return (
    <div>
      <Vec3Input label="Position" value={object.transform.position} onChange={updatePos} />
      <Vec3Input label="Rotation (°)" value={rotDeg} onChange={setRotDeg} step={1} />
      <Vec3Input label="Scale" value={object.transform.scale} onChange={updateScale} step={0.01} />
    </div>
  )
}

function MaterialSection({ object }: { object: CADObject }) {
  const { updateMaterial } = useSceneStore()
  const mat = object.material

  const update = (updates: Partial<Material>) =>
    updateMaterial(object.id, updates)

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] text-surface-400 uppercase tracking-wider mb-1 block">Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={mat.color}
            onChange={(e) => update({ color: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer border border-surface-700 bg-surface-800 p-0.5"
          />
          <input
            type="text"
            value={mat.color}
            onChange={(e) => update({ color: e.target.value })}
            className="flex-1 px-2 py-1 text-xs font-mono bg-surface-800 border border-surface-700 rounded text-white
              focus:outline-none focus:border-accent-500"
          />
        </div>
      </div>
      <NumberInput
        label="Roughness"
        value={mat.roughness}
        onChange={(v) => update({ roughness: Math.max(0, Math.min(1, v)) })}
        step={0.01}
        min={0}
        max={1}
        width="w-full"
      />
      <NumberInput
        label="Metalness"
        value={mat.metalness}
        onChange={(v) => update({ metalness: Math.max(0, Math.min(1, v)) })}
        step={0.01}
        min={0}
        max={1}
        width="w-full"
      />
      <NumberInput
        label="Opacity"
        value={mat.opacity}
        onChange={(v) => update({ opacity: Math.max(0, Math.min(1, v)) })}
        step={0.01}
        min={0}
        max={1}
        width="w-full"
      />
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={mat.wireframe}
          onChange={(e) => update({ wireframe: e.target.checked })}
          className="w-3 h-3 accent-accent-500"
        />
        <span className="text-xs text-surface-200">Wireframe</span>
      </label>
    </div>
  )
}

function PrimitiveParamsSection({ object }: { object: PrimitiveObject }) {
  const { updateObject } = useSceneStore()
  const { primitive } = object

  const updateParams = (params: Partial<typeof primitive.params>) => {
    updateObject(object.id, {
      primitive: {
        ...primitive,
        params: { ...primitive.params, ...params },
      } as PrimitiveObject['primitive'],
    })
  }

  switch (primitive.type) {
    case 'box': {
      const p = primitive.params
      return (
        <div className="space-y-2">
          <NumberInput label="Width" value={p.width} onChange={(v) => updateParams({ width: v })} width="w-full" />
          <NumberInput label="Height" value={p.height} onChange={(v) => updateParams({ height: v })} width="w-full" />
          <NumberInput label="Depth" value={p.depth} onChange={(v) => updateParams({ depth: v })} width="w-full" />
        </div>
      )
    }
    case 'sphere': {
      const p = primitive.params
      return (
        <div className="space-y-2">
          <NumberInput label="Radius" value={p.radius} onChange={(v) => updateParams({ radius: v })} width="w-full" />
          <NumberInput label="Width Segs" value={p.widthSegments} onChange={(v) => updateParams({ widthSegments: Math.round(v) })} step={1} min={3} width="w-full" />
          <NumberInput label="Height Segs" value={p.heightSegments} onChange={(v) => updateParams({ heightSegments: Math.round(v) })} step={1} min={2} width="w-full" />
        </div>
      )
    }
    case 'cylinder': {
      const p = primitive.params
      return (
        <div className="space-y-2">
          <NumberInput label="Radius Top" value={p.radiusTop} onChange={(v) => updateParams({ radiusTop: v })} width="w-full" />
          <NumberInput label="Radius Bottom" value={p.radiusBottom} onChange={(v) => updateParams({ radiusBottom: v })} width="w-full" />
          <NumberInput label="Height" value={p.height} onChange={(v) => updateParams({ height: v })} width="w-full" />
          <NumberInput label="Segments" value={p.radialSegments} onChange={(v) => updateParams({ radialSegments: Math.round(v) })} step={1} min={3} width="w-full" />
        </div>
      )
    }
    case 'cone': {
      const p = primitive.params
      return (
        <div className="space-y-2">
          <NumberInput label="Radius" value={p.radius} onChange={(v) => updateParams({ radius: v })} width="w-full" />
          <NumberInput label="Height" value={p.height} onChange={(v) => updateParams({ height: v })} width="w-full" />
          <NumberInput label="Segments" value={p.radialSegments} onChange={(v) => updateParams({ radialSegments: Math.round(v) })} step={1} min={3} width="w-full" />
        </div>
      )
    }
    case 'torus': {
      const p = primitive.params
      return (
        <div className="space-y-2">
          <NumberInput label="Radius" value={p.radius} onChange={(v) => updateParams({ radius: v })} width="w-full" />
          <NumberInput label="Tube" value={p.tube} onChange={(v) => updateParams({ tube: v })} width="w-full" />
          <NumberInput label="Radial Segs" value={p.radialSegments} onChange={(v) => updateParams({ radialSegments: Math.round(v) })} step={1} min={3} width="w-full" />
          <NumberInput label="Tubular Segs" value={p.tubularSegments} onChange={(v) => updateParams({ tubularSegments: Math.round(v) })} step={1} min={3} width="w-full" />
        </div>
      )
    }
    case 'plane': {
      const p = primitive.params
      return (
        <div className="space-y-2">
          <NumberInput label="Width" value={p.width} onChange={(v) => updateParams({ width: v })} width="w-full" />
          <NumberInput label="Height" value={p.height} onChange={(v) => updateParams({ height: v })} width="w-full" />
        </div>
      )
    }
    default:
      return null
  }
}

type PanelTab = 'transform' | 'material' | 'params'

export function PropertyPanel() {
  const selectedObjects = useSelectedObjects()
  const { updateObject } = useSceneStore()
  const [activeTab, setActiveTab] = useState<PanelTab>('transform')

  if (selectedObjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-surface-400 gap-2 px-4">
        <Settings2 size={24} className="opacity-30" />
        <p className="text-xs text-center">Select an object to view its properties.</p>
      </div>
    )
  }

  const primaryObject = selectedObjects[0]
  const isPrimitive = primaryObject.kind === 'primitive'

  const tabs: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
    { id: 'transform', label: 'Transform', icon: <Box size={12} /> },
    { id: 'material', label: 'Material', icon: <Palette size={12} /> },
    ...(isPrimitive ? [{ id: 'params' as PanelTab, label: 'Params', icon: <Settings2 size={12} /> }] : []),
  ]

  return (
    <div className="flex flex-col h-full bg-surface-900">
      <div className="px-3 py-2 border-b border-surface-800">
        <input
          type="text"
          value={primaryObject.name}
          onChange={(e) => updateObject(primaryObject.id, { name: e.target.value })}
          className="w-full px-2 py-1 text-xs font-mono bg-surface-800 border border-surface-700 rounded text-white
            focus:outline-none focus:border-accent-500"
        />
        {selectedObjects.length > 1 && (
          <p className="text-[10px] text-surface-400 mt-1">+{selectedObjects.length - 1} more selected</p>
        )}
      </div>

      <div className="flex border-b border-surface-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-1 px-3 py-2 text-[11px] flex-1 transition-colors
              ${activeTab === tab.id
                ? 'text-accent-400 border-b-2 border-accent-500 bg-surface-800/30'
                : 'text-surface-400 hover:text-surface-200'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'transform' && <TransformSection object={primaryObject} />}
        {activeTab === 'material' && <MaterialSection object={primaryObject} />}
        {activeTab === 'params' && isPrimitive && (
          <PrimitiveParamsSection object={primaryObject as PrimitiveObject} />
        )}
      </div>
    </div>
  )
}
