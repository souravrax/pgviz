'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from 'zustand'
import { schemaStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Moon,
  Sun,
  Monitor,
  Trash2,
  Database,
  Package,
} from 'lucide-react'
import { useTheme } from 'next-themes'

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const databases = useStore(schemaStore, (s) => s.databases)
  const deleteDatabase = useStore(schemaStore, (s) => s.deleteDatabase)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure? This will remove all saved connections.')) {
      for (const db of databases) {
        await deleteDatabase(db.id)
      }
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
          <ArrowLeft className="size-4" />
        </Button>
        <span className="text-sm font-semibold">Settings</span>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-2xl">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure preferences and manage your data
            </p>
          </div>

          <div className="space-y-8">
            {/* Appearance */}
            <section>
              <h2 className="text-base font-semibold">Appearance</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Customize how pgviz looks and feels
              </p>

              <div className="mt-4 rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {resolvedTheme === 'dark' ? (
                      <Moon className="size-5 text-muted-foreground" />
                    ) : (
                      <Sun className="size-5 text-muted-foreground" />
                    )}
                    <div>
                      <Label className="text-sm font-medium">Theme</Label>
                      <p className="text-xs text-muted-foreground">
                        Choose your preferred color scheme
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('light')}
                    >
                      <Sun className="size-3.5 mr-1.5" />
                      Light
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('dark')}
                    >
                      <Moon className="size-3.5 mr-1.5" />
                      Dark
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('system')}
                    >
                      <Monitor className="size-3.5 mr-1.5" />
                      System
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Saved Connections */}
            <section>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Saved Connections</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {databases.length} connection{databases.length !== 1 ? 's' : ''} stored locally
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAll}
                  disabled={databases.length === 0}
                >
                  <Trash2 className="size-3.5 mr-1.5" />
                  Clear All
                </Button>
              </div>

              {databases.length > 0 && (
                <div className="mt-4 space-y-2">
                  {databases.map((db) => (
                    <div
                      key={db.id}
                      className="flex items-center justify-between rounded-xl border bg-card px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Database className="size-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{db.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {db.url.replace(/(:\/\/[^:\/]+:)[^@]+(@)/, '$1*****$2')}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteDatabase(db.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* About */}
            <section>
              <h2 className="text-base font-semibold">About</h2>
              <div className="mt-4 rounded-xl border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Package className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">pgviz</p>
                    <p className="text-xs text-muted-foreground">v0.1.0</p>
                  </div>
                </div>
                <Separator className="my-3" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Interactive PostgreSQL schema visualizer and query tool. Built with
                  Next.js, Tauri, and Rust.
                </p>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Licensed under PolyForm Noncommercial 1.0.0. Commercial use requires
                  a license — available on Lemon Squeezy for $10.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
