'use client'

import { useState, useCallback, useEffect } from 'react'
import { useStore } from 'zustand'
import { schemaStore } from '@/lib/store'
import { useTabStore } from '@/stores/tab-store'
import { useSchemas, useSchema, useDatabases, useAddDatabase } from '@/hooks/use-tauri-query'
import { openSettingsWindow } from '@/lib/settings-window'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Database,
  Table2,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Settings,
  LayoutDashboard,
  Puzzle,
  Play,
  FileCode2,
  Info,
  Loader2,
} from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────────

interface TableItem {
  name: string
  columns: { name: string; type: string }[]
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function Sidebar() {
  const activeDatabase = useStore(schemaStore, (s) => s.activeDatabase)
  const setActiveDatabase = useStore(schemaStore, (s) => s.setActiveDatabase)
  const selectedSchema = useStore(schemaStore, (s) => s.selectedSchema)
  const setSelectedSchema = useStore(schemaStore, (s) => s.setSelectedSchema)
  const setSchema = useStore(schemaStore, (s) => s.setSchema)

  const [search, setSearch] = useState('')
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set())
  const [showAddDb, setShowAddDb] = useState(false)

  const openTab = useTabStore((s) => s.openTab)

  const { data: databases, isLoading: dbsLoading } = useDatabases()
  const { data: schemaNames, isLoading: schemasLoading } = useSchemas(activeDatabase?.url)
  const { data: schemaData } = useSchema(activeDatabase?.url, selectedSchema)

  // Sync selected schema data to store for other components
  useEffect(() => {
    if (schemaData) setSchema(schemaData)
  }, [schemaData, setSchema])

  // Auto-select first schema
  useEffect(() => {
    const names = schemaNames ?? []
    if (names.length > 0 && !names.includes(selectedSchema)) {
      setSelectedSchema(names[0])
    }
  }, [schemaNames, selectedSchema, setSelectedSchema])

  const handleSelectDatabase = (dbId: string) => {
    if (dbId === '__add__') {
      setShowAddDb(true)
      return
    }
    const db = databases?.find((d) => d.id === dbId)
    if (db) {
      setActiveDatabase(db)
      useTabStore.getState().closeAllTabs()
    }
  }

