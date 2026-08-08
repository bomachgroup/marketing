interface Tab {
  id: string
  label: string
  count?: number
}

interface TabBarProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
}

export default function TabBar({ tabs, activeTab, onChange }: TabBarProps) {
  return (
    <div className="flex border-b border-border" role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'border-b-2 border-navy text-navy'
                : 'border-b-2 border-transparent text-text-3 hover:text-text'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                  isActive
                    ? 'bg-navy text-white'
                    : 'bg-surface-2 text-text-3'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}