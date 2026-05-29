import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { nanoid } from 'nanoid'

export type TabType = 'table' | 'query' | 'visualize' | 'function' | 'properties' | 'overview' | 'extensions'

export interface Tab {
  id: string
  type: TabType
  title: string
  schema: string
  // Type-specific data
  tableName?: string
  functionName?: string
  sql?: string
}

interface TabStore {
  tabs: Tab[]
  activeTabId: string | null
  openTab: (tab: Omit<Tab, 'id'>) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTab: (id: string, updates: Partial<Tab>) => void
  closeAllTabs: () => void
}

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,

      openTab: (tabData) => {
        const { tabs } = get()

        // For table tabs, don't duplicate
        if (tabData.type === 'table' && tabData.tableName) {
          const existing = tabs.find(
            (t) => t.type === 'table' && t.tableName === tabData.tableName && t.schema === tabData.schema
          )
          if (existing) {
            set({ activeTabId: existing.id })
            return
          }
        }

        // For query tabs with same SQL, switch to existing
        if (tabData.type === 'query' && tabData.sql) {
          const existing = tabs.find(
            (t) => t.type === 'query' && t.sql === tabData.sql && t.schema === tabData.schema
          )
          if (existing) {
            set({ activeTabId: existing.id })
            return
          }
        }

        const newTab: Tab = { ...tabData, id: nanoid(6) }
        set({
          tabs: [...tabs, newTab],
          activeTabId: newTab.id,
        })
      },

      closeTab: (id) => {
        const { tabs, activeTabId } = get()
        const filtered = tabs.filter((t) => t.id !== id)
        let newActiveId = activeTabId

        if (activeTabId === id) {
          const closedIndex = tabs.findIndex((t) => t.id === id)
          newActiveId = filtered[closedIndex]?.id ?? filtered[closedIndex - 1]?.id ?? null
        }

        set({ tabs: filtered, activeTabId: newActiveId })
      },

      setActiveTab: (id) => {
        set({ activeTabId: id })
      },

      updateTab: (id, updates) => {
        const { tabs } = get()
        set({
          tabs: tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })
      },

      closeAllTabs: () => {
        set({ tabs: [], activeTabId: null })
      },
    }),
    {
      name: 'pgviz-tabs',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ tabs: state.tabs, activeTabId: state.activeTabId }),
    }
  )
)
