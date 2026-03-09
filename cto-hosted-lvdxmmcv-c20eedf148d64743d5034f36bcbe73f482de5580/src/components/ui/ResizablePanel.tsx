import { useState, useRef, useCallback } from 'react'

interface ResizablePanelProps {
  children: React.ReactNode
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  side?: 'left' | 'right'
  className?: string
}

export function ResizablePanel({
  children,
  defaultWidth = 220,
  minWidth = 150,
  maxWidth = 400,
  side = 'left',
  className = '',
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth)
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isResizing.current = true
      startX.current = e.clientX
      startWidth.current = width

      const onMouseMove = (ev: MouseEvent) => {
        if (!isResizing.current) return
        const delta = side === 'left' ? ev.clientX - startX.current : startX.current - ev.clientX
        const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth.current + delta))
        setWidth(newWidth)
      }

      const onMouseUp = () => {
        isResizing.current = false
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [width, side, minWidth, maxWidth]
  )

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width }}
    >
      {children}
      <div
        className={`
          absolute top-0 bottom-0 w-1 cursor-col-resize z-50 
          hover:bg-accent-500/50 active:bg-accent-500 transition-colors
          ${side === 'left' ? 'right-0' : 'left-0'}
        `}
        onMouseDown={handleMouseDown}
      />
    </div>
  )
}
