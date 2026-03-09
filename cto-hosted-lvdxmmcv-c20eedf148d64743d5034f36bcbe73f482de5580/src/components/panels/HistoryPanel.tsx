import { useSceneStore } from '@/stores/sceneStore'
import { History, RotateCcw } from 'lucide-react'
import { formatDistanceToNow } from '@/lib/utils/time'

export function HistoryPanel() {
  const { history, undoStack, redoStack, undo, redo } = useSceneStore()

  return (
    <div className="flex flex-col h-full bg-surface-900">
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-800">
        <h3 className="text-xs font-semibold text-surface-200 uppercase tracking-wider">
          History
        </h3>
        <div className="flex gap-1 text-xs text-surface-400">
          <span>{undoStack.length} undo</span>
          <span>•</span>
          <span>{redoStack.length} redo</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-surface-400 gap-2">
            <History size={20} className="opacity-30" />
            <p className="text-xs">No history yet</p>
          </div>
        ) : (
          [...history].reverse().map((entry, i) => (
            <div
              key={entry.id}
              className={`
                flex items-center gap-2 px-3 py-1.5 text-xs
                ${i === 0 ? 'text-white bg-surface-800/30' : 'text-surface-400'}
              `}
            >
              <RotateCcw size={11} className="flex-shrink-0 opacity-50" />
              <span className="flex-1 truncate">{entry.description}</span>
              <span className="text-[10px] text-surface-500 flex-shrink-0">
                {formatDistanceToNow(entry.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
