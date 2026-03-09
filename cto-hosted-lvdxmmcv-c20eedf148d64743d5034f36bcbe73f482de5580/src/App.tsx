import { useEffect } from 'react'
import { Viewport } from './components/viewport/Viewport'
import { Toolbar } from './components/panels/Toolbar'
import { TopBar } from './components/panels/TopBar'
import { BottomBar } from './components/panels/BottomBar'
import { ObjectTree } from './components/panels/ObjectTree'
import { PropertyPanel } from './components/panels/PropertyPanel'
import { LayerPanel } from './components/panels/LayerPanel'
import { HistoryPanel } from './components/panels/HistoryPanel'
import { TabPanel } from './components/ui/TabPanel'
import { ResizablePanel } from './components/ui/ResizablePanel'
import { useSceneStore } from './stores/sceneStore'
import { Layers, History, Box, Settings2 } from 'lucide-react'

function useKeyboardShortcuts() {
  const {
    setToolMode,
    deleteSelected,
    undo,
    redo,
    duplicateObjects,
    selectedIds,
    addPrimitive,
  } = useSceneStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault()
            if (e.shiftKey) redo()
            else undo()
            break
          case 'y':
            e.preventDefault()
            redo()
            break
          case 'd':
            e.preventDefault()
            if (selectedIds.length > 0) duplicateObjects(selectedIds)
            break
        }
        return
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          setToolMode('select')
          break
        case 'g':
          setToolMode('move')
          break
        case 'r':
          setToolMode('rotate')
          break
        case 's':
          setToolMode('scale')
          break
        case 'delete':
        case 'backspace':
          if (selectedIds.length > 0) deleteSelected()
          break
        case 'escape':
          setToolMode('select')
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setToolMode, deleteSelected, undo, redo, duplicateObjects, selectedIds, addPrimitive])
}

export default function App() {
  useKeyboardShortcuts()

  const leftTabs = [
    {
      id: 'objects',
      label: 'Objects',
      icon: <Box size={11} />,
      content: <ObjectTree />,
    },
    {
      id: 'layers',
      label: 'Layers',
      icon: <Layers size={11} />,
      content: <LayerPanel />,
    },
    {
      id: 'history',
      label: 'History',
      icon: <History size={11} />,
      content: <HistoryPanel />,
    },
  ]

  const rightTabs = [
    {
      id: 'properties',
      label: 'Properties',
      icon: <Settings2 size={11} />,
      content: <PropertyPanel />,
    },
  ]

  return (
    <div className="flex flex-col h-screen bg-surface-950 text-white overflow-hidden select-none">
      <TopBar />
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        <ResizablePanel defaultWidth={220} minWidth={160} maxWidth={360} side="left">
          <TabPanel
            tabs={leftTabs}
            defaultTab="objects"
            className="h-full bg-surface-900 border-r border-surface-800"
          />
        </ResizablePanel>

        <div className="flex-1 relative overflow-hidden">
          <Viewport />
        </div>

        <ResizablePanel defaultWidth={240} minWidth={180} maxWidth={380} side="right">
          <TabPanel
            tabs={rightTabs}
            defaultTab="properties"
            className="h-full bg-surface-900 border-l border-surface-800"
          />
        </ResizablePanel>
      </div>

      <BottomBar />
    </div>
  )
}
