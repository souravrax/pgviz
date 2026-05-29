'use client'

import { useTabStore } from '@/stores/tab-store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Table2,
  FileCode2,
  GitFork,
  FunctionSquare,
  Info,
  LayoutDashboard,
  Puzzle,
  X,
  Plus,
} from 'lucide-react'

const tabTypeIcons: Record<string, typeof Table2> = {
  table: Table2,
  query: FileCode2,
  visualize: GitFork,
  function: FunctionSquare,
  properties: Info,
  overview: LayoutDashboard,
  extensions: Puzzle,
}

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, openTab } = useTabStore()

  const handleNewQuery = () => {
    openTab({ type: 'query', title: `Query #${tabs.filter((t) => t.type === 'query').length + 1}`, schema: 'public', sql: '' })
  }

  return (
    <div className="flex items-center h-9 border-b bg-background">
      {/* Tabs */}
      <div className="flex items-center flex-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tabTypeIcons[tab.type]
          const isActive = tab.id === activeTabId

          return (
            <div
              key={tab.id}
              className={cn(
                'group flex items-center gap-1.5 px-3 py-1.5 text-xs border-r cursor-pointer min-w-[120px] max-w-[200px] select-none transition-colors',
                isActive
                  ? 'bg-muted text-foreground border-b-2 border-b-primary'
                  : 'bg-background text-muted-foreground hover:bg-muted/50 border-b border-b-transparent'
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="size-3 shrink-0" />
              <span className="truncate flex-1">{tab.title}</span>
              <button
                className={cn(
                  'p-0.5 rounded hover:bg-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity',
                  isActive && 'opacity-100'
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
              >
                <X className="size-3" />
              </button>
            </div>
          )
        })}
      </div>

      {/* New Query Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-none border-l"
        onClick={handleNewQuery}
        title="New Query (Ctrl+T)"
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  )
}
