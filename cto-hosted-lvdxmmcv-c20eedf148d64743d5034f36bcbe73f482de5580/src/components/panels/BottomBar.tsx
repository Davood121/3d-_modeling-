import { useSceneStore } from '@/stores/sceneStore'
import { Terminal } from '../terminal/Terminal'
import { useTerminalStore } from '@/stores/terminalStore'
import { TerminalIcon } from 'lucide-react'

export function BottomBar() {
  const { toolMode, settings, selectedIds, undoStack, redoStack } = useSceneStore()
  const { isOpen, toggleOpen } = useTerminalStore()

  return (
    <div className="flex flex-col bg-surface-950 border-t border-surface-800">
      {isOpen && (
        <div className="border-b border-surface-800">
          <Terminal />
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-1 text-[11px] text-surface-400">
        <div className="flex items-center gap-4">
          <span>Tool: <span className="text-white font-medium">{toolMode}</span></span>
          <span>Units: <span className="text-white font-medium">{settings.units}</span></span>
          <span>Selected: <span className="text-white font-medium">{selectedIds.length}</span></span>
          <span className="text-surface-600">
            Undo: {undoStack.length} | Redo: {redoStack.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-surface-500 hidden sm:block">
            Click: Select | Ctrl+Click: Multi-select | Scroll: Zoom
          </span>
          <button
            onClick={toggleOpen}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] transition-colors
              ${isOpen
                ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                : 'text-surface-400 hover:text-white hover:bg-surface-800 border border-transparent'
              }
            `}
          >
            <TerminalIcon size={11} />
            AI Terminal
          </button>
        </div>
      </div>
    </div>
  )
}
