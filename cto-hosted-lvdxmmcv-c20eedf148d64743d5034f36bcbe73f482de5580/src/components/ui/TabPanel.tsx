import { useState } from 'react'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  content: React.ReactNode
}

interface TabPanelProps {
  tabs: Tab[]
  defaultTab?: string
  className?: string
}

export function TabPanel({ tabs, defaultTab, className = '' }: TabPanelProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const active = tabs.find((t) => t.id === activeTab) || tabs[0]

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex border-b border-surface-800 bg-surface-900">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-1 px-3 py-2 text-[11px] font-medium transition-colors
              ${activeTab === tab.id
                ? 'text-accent-400 border-b-2 border-accent-500 bg-surface-800/30'
                : 'text-surface-400 hover:text-surface-200'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {active?.content}
      </div>
    </div>
  )
}
