import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  getDatabases,
  addDatabase as tauriAddDatabase,
  removeDatabase as tauriRemoveDatabase,
} from '@/lib/tauri-api'
import type { DatabaseConfig } from '@/lib/tauri-api'
import type { Schema } from '@/lib/tauri-api'
export type { DatabaseConfig } from '@/lib/tauri-api'

let storeLoaded = false

type SchemaStore = {
  databases: DatabaseConfig[]
  addDatabase: (name: string, url: string) => Promise<void>
  deleteDatabase: (id: string) => Promise<void>
  activeDatabase: DatabaseConfig | null
  setActiveDatabase: (db: DatabaseConfig | null) => void
  schemas: string[]
  setSchemas: (schemas: string[]) => void
  selectedSchema: string
  setSelectedSchema: (schema: string) => void
  schema: Schema | null
  setSchema: (schema: Schema | null) => void
  selectedTable: string | null
  setSelectedTable: (table: string | null) => void
  search: string
  setSearch: (search: string) => void
  _loadDatabases: () => Promise<void>
}

export const schemaStore = create<SchemaStore>()(
  persist(
    (set, get) => ({
      databases: [],
      addDatabase: async (name, url) => {
        const id = crypto.randomUUID()
        const createdAt = Date.now()
        await tauriAddDatabase(id, name, url, createdAt)
        set((s) => ({
          databases: [...s.databases, { id, name, url, createdAt }],
        }))
      },
      deleteDatabase: async (id) => {
        await tauriRemoveDatabase(id)
        set((s) => ({
          databases: s.databases.filter((d) => d.id !== id),
          activeDatabase: s.activeDatabase?.id === id ? null : s.activeDatabase,
        }))
      },
      activeDatabase: null,
      setActiveDatabase: (db) => set({ activeDatabase: db, schema: null, selectedTable: null }),
      schemas: [],
      setSchemas: (schemas) => set({ schemas }),
      selectedSchema: 'public',
      setSelectedSchema: (schema) =>
        set({ selectedSchema: schema, schema: null, selectedTable: null }),
      schema: null,
      setSchema: (schema) => set({ schema }),
      selectedTable: null,
      setSelectedTable: (table) =>
        set((s) => ({ selectedTable: s.selectedTable === table ? null : table })),
      search: '',
      setSearch: (search) => set({ search }),
      _loadDatabases: async () => {
        if (storeLoaded) return
        try {
          const dbs = await getDatabases()
          set({ databases: dbs })
          storeLoaded = true
        } catch (err) {
          console.error('Failed to load databases from store:', err)
        }
      },
    }),
    {
      name: 'pgviz-ui-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeDatabase: state.activeDatabase,
        selectedSchema: state.selectedSchema,
      }),
    },
  ),
)
