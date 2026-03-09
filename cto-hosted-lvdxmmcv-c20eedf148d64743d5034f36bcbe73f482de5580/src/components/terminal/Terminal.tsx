import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Terminal as TerminalIcon,
  X,
  Minimize2,
  Maximize2,
  Send,
  Trash2,
  Settings,
  ChevronUp,
} from 'lucide-react'
import { useTerminalStore } from '@/stores/terminalStore'
import { parseCommand } from '@/lib/ai/commandParser'
import { executeCommand, processWithAI } from '@/lib/ai/commandExecutor'
import type { TerminalEntry } from '@/types/cad'

function EntryLine({ entry }: { entry: TerminalEntry }) {
  const typeStyles: Record<TerminalEntry['type'], string> = {
    user: 'text-accent-400',
    system: 'text-surface-300',
    error: 'text-red-400',
    info: 'text-yellow-400',
    result: 'text-green-400',
  }

  const prefixes: Record<TerminalEntry['type'], string> = {
    user: '> ',
    system: '  ',
    error: '✗ ',
    info: '⚠ ',
    result: '  ',
  }

  return (
    <div className={`font-mono text-xs leading-relaxed whitespace-pre-wrap ${typeStyles[entry.type]}`}>
      <span className="opacity-50 text-[10px]">{prefixes[entry.type]}</span>
      {entry.content}
    </div>
  )
}

function AISettingsPanel({ onClose }: { onClose: () => void }) {
  const { aiMode, apiKey, apiEndpoint, modelName, setAIMode, setApiKey, setApiEndpoint, setModelName } =
    useTerminalStore()

  return (
    <div className="absolute bottom-full mb-2 right-0 w-80 bg-surface-900 border border-surface-700 rounded-lg shadow-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-semibold text-white">AI Settings</h3>
        <button onClick={onClose} className="text-surface-400 hover:text-white">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-surface-400 uppercase tracking-wider block mb-1">Mode</label>
          <select
            value={aiMode}
            onChange={(e) => setAIMode(e.target.value as typeof aiMode)}
            className="w-full px-2 py-1 text-xs bg-surface-800 border border-surface-700 rounded text-white
              focus:outline-none focus:border-accent-500"
          >
            <option value="demo">Demo (No AI key needed)</option>
            <option value="openai">OpenAI API</option>
            <option value="custom">Custom Endpoint</option>
          </select>
        </div>

        {aiMode !== 'demo' && (
          <>
            <div>
              <label className="text-[10px] text-surface-400 uppercase tracking-wider block mb-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-2 py-1 text-xs font-mono bg-surface-800 border border-surface-700 rounded text-white
                  focus:outline-none focus:border-accent-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-surface-400 uppercase tracking-wider block mb-1">Endpoint</label>
              <input
                type="text"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                className="w-full px-2 py-1 text-xs font-mono bg-surface-800 border border-surface-700 rounded text-white
                  focus:outline-none focus:border-accent-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-surface-400 uppercase tracking-wider block mb-1">Model</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="gpt-4o-mini"
                className="w-full px-2 py-1 text-xs font-mono bg-surface-800 border border-surface-700 rounded text-white
                  focus:outline-none focus:border-accent-500"
              />
            </div>
          </>
        )}

        <div className="text-[10px] text-surface-400 bg-surface-800/50 rounded p-2">
          {aiMode === 'demo'
            ? 'Demo mode uses built-in command parsing. Supports natural language commands like "create a box", "rotate 45 degrees", etc.'
            : 'Connect an AI API to enable advanced natural language understanding and intelligent command generation.'}
        </div>
      </div>
    </div>
  )
}

const SUGGESTIONS = [
  'create box',
  'create sphere',
  'create cylinder with radius 2 height 3',
  'create torus',
  'move x 2 y 0 z 0',
  'rotate 45 degrees',
  'scale 2',
  'color red',
  'color blue',
  'wireframe',
  'solid',
  'select all',
  'duplicate',
  'delete selected',
  'undo',
  'redo',
  'top view',
  'front view',
  'help',
]

