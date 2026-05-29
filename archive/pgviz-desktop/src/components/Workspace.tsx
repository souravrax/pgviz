'use client'

import { useTabStore } from '@/stores/tab-store'
import SchemaGraph from '@/components/SchemaGraph'
import { useSchema } from '@/hooks/use-tauri-query'
import { useStore } from 'zustand'
import { schemaStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Play, Loader2, Database, Puzzle } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useExecuteSql } from '@/hooks/use-tauri-query'
import CodeMirror from '@uiw/react-codemirror'
import { sql as sqlLang, PostgreSQL } from '@codemirror/lang-sql'
import { autocompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete'

export function Workspace() {
  const activeDatabase = useStore(schemaStore, (s) => s.activeDatabase)
  const { tabs, activeTabId } = useTabStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)

  if (!activeDatabase) {
    return <NoDatabaseState />
  }

  if (!activeTab) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <div className="text-center">
          <p className="mb-2">No tab open</p>
          <p className="text-xs opacity-50">Right-click a schema or table to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      {activeTab.type === 'visualize' && <VisualizeTab tab={activeTab} />}
      {activeTab.type === 'query' && <QueryTab tab={activeTab} />}
      {activeTab.type === 'table' && <TableTab tab={activeTab} />}
      {activeTab.type === 'properties' && <PropertiesTab tab={activeTab} />}
      {activeTab.type === 'function' && <FunctionTab tab={activeTab} />}
      {activeTab.type === 'overview' && <OverviewTab />}
      {activeTab.type === 'extensions' && <ExtensionsTab />}
    </div>
  )
}

// ── No Database State ────────────────────────────────────────────────────────

function NoDatabaseState() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      <div className="text-center max-w-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto mb-4">
          <Database className="size-6 text-muted-foreground" />
        </div>
        <p className="font-medium mb-1">No database connected</p>
        <p className="text-xs opacity-70 mb-4">Select a database from the sidebar or add a new connection to get started.</p>
      </div>
    </div>
  )
}

// ── Visualize Tab ───────────────────────────────────────────────────────────

function VisualizeTab({ tab }: { tab: { schema: string } }) {
  const activeDatabase = useStore(schemaStore, (s) => s.activeDatabase)
  const { data: schema } = useSchema(activeDatabase?.url, tab.schema)

  // Sync schema to store so SchemaGraph can read it
  const setSchema = useStore(schemaStore, (s) => s.setSchema)
  useEffect(() => {
    if (schema) setSchema(schema)
  }, [schema, setSchema])

  return <SchemaGraph />
}

// ── Query Tab ─────────────────────────────────────────────────────────────────

