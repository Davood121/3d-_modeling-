import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { TerminalEntry, AIResponse } from '@/types/cad'
import { generateId } from '@/lib/utils/id'

interface TerminalState {
  entries: TerminalEntry[]
  inputHistory: string[]
  historyIndex: number
  isProcessing: boolean
  isOpen: boolean
  aiMode: 'demo' | 'openai' | 'custom'
  apiKey: string
  apiEndpoint: string
  modelName: string

  addEntry: (type: TerminalEntry['type'], content: string) => void
  clearEntries: () => void
  pushInput: (input: string) => void
  setHistoryIndex: (index: number) => void
  setProcessing: (processing: boolean) => void
  toggleOpen: () => void
  setAIMode: (mode: TerminalState['aiMode']) => void
  setApiKey: (key: string) => void
  setApiEndpoint: (endpoint: string) => void
  setModelName: (name: string) => void
  processCommand: (input: string) => Promise<AIResponse>
}

export const useTerminalStore = create<TerminalState>()(
  immer((set, get) => ({
    entries: [
      {
        id: generateId(),
        type: 'system',
        content:
          '🤖 AI CAD Terminal ready. Type commands in natural language or use direct commands.\nExamples: "create a box", "add sphere with radius 2", "rotate selected 45 degrees", "help"',
        timestamp: Date.now(),
      },
    ],
    inputHistory: [],
    historyIndex: -1,
    isProcessing: false,
    isOpen: false,
    aiMode: 'demo',
    apiKey: '',
    apiEndpoint: 'https://api.openai.com/v1',
    modelName: 'gpt-4o-mini',

    addEntry: (type, content) => {
      set((state) => {
        state.entries.push({
          id: generateId(),
          type,
          content,
          timestamp: Date.now(),
        })
        if (state.entries.length > 500) state.entries.shift()
      })
    },

    clearEntries: () => {
      set((state) => {
        state.entries = []
      })
    },

    pushInput: (input) => {
      set((state) => {
        if (input.trim()) {
          state.inputHistory.unshift(input)
          if (state.inputHistory.length > 100) state.inputHistory.pop()
        }
        state.historyIndex = -1
      })
    },

    setHistoryIndex: (index) => {
      set((state) => {
        state.historyIndex = index
      })
    },

    setProcessing: (processing) => {
      set((state) => {
        state.isProcessing = processing
      })
    },

    toggleOpen: () => {
      set((state) => {
        state.isOpen = !state.isOpen
      })
    },

    setAIMode: (mode) => {
      set((state) => {
        state.aiMode = mode
      })
    },

    setApiKey: (key) => {
      set((state) => {
        state.apiKey = key
      })
    },

    setApiEndpoint: (endpoint) => {
      set((state) => {
        state.apiEndpoint = endpoint
      })
    },

    setModelName: (name) => {
      set((state) => {
        state.modelName = name
      })
    },

    processCommand: async (input: string): Promise<AIResponse> => {
      return { content: '', success: false }
    },
  }))
)
