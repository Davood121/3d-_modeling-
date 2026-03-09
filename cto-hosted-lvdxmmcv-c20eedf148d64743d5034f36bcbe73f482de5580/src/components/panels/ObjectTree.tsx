import { useState } from 'react'
import {
  Box,
  Circle,
  Cylinder,
  Triangle,
  Minus,
  Layout,
  Folder,
  FolderOpen,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronRight,
  ChevronDown,
  Layers,
} from 'lucide-react'
import { useSceneStore } from '@/stores/sceneStore'
import type { CADObject } from '@/types/cad'

function getObjectIcon(obj: CADObject) {
  if (obj.kind === 'group') return null
  if (obj.kind === 'primitive') {
    const { primitive } = obj as import('@/types/cad').PrimitiveObject
    switch (primitive.type) {
      case 'box': return <Box size={12} />
      case 'sphere': return <Circle size={12} />
      case 'cylinder': return <Cylinder size={12} />
      case 'cone': return <Triangle size={12} />
      case 'torus': return <Minus size={12} />
      case 'plane': return <Layout size={12} />
    }
  }
  return <Layers size={12} />
}

interface ObjectTreeItemProps {
  object: CADObject
  depth: number
}

function ObjectTreeItem({ object, depth }: ObjectTreeItemProps) {
  const { objects, selectObject, updateObject, selectedIds } = useSceneStore()
  const [expanded, setExpanded] = useState(true)

  const isSelected = selectedIds.includes(object.id)
  const hasChildren = object.childIds.length > 0

  const handleClick = (e: React.MouseEvent) => {
    selectObject(object.id, e.ctrlKey || e.metaKey || e.shiftKey)
  }

  const toggleVisible = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateObject(object.id, { visible: !object.visible })
  }

  const toggleLocked = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateObject(object.id, { locked: !object.locked })
  }

  return (
    <div>
      <div
        className={`
          group flex items-center gap-1 py-0.5 px-2 rounded cursor-pointer select-none
          ${isSelected ? 'bg-accent-500/20 text-accent-400' : 'hover:bg-surface-800/60 text-surface-200'}
          ${!object.visible ? 'opacity-40' : ''}
        `}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={handleClick}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            className="text-surface-400"
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <span className="w-3" />
        )}

        <span className="text-surface-400">
          {object.kind === 'group'
            ? (expanded ? <FolderOpen size={12} /> : <Folder size={12} />)
            : getObjectIcon(object)
          }
        </span>

        <span className="flex-1 text-xs truncate font-mono">{object.name}</span>

        <div className="hidden group-hover:flex items-center gap-0.5">
          <button
            onClick={toggleVisible}
            className="p-0.5 rounded hover:bg-surface-700 text-surface-400 hover:text-white"
          >
            {object.visible ? <Eye size={11} /> : <EyeOff size={11} />}
          </button>
          <button
            onClick={toggleLocked}
            className="p-0.5 rounded hover:bg-surface-700 text-surface-400 hover:text-white"
          >
            {object.locked ? <Lock size={11} /> : <Unlock size={11} />}
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {object.childIds.map((childId) => {
            const child = objects[childId]
            return child ? (
              <ObjectTreeItem key={child.id} object={child} depth={depth + 1} />
            ) : null
          })}
        </div>
      )}
    </div>
  )
}

export function ObjectTree() {
  const { objects } = useSceneStore()

  const rootObjects = Object.values(objects).filter((obj) => !obj.parentId)

  return (
    <div className="flex flex-col h-full bg-surface-900">
      <div className="px-3 py-2 border-b border-surface-800">
        <h3 className="text-xs font-semibold text-surface-200 uppercase tracking-wider">
          Scene Objects ({rootObjects.length})
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {rootObjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-surface-400 px-4">
            <Layers size={24} className="opacity-30" />
            <p className="text-xs text-center">
              No objects in scene.<br />
              Use the toolbar or terminal to create objects.
            </p>
          </div>
        ) : (
          rootObjects.map((obj) => (
            <ObjectTreeItem key={obj.id} object={obj} depth={0} />
          ))
        )}
      </div>
    </div>
  )
}