  const toggleSchema = useCallback((name: string) => {
    setExpandedSchemas((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  const handleOverview = () => {
    openTab({ type: 'overview', title: 'Overview', schema: selectedSchema })
  }

  const handleExtensions = () => {
    openTab({ type: 'extensions', title: 'Extensions', schema: selectedSchema })
  }

  const handleNewQuery = (schemaName: string) => {
    openTab({ type: 'query', title: 'Query', schema: schemaName, sql: '' })
  }

  const handleVisualize = (schemaName: string) => {
    openTab({ type: 'visualize', title: `Visualize: ${schemaName}`, schema: schemaName })
  }

  const handleViewTable = (schemaName: string, tableName: string) => {
    openTab({ type: 'table', title: `Table: ${tableName}`, schema: schemaName, tableName })
  }

  const handleQueryTable = (schemaName: string, tableName: string) => {
    const sql = `SELECT * FROM "${schemaName}"."${tableName}" LIMIT 100;`
    openTab({ type: 'query', title: `Query: ${tableName}`, schema: schemaName, sql })
  }

  const handleTableProperties = (schemaName: string, tableName: string) => {
    openTab({ type: 'properties', title: `Properties: ${tableName}`, schema: schemaName, tableName })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header: App name + Database selector */}
      <div className="shrink-0 flex flex-col gap-2 px-3 py-3 border-b">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-primary" />
          <span className="text-sm font-semibold">pgviz</span>
        </div>
        {dbsLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Loading...
          </div>
        ) : databases && databases.length > 0 ? (
          <Select value={activeDatabase?.id ?? ''} onValueChange={handleSelectDatabase}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select database..." />
            </SelectTrigger>
            <SelectContent>
              {databases.map((db) => (
                <SelectItem key={db.id} value={db.id} className="text-xs">
                  {db.name}
                </SelectItem>
              ))}
              <div className="h-px bg-border my-1" />
              <SelectItem value="__add__" className="text-xs">
                <span className="flex items-center gap-1.5 text-primary">
                  <Plus className="size-3" />
                  Add Database...
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowAddDb(true)}>
            <Plus className="size-3 mr-1" />
            Add Database
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="shrink-0 px-3 py-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search objects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
      </div>

      {/* Navigation - scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="py-1">
          {/* Overview */}
          <NavItem icon={LayoutDashboard} label="Overview" onClick={handleOverview} disabled={!activeDatabase} />

          <div className="h-px bg-border mx-3 my-1" />

          {/* Schemas */}
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Schemas
          </div>

          {!activeDatabase && (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center">
              No database connected
            </div>
          )}

          {activeDatabase && schemasLoading && (
            <div className="px-3 py-4 text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="size-3 animate-spin" />
              Loading schemas...
            </div>
          )}

          {activeDatabase &&
            schemaNames?.map((schemaName) => (
              <SchemaTreeNode
                key={schemaName}
                name={schemaName}
                isExpanded={expandedSchemas.has(schemaName)}
                isActive={schemaName === selectedSchema}
                search={search}
                onToggle={() => toggleSchema(schemaName)}
                onSelect={() => {
                  setSelectedSchema(schemaName)
                  toggleSchema(schemaName)
                }}
                onNewQuery={() => handleNewQuery(schemaName)}
                onVisualize={() => handleVisualize(schemaName)}
                onViewTable={handleViewTable}
                onQueryTable={handleQueryTable}
                onTableProperties={handleTableProperties}
              />
            ))}

          <div className="h-px bg-border mx-3 my-1" />

          {/* Extensions */}
          <NavItem icon={Puzzle} label="Extensions" onClick={handleExtensions} disabled={!activeDatabase} />
        </div>
      </div>

      {/* Bottom: Settings */}
      <div className="shrink-0 border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
          onClick={openSettingsWindow}
        >
          <Settings className="size-3.5 mr-2" />
          Settings
        </Button>
      </div>

      <AddDatabaseDialog open={showAddDb} onOpenChange={setShowAddDb} />
    </div>
  )
}

// ── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Table2
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      className={cn(
        'flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left hover:bg-sidebar-accent/40 rounded-sm transition-colors',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="size-3.5 text-muted-foreground" />
      <span>{label}</span>
    </button>
  )
}

// ── Schema Tree Node ─────────────────────────────────────────────────────────

function SchemaTreeNode({
  name,
  isExpanded,
  isActive,
  search,
  onToggle,
  onSelect,
  onNewQuery,
  onVisualize,
  onViewTable,
  onQueryTable,
  onTableProperties,
}: {
  name: string
  isExpanded: boolean
  isActive: boolean
  search: string
  onToggle: () => void
  onSelect: () => void
  onNewQuery: () => void
  onVisualize: () => void
  onViewTable: (schema: string, table: string) => void
  onQueryTable: (schema: string, table: string) => void
  onTableProperties: (schema: string, table: string) => void
}) {
  const activeDatabase = useStore(schemaStore, (s) => s.activeDatabase)
  const { data: schema, isLoading } = useSchema(activeDatabase?.url, name)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  const closeContextMenu = () => setContextMenu(null)

  // Safely extract tables from schema
  const tables: TableItem[] = schema?.tables ?? []
  const filteredTables = tables.filter((t) => {
    const tableName = String(t.name ?? '')
    return tableName.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div>
      {/* Schema row */}
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-sidebar-accent group select-none',
          isActive && 'bg-sidebar-accent/60'
        )}
        onClick={onSelect}
        onContextMenu={(e) => {
          e.preventDefault()
          setContextMenu({ x: e.clientX, y: e.clientY })
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          className="p-0.5 rounded hover:bg-muted"
        >
          {isExpanded ? (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3.5 text-muted-foreground" />
          )}
        </button>
        <span className="text-xs font-medium truncate flex-1">{name}</span>
        {isLoading && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
      </div>

      {/* Schema context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[160px] rounded-md border bg-popover shadow-lg py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <ContextMenuItem icon={FileCode2} label="New Query" onClick={() => { onNewQuery(); closeContextMenu() }} />
          <ContextMenuItem icon={Database} label="Visualize" onClick={() => { onVisualize(); closeContextMenu() }} />
          <div className="fixed inset-0 -z-10" onClick={closeContextMenu} />
        </div>
      )}

      {/* Expanded: tables list */}
      {isExpanded && (
        <div className="pl-5 pr-1">
          {isLoading && (
            <div className="px-2 py-1 text-[10px] text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="size-3 animate-spin" />
              Loading tables...
            </div>
          )}

          {!isLoading && filteredTables.length === 0 && (
            <div className="px-2 py-1 text-[10px] text-muted-foreground">No tables</div>
          )}

          {!isLoading &&
            filteredTables.map((table) => {
              const tableName = String(table.name ?? '')
              const columnCount = Array.isArray(table.columns) ? table.columns.length : 0

              return (
                <TableTreeItem
                  key={tableName}
                  schemaName={name}
                  tableName={tableName}
                  columnCount={columnCount}
                  onViewTable={onViewTable}
                  onQueryTable={onQueryTable}
                  onTableProperties={onTableProperties}
                />
              )
            })}
        </div>
      )}
    </div>
  )
}

// ── Table Tree Item ──────────────────────────────────────────────────────────

function TableTreeItem({
  schemaName,
  tableName,
  columnCount,
  onViewTable,
  onQueryTable,
  onTableProperties,
}: {
  schemaName: string
  tableName: string
  columnCount: number
  onViewTable: (schema: string, table: string) => void
  onQueryTable: (schema: string, table: string) => void
  onTableProperties: (schema: string, table: string) => void
}) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const closeContextMenu = () => setContextMenu(null)

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] text-foreground/80 hover:bg-sidebar-accent/40 cursor-pointer group select-none"
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setContextMenu({ x: e.clientX, y: e.clientY })
      }}
      onDoubleClick={() => onViewTable(schemaName, tableName)}
    >
      <Table2 className="size-3 text-muted-foreground/50" />
      <span className="truncate flex-1 font-mono">{tableName}</span>
      <span className="text-[9px] text-muted-foreground/50 opacity-0 group-hover:opacity-100">
        {columnCount}
      </span>

      {/* Table context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[160px] rounded-md border bg-popover shadow-lg py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <ContextMenuItem icon={Play} label="View Data" onClick={() => { onViewTable(schemaName, tableName); closeContextMenu() }} />
          <ContextMenuItem icon={FileCode2} label="Query" onClick={() => { onQueryTable(schemaName, tableName); closeContextMenu() }} />
          <div className="h-px bg-border mx-2 my-1" />
          <ContextMenuItem icon={Info} label="Properties" onClick={() => { onTableProperties(schemaName, tableName); closeContextMenu() }} />
          <div className="fixed inset-0 -z-10" onClick={closeContextMenu} />
        </div>
      )}
    </div>
  )
}

// ── Context Menu Item ───────────────────────────────────────────────────────

function ContextMenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Table2
  label: string
  onClick: () => void
}) {
  return (
    <button
      className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left hover:bg-accent hover:text-accent-foreground"
      onClick={onClick}
    >
      <Icon className="size-3.5" />
      <span>{label}</span>
    </button>
  )
}

// ── Add Database Dialog ─────────────────────────────────────────────────────

function AddDatabaseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const addDatabase = useAddDatabase()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) {
      setError('Name and URL are required')
      return
    }
    try {
      const id = crypto.randomUUID()
      await addDatabase.mutateAsync({ id, name, url, createdAt: Date.now() })
      onOpenChange(false)
      setName('')
      setUrl('')
      setError('')
    } catch {
      setError('Failed to add connection')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Connection</DialogTitle>
          <DialogDescription>Add a PostgreSQL database connection</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="My Database" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">Connection URL</Label>
            <Input id="url" placeholder="postgresql://user:pass@localhost:5432/dbname" value={url} onChange={(e) => setUrl(e.target.value)} />
            <p className="text-xs text-muted-foreground">Format: postgresql://user:password@host:port/database</p>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={addDatabase.isPending}>
              {addDatabase.isPending ? 'Adding...' : 'Add Connection'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