function QueryTab({ tab }: { tab: { id: string; sql?: string } }) {
  const [sql, setSql] = useState(tab.sql || '')
  const [results, setResults] = useState<any>(null)
  const activeDatabase = useStore(schemaStore, (s) => s.activeDatabase)
  const schema = useStore(schemaStore, (s) => s.schema)
  const executeMutation = useExecuteSql()
  const updateTab = useTabStore((s) => s.updateTab)

  const handleRun = async () => {
    if (!activeDatabase || !sql.trim()) return
    const res = await executeMutation.mutateAsync({ url: activeDatabase.url, sql })
    setResults(res)
    updateTab(tab.id, { sql })
  }

  // Build autocomplete from schema
  const sqlExtension = useMemo(() => {
    const schemaTables = schema?.tables ?? []
    const tableNames = schemaTables.map((t) => t.name)
    const columnNames = schemaTables.flatMap((t) => t.columns.map((c: any) => c.name))
    const allIdentifiers = [...new Set([...tableNames, ...columnNames])]

    const pgCompletion = sqlLang({ dialect: PostgreSQL, upperCaseKeywords: true })

    const customCompletion = autocompletion({
      override: [
        (context: CompletionContext): CompletionResult | null => {
          const word = context.matchBefore(/\w*/)
          if (!word || (word.from === word.to && !context.explicit)) return null
          return {
            from: word.from,
            options: allIdentifiers.map((name) => ({
              label: name,
              type: tableNames.includes(name) ? 'type' : 'property',
            })),
            validFor: /^\w*$/,
          }
        },
      ],
    })

    return [pgCompletion, customCompletion]
  }, [schema])

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <span className="text-xs font-medium text-muted-foreground">SQL Query</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Ctrl+Enter to run</span>
          <Button
            size="sm"
            onClick={handleRun}
            disabled={executeMutation.isPending || !sql.trim()}
          >
            {executeMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Play className="size-3.5" />
            )}
            <span className="ml-1.5">Run</span>
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <CodeMirror
          value={sql}
          onChange={(value) => setSql(value)}
          extensions={sqlExtension}
          theme="dark"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: false,
            dropCursor: false,
            allowMultipleSelections: true,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            searchKeymap: true,
          }}
          className="h-full text-sm font-mono [&_.cm-editor]:h-full [&_.cm-scroller]:font-mono"
          placeholder="Write your SQL query here..."
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 'Enter') {
              e.preventDefault()
              handleRun()
            }
          }}
        />
      </div>

      {/* Results */}
      {results && (
        <div className="border-t h-1/2 min-h-[200px] overflow-auto">
          <div className="px-4 py-2 border-b flex items-center justify-between bg-muted/30">
            <span className="text-xs text-muted-foreground">
              {results.rows?.length ?? 0} rows
            </span>
            <span className="text-xs text-muted-foreground">
              {results.columns?.length ?? 0} columns
            </span>
          </div>
          {results.rows && results.rows.length > 0 ? (
            <table className="w-full text-xs">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  {results.columns?.map((col: string) => (
                    <th key={col} className="text-left px-3 py-2 font-medium border-b">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.rows.map((row: any, i: number) => (
                  <tr key={i} className="border-b hover:bg-muted/20">
                    {results.columns?.map((col: string) => (
                      <td key={col} className="px-3 py-1.5 font-mono text-[11px] truncate max-w-[200px]">
                        {row[col] === null ? (
                          <span className="italic text-muted-foreground">null</span>
                        ) : typeof row[col] === 'object' ? (
                          JSON.stringify(row[col]).slice(0, 50)
                        ) : (
                          String(row[col])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
              No results
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Table Tab ─────────────────────────────────────────────────────────────────

function TableTab({ tab }: { tab: { schema: string; tableName?: string } }) {
  const activeDatabase = useStore(schemaStore, (s) => s.activeDatabase)

  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      <div className="text-center">
        <p className="mb-2">Table: {tab.tableName}</p>
        <p className="text-xs opacity-50">Schema: {tab.schema}</p>
        <p className="text-xs opacity-50 mt-2">Data grid viewer coming in a future update</p>
      </div>
    </div>
  )
}

// ── Properties Tab ────────────────────────────────────────────────────────────

function PropertiesTab({ tab }: { tab: { schema: string; tableName?: string } }) {
  const activeDatabase = useStore(schemaStore, (s) => s.activeDatabase)
  const { data: schema } = useSchema(activeDatabase?.url, tab.schema)
  const table = schema?.tables.find((t) => t.name === tab.tableName)

  if (!table) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Table not found
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-lg font-bold mb-4">{table.name}</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-2">Columns</h3>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Name</th>
                  <th className="text-left px-3 py-2 font-medium">Type</th>
                  <th className="text-left px-3 py-2 font-medium">Nullable</th>
                </tr>
              </thead>
              <tbody>
                {table.columns.map((col: any) => (
                  <tr key={col.name} className="border-t hover:bg-muted/20">
                    <td className="px-3 py-2 font-mono">{col.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{col.type}</td>
                    <td className="px-3 py-2">
                      {col.nullable ? (
                        <span className="text-amber-500">Yes</span>
                      ) : (
                        <span className="text-green-500">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {table.primaryKeys.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Primary Keys</h3>
            <div className="flex gap-2">
              {table.primaryKeys.map((pk) => (
                <span key={pk} className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-mono">
                  {pk}
                </span>
              ))}
            </div>
          </div>
        )}

        {table.indexes.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Indexes</h3>
            <div className="space-y-2">
              {table.indexes.map((idx: any) => (
                <div key={idx.name} className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-medium">{idx.name}</span>
                  <span className="text-muted-foreground">({idx.columns.join(', ')})</span>
                  {idx.unique && (
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">Unique</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab() {
  const activeDatabase = useStore(schemaStore, (s) => s.activeDatabase)
  const { data: schema } = useSchema(activeDatabase?.url, 'public')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-lg font-bold mb-6">Database Overview</h2>
      {schema ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Tables" value={schema.tables.length} />
          <StatCard label="Relations" value={schema.relations.length} />
          <StatCard label="Columns" value={schema.tables.reduce((sum, t) => sum + t.columns.length, 0)} />
          <StatCard label="Indexes" value={schema.tables.reduce((sum, t) => sum + t.indexes.length, 0)} />
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Loading overview...</div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border p-4 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  )
}

// ── Extensions Tab ────────────────────────────────────────────────────────────

function ExtensionsTab() {
  const activeDatabase = useStore(schemaStore, (s) => s.activeDatabase)

  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      <div className="text-center">
        <Puzzle className="size-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="mb-2">Extensions</p>
        <p className="text-xs opacity-50">Extension manager coming in a future update</p>
      </div>
    </div>
  )
}

// ── Function Tab ──────────────────────────────────────────────────────────────

function FunctionTab({ tab }: { tab: { schema: string; functionName?: string } }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      <div className="text-center">
        <p className="mb-2">Function: {tab.functionName}</p>
        <p className="text-xs opacity-50">Schema: {tab.schema}</p>
        <p className="text-xs opacity-50 mt-2">Function viewer coming in a future update</p>
      </div>
    </div>
  )
}
