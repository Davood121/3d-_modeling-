import { useSceneStore } from '@/stores/sceneStore'
import { exportScene, exportOBJ, exportSTL, importScene } from '@/lib/formats/sceneIO'
import { useState } from 'react'
import {
  ChevronDown,
  FileText,
  Download,
  FolderOpen,
  Plus,
  Trash2,
  Undo2,
  Redo2,
  Cpu,
} from 'lucide-react'

interface MenuItemProps {
  icon?: React.ReactNode
  label: string
  shortcut?: string
  onClick: () => void
  disabled?: boolean
  divider?: boolean
}

function MenuItem({ icon, label, shortcut, onClick, disabled, divider }: MenuItemProps) {
  if (divider) {
    return <div className="border-t border-surface-700 my-1" />
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors
        ${disabled ? 'text-surface-600 cursor-not-allowed' : 'text-surface-200 hover:bg-surface-700 hover:text-white'}
      `}
    >
      <span className="w-4 flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-surface-500 text-[10px] font-mono">{shortcut}</span>}
    </button>
  )
}

interface MenuProps {
  label: string
  items: MenuItemProps[]
}

function Menu({ label, items }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1
          ${isOpen ? 'bg-surface-800 text-white' : 'text-surface-300 hover:bg-surface-800 hover:text-white'}
        `}
      >
        {label}
        <ChevronDown size={10} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-surface-900 border border-surface-700 rounded-lg shadow-xl z-50 py-1">
          {items.map((item, i) => (
            <MenuItem
              key={i}
              {...item}
              onClick={() => { item.onClick(); setIsOpen(false) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function TopBar() {
  const {
    objects,
    clearScene,
    undo,
    redo,
    undoStack,
    redoStack,
    addPrimitive,
  } = useSceneStore()

  const fileMenuItems: MenuItemProps[] = [
    {
      icon: <Plus size={12} />,
      label: 'New Scene',
      shortcut: 'Ctrl+N',
      onClick: clearScene,
    },
    { divider: true } as MenuItemProps,
    {
      icon: <FolderOpen size={12} />,
      label: 'Open...',
      shortcut: 'Ctrl+O',
      onClick: () => importScene(),
    },
    { divider: true } as MenuItemProps,
    {
      icon: <Download size={12} />,
      label: 'Export Scene (.cadscene)',
      onClick: () => exportScene(objects),
    },
    {
      icon: <FileText size={12} />,
      label: 'Export OBJ',
      onClick: () => exportOBJ(objects),
    },
    {
      icon: <FileText size={12} />,
      label: 'Export STL',
      onClick: () => exportSTL(objects),
    },
  ]

  const editMenuItems: MenuItemProps[] = [
    {
      icon: <Undo2 size={12} />,
      label: 'Undo',
      shortcut: 'Ctrl+Z',
      onClick: undo,
      disabled: undoStack.length === 0,
    },
    {
      icon: <Redo2 size={12} />,
      label: 'Redo',
      shortcut: 'Ctrl+Y',
      onClick: redo,
      disabled: redoStack.length === 0,
    },
    { divider: true } as MenuItemProps,
    {
      icon: <Trash2 size={12} />,
      label: 'Clear Scene',
      onClick: clearScene,
    },
  ]

  const insertMenuItems: MenuItemProps[] = [
    { label: 'Box', onClick: () => addPrimitive('box') },
    { label: 'Sphere', onClick: () => addPrimitive('sphere') },
    { label: 'Cylinder', onClick: () => addPrimitive('cylinder') },
    { label: 'Cone', onClick: () => addPrimitive('cone') },
    { label: 'Torus', onClick: () => addPrimitive('torus') },
    { label: 'Plane', onClick: () => addPrimitive('plane') },
  ]

  return (
    <div className="flex items-center gap-1 px-3 py-1 bg-surface-950 border-b border-surface-800">
      <div className="flex items-center gap-1.5 mr-4">
        <Cpu size={16} className="text-accent-500" />
        <span className="text-sm font-semibold text-white tracking-tight">AI CAD</span>
        <span className="text-[10px] text-surface-500 font-mono">v0.1</span>
      </div>

      <Menu label="File" items={fileMenuItems} />
      <Menu label="Edit" items={editMenuItems} />
      <Menu label="Insert" items={insertMenuItems} />
    </div>
  )
}
