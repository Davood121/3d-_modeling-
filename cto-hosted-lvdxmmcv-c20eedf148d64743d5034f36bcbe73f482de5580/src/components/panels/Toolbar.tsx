import { useSceneStore } from '@/stores/sceneStore'
import type { ToolMode, ViewMode } from '@/types/cad'
import {
  MousePointer2,
  Move,
  RotateCw,
  Maximize2,
  Box,
  Circle,
  Cylinder,
  Triangle,
  Minus,
  Layout,
  Eye,
  Grid3X3,
  Layers,
  Copy,
  Trash2,
  Undo2,
  Redo2,
  Download,
  Upload,
  Settings,
  Ruler,
} from 'lucide-react'
import { exportScene, importScene } from '@/lib/formats/sceneIO'
import { useTerminalStore } from '@/stores/terminalStore'

interface ToolButtonProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
  shortcut?: string
  variant?: 'default' | 'danger'
  disabled?: boolean
}

function ToolButton({ icon, label, active, onClick, shortcut, variant = 'default', disabled }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={`
        relative flex items-center justify-center w-9 h-9 rounded-lg text-sm transition-all
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
        ${active
          ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/30'
          : variant === 'danger'
            ? 'text-red-400 hover:bg-red-950/60 hover:text-red-300'
            : 'text-surface-200 hover:bg-surface-800 hover:text-white'
        }
      `}
    >
      {icon}
    </button>
  )
}

function ToolSeparator() {
  return <div className="w-px h-6 bg-surface-800 mx-0.5" />
}

function ToolGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-0.5">
      {children}
    </div>
  )
}

export function Toolbar() {
  const {
    toolMode,
    setToolMode,
    viewMode,
    setViewMode,
    settings,
    updateSettings,
    deleteSelected,
    selectedIds,
    duplicateObjects,
    undo,
    redo,
    undoStack,
    redoStack,
    addPrimitive,
    objects,
  } = useSceneStore()

  const { toggleOpen } = useTerminalStore()

  const setTool = (mode: ToolMode) => setToolMode(mode)
  const setView = (mode: ViewMode) => setViewMode(mode)

  const handleExport = () => {
    exportScene(objects)
  }

  const handleImport = () => {
    importScene()
  }

  const viewModes: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'solid', icon: <Box size={14} />, label: 'Solid' },
    { mode: 'wireframe', icon: <Grid3X3 size={14} />, label: 'Wireframe' },
    { mode: 'shaded-wireframe', icon: <Layers size={14} />, label: 'Shaded Wireframe' },
    { mode: 'xray', icon: <Eye size={14} />, label: 'X-Ray' },
  ]

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-surface-900 border-b border-surface-800 overflow-x-auto">
      <ToolGroup>
        <ToolButton
          icon={<MousePointer2 size={15} />}
          label="Select"
          active={toolMode === 'select'}
          onClick={() => setTool('select')}
          shortcut="V"
        />
        <ToolButton
          icon={<Move size={15} />}
          label="Move"
          active={toolMode === 'move'}
          onClick={() => setTool('move')}
          shortcut="G"
        />
        <ToolButton
          icon={<RotateCw size={15} />}
          label="Rotate"
          active={toolMode === 'rotate'}
          onClick={() => setTool('rotate')}
          shortcut="R"
        />
        <ToolButton
          icon={<Maximize2 size={15} />}
          label="Scale"
          active={toolMode === 'scale'}
          onClick={() => setTool('scale')}
          shortcut="S"
        />
      </ToolGroup>

      <ToolSeparator />

      <ToolGroup>
        <ToolButton
          icon={<Box size={15} />}
          label="Box"
          active={toolMode === 'box'}
          onClick={() => addPrimitive('box')}
        />
        <ToolButton
          icon={<Circle size={15} />}
          label="Sphere"
          active={toolMode === 'sphere'}
          onClick={() => addPrimitive('sphere')}
        />
        <ToolButton
          icon={<Cylinder size={15} />}
          label="Cylinder"
          active={toolMode === 'cylinder'}
          onClick={() => addPrimitive('cylinder')}
        />
        <ToolButton
          icon={<Triangle size={15} />}
          label="Cone"
          active={toolMode === 'cone'}
          onClick={() => addPrimitive('cone')}
        />
        <ToolButton
          icon={<Minus size={15} />}
          label="Torus"
          active={toolMode === 'torus'}
          onClick={() => addPrimitive('torus')}
        />
        <ToolButton
          icon={<Layout size={15} />}
          label="Plane"
          active={toolMode === 'plane'}
          onClick={() => addPrimitive('plane')}
        />
      </ToolGroup>

      <ToolSeparator />

      <ToolGroup>
        <ToolButton
          icon={<Ruler size={15} />}
          label="Measure"
          active={toolMode === 'measure'}
          onClick={() => setTool('measure')}
        />
      </ToolGroup>

      <ToolSeparator />

      <ToolGroup>
        {viewModes.map(({ mode, icon, label }) => (
          <ToolButton
            key={mode}
            icon={icon}
            label={label}
            active={viewMode === mode}
            onClick={() => setView(mode)}
          />
        ))}
        <ToolButton
          icon={<Grid3X3 size={15} />}
          label={settings.showGrid ? 'Hide Grid' : 'Show Grid'}
          active={settings.showGrid}
          onClick={() => updateSettings({ showGrid: !settings.showGrid })}
        />
      </ToolGroup>

      <ToolSeparator />

      <ToolGroup>
        <ToolButton
          icon={<Copy size={15} />}
          label="Duplicate"
          onClick={() => duplicateObjects(selectedIds)}
          disabled={selectedIds.length === 0}
          shortcut="Ctrl+D"
        />
        <ToolButton
          icon={<Trash2 size={15} />}
          label="Delete Selected"
          onClick={deleteSelected}
          disabled={selectedIds.length === 0}
          variant="danger"
          shortcut="Del"
        />
      </ToolGroup>

      <ToolSeparator />

      <ToolGroup>
        <ToolButton
          icon={<Undo2 size={15} />}
          label="Undo"
          onClick={undo}
          disabled={undoStack.length === 0}
          shortcut="Ctrl+Z"
        />
        <ToolButton
          icon={<Redo2 size={15} />}
          label="Redo"
          onClick={redo}
          disabled={redoStack.length === 0}
          shortcut="Ctrl+Y"
        />
      </ToolGroup>

      <ToolSeparator />

      <ToolGroup>
        <ToolButton
          icon={<Upload size={15} />}
          label="Import"
          onClick={handleImport}
        />
        <ToolButton
          icon={<Download size={15} />}
          label="Export"
          onClick={handleExport}
        />
      </ToolGroup>

      <div className="flex-1" />

      <ToolButton
        icon={<Settings size={15} />}
        label="Settings"
        onClick={() => {}}
      />
    </div>
  )
}
