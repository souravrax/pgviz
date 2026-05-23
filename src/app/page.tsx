'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from 'zustand'
import { schemaStore } from '@/lib/store'
import type { DatabaseConfig } from '@/lib/tauri-api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Database, Plus, Trash2, Settings, ArrowRight } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const databases = useStore(schemaStore, (s) => s.databases)
  const deleteDatabase = useStore(schemaStore, (s) => s.deleteDatabase)
  const setActiveDatabase = useStore(schemaStore, (s) => s.setActiveDatabase)

  useEffect(() => {
    schemaStore.getState()._loadDatabases()
  }, [])

  const handleRemove = async (id: string) => {
    try {
      await deleteDatabase(id)
    } catch {
      // handled silently
    }
  }

  const handleSelect = (db: DatabaseConfig) => {
    setActiveDatabase(db)
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <Database className="size-5 text-primary" />
          <span className="text-sm font-semibold">pgviz</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/settings')}
            title="Settings"
          >
            <Settings className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-3xl">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Connections</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your PostgreSQL database connections
            </p>
          </div>

          {/* Toolbar */}
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {databases.length} connection{databases.length !== 1 ? 's' : ''}
            </span>
            <Button
              size="sm"
              onClick={() => router.push('/connections/new')}
            >
              <Plus className="size-4 mr-1.5" />
              New Connection
            </Button>
          </div>

          {/* Empty State */}
          {databases.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Database className="size-6 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium">No connections yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add a connection to start exploring your database
              </p>
              <Button
                className="mt-4"
                size="sm"
                onClick={() => router.push('/connections/new')}
              >
                <Plus className="size-4 mr-1.5" />
                New Connection
              </Button>
            </div>
          )}

          {/* Connection List */}
          {databases.length > 0 && (
            <div className="space-y-3">
              {databases.map((db) => (
                <Card
                  key={db.id}
                  className="group cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/20"
                  onClick={() => handleSelect(db)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <Database className="size-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{db.name}</CardTitle>
                          <CardDescription className="text-xs font-mono">
                            {db.url.replace(/(:\/\/[^:\/]+:)[^@]+(@)/, '$1*****$2')}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemove(db.id)
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                        <ArrowRight className="size-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardFooter className="pt-0 text-xs text-muted-foreground">
                    Added {new Date(db.createdAt).toLocaleDateString()}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