export function Terminal() {
  const {
    entries,
    inputHistory,
    historyIndex,
    isProcessing,
    isOpen,
    aiMode,
    apiKey,
    apiEndpoint,
    modelName,
    addEntry,
    clearEntries,
    pushInput,
    setHistoryIndex,
    setProcessing,
    toggleOpen,
  } = useTerminalStore()

  const [input, setInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)

  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [entries])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleInputChange = (value: string) => {
    setInput(value)
    if (value.trim()) {
      const lower = value.toLowerCase()
      const filtered = SUGGESTIONS.filter((s) => s.startsWith(lower) && s !== lower)
      setSuggestions(filtered.slice(0, 5))
      setSelectedSuggestion(-1)
    } else {
      setSuggestions([])
    }
  }

  const processInput = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return

      pushInput(trimmed)
      addEntry('user', trimmed)
      setInput('')
      setSuggestions([])
      setProcessing(true)

      try {
        if (aiMode !== 'demo' && apiKey) {
          const response = await processWithAI(trimmed, apiKey, apiEndpoint, modelName)
          addEntry(response.success ? 'result' : 'error', response.content)
        } else {
          const command = parseCommand(trimmed)
          const result = executeCommand(command)
          addEntry(result.success ? 'result' : 'error', result.message)
        }
      } catch (err) {
        addEntry('error', err instanceof Error ? err.message : 'Command failed')
      } finally {
        setProcessing(false)
      }
    },
    [addEntry, pushInput, setProcessing, aiMode, apiKey, apiEndpoint, modelName]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
        const suggestion = suggestions[selectedSuggestion]
        setInput(suggestion)
        setSuggestions([])
        setSelectedSuggestion(-1)
      } else {
        processInput(input)
      }
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (suggestions.length > 0) {
        setSelectedSuggestion((prev) => Math.max(0, prev - 1))
      } else {
        const newIndex = Math.min(historyIndex + 1, inputHistory.length - 1)
        setHistoryIndex(newIndex)
        if (inputHistory[newIndex]) setInput(inputHistory[newIndex])
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (suggestions.length > 0) {
        setSelectedSuggestion((prev) => Math.min(suggestions.length - 1, prev + 1))
      } else {
        const newIndex = Math.max(historyIndex - 1, -1)
        setHistoryIndex(newIndex)
        setInput(newIndex === -1 ? '' : inputHistory[newIndex])
      }
      return
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      if (suggestions.length > 0) {
        const idx = selectedSuggestion >= 0 ? selectedSuggestion : 0
        setInput(suggestions[idx])
        setSuggestions([])
        setSelectedSuggestion(-1)
      }
      return
    }

    if (e.key === 'Escape') {
      setSuggestions([])
      setSelectedSuggestion(-1)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={toggleOpen}
        className="flex items-center gap-2 px-3 py-1.5 bg-surface-900/90 hover:bg-surface-800 border border-surface-700 
          rounded-lg text-xs text-surface-200 transition-all hover:text-white shadow-lg backdrop-blur-sm"
      >
        <TerminalIcon size={13} />
        AI Terminal
        <ChevronUp size={12} />
      </button>
    )
  }

  const terminalHeight = isExpanded ? 'h-96' : 'h-52'

  return (
    <div className={`flex flex-col ${terminalHeight} bg-surface-950/95 border border-surface-700 rounded-t-lg shadow-2xl backdrop-blur-sm transition-all`}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-surface-800 bg-surface-900/80 rounded-t-lg">
        <div className="flex items-center gap-2">
          <TerminalIcon size={13} className="text-accent-400" />
          <span className="text-xs font-semibold text-white">AI CAD Terminal</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
            aiMode === 'demo' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-green-900/50 text-green-400'
          }`}>
            {aiMode === 'demo' ? 'DEMO' : 'AI'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 rounded text-surface-400 hover:text-white hover:bg-surface-800"
          >
            <Settings size={12} />
          </button>
          <button
            onClick={clearEntries}
            className="p-1 rounded text-surface-400 hover:text-white hover:bg-surface-800"
          >
            <Trash2 size={12} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-surface-400 hover:text-white hover:bg-surface-800"
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          <button
            onClick={toggleOpen}
            className="p-1 rounded text-surface-400 hover:text-white hover:bg-surface-800"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-1 font-mono"
      >
        {entries.map((entry) => (
          <EntryLine key={entry.id} entry={entry} />
        ))}
        {isProcessing && (
          <div className="text-accent-400 text-xs font-mono animate-pulse">
            Processing...
          </div>
        )}
      </div>

      <div className="relative px-3 pb-3">
        {suggestions.length > 0 && (
          <div className="absolute bottom-full mb-1 left-3 right-3 bg-surface-900 border border-surface-700 rounded shadow-xl z-50">
            {suggestions.map((s, i) => (
              <button
                key={s}
                onClick={() => { setInput(s); setSuggestions([]); inputRef.current?.focus() }}
                className={`
                  w-full text-left px-3 py-1.5 text-xs font-mono
                  ${i === selectedSuggestion ? 'bg-accent-500/20 text-accent-400' : 'text-surface-300 hover:bg-surface-800'}
                `}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {showSettings && <AISettingsPanel onClose={() => setShowSettings(false)} />}

        <div className="flex items-center gap-2 bg-surface-800/50 border border-surface-700 rounded-lg px-3 py-1.5">
          <span className="text-accent-400 font-mono text-xs">›</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or ask AI..."
            disabled={isProcessing}
            className="flex-1 bg-transparent text-xs font-mono text-white placeholder-surface-500 
              focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => processInput(input)}
            disabled={isProcessing || !input.trim()}
            className="text-accent-400 hover:text-accent-300 disabled:opacity-30 transition-colors"
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
