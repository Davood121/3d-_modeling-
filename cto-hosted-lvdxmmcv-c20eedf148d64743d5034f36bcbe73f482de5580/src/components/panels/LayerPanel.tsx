import { useState } from 'react'
import { useSceneStore } from '@/stores/sceneStore'
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2, Check } from 'lucide-react'

export function LayerPanel() {
  const { layers, activeLayerId, addLayer, removeLayer, updateLayer, setActiveLayer } = useSceneStore()
  const [newLayerName, setNewLayerName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddLayer = () => {
    if (newLayerName.trim()) {
      addLayer(newLayerName.trim())
      setNewLayerName('')
      setIsAdding(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface-900">
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-800">
        <h3 className="text-xs font-semibold text-surface-200 uppercase tracking-wider">
          Layers
        </h3>
        <button
          onClick={() => setIsAdding(true)}
          className="p-1 rounded text-surface-400 hover:text-white hover:bg-surface-800"
        >
          <Plus size={13} />
        </button>
      </div>

      {isAdding && (
        <div className="px-3 py-2 border-b border-surface-800 flex gap-1">
          <input
            type="text"
            value={newLayerName}
            onChange={(e) => setNewLayerName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddLayer()
              if (e.key === 'Escape') setIsAdding(false)
            }}
            placeholder="Layer name..."
            autoFocus
            className="flex-1 px-2 py-1 text-xs bg-surface-800 border border-surface-700 rounded text-white
              focus:outline-none focus:border-accent-500"
          />
          <button
            onClick={handleAddLayer}
            className="p-1 rounded text-green-400 hover:bg-green-950/30"
          >
            <Check size={13} />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-1">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`
              group flex items-center gap-2 px-3 py-1.5 cursor-pointer
              ${activeLayerId === layer.id ? 'bg-accent-500/10' : 'hover:bg-surface-800/50'}
            `}
            onClick={() => setActiveLayer(layer.id)}
          >
            <div
              className="w-3 h-3 rounded-sm border border-surface-600 flex-shrink-0"
              style={{ backgroundColor: layer.color }}
            />
            <span
              className={`flex-1 text-xs truncate ${
                activeLayerId === layer.id ? 'text-accent-400' : 'text-surface-200'
              }`}
            >
              {layer.name}
            </span>
            <div className="hidden group-hover:flex items-center gap-0.5">
              <button
                onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }) }}
                className="p-0.5 rounded text-surface-400 hover:text-white"
              >
                {layer.visible ? <Eye size={11} /> : <EyeOff size={11} />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }) }}
                className="p-0.5 rounded text-surface-400 hover:text-white"
              >
                {layer.locked ? <Lock size={11} /> : <Unlock size={11} />}
              </button>
              {layer.id !== 'default' && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeLayer(layer.id) }}
                  className="p-0.5 rounded text-red-400 hover:text-red-300"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
