'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from 'zustand'
import { schemaStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Database, ArrowLeft, Link2 } from 'lucide-react'

export default function NewConnectionPage() {
  const router = useRouter()
  const databases = useStore(schemaStore, (s) => s.databases)
  const addDatabase = useStore(schemaStore, (s) => s.addDatabase)

  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const existingNames = databases.map((d) => d.name)

  const handleSubmit = async () => {
    const trimmedName = name.trim()
    const trimmedUrl = url.trim()

    if (!trimmedName) {
      setError('Name is required')
      return
    }
    if (!trimmedUrl) {
      setError('Connection URL is required')
      return
    }
    if (existingNames.includes(trimmedName)) {
      setError('A connection with this name already exists')
      return
    }

    setIsSubmitting(true)
    try {
      await addDatabase(trimmedName, trimmedUrl)
      router.push('/')
    } catch {
      setError('Failed to save connection')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
          <ArrowLeft className="size-4" />
        </Button>
        <span className="text-sm font-semibold">New Connection</span>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-xl">
          {/* Title */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Database className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">New Connection</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Add a PostgreSQL database to pgviz
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Connection Name</Label>
              <Input
                id="name"
                placeholder="e.g. production-db"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(null)
                }}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                A friendly name to identify this connection
              </p>
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label htmlFor="url">Connection URL</Label>
              <Textarea
                id="url"
                placeholder="postgresql://user:password@host:port/database?sslmode=require"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setError(null)
                }}
                rows={3}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                The full PostgreSQL connection string including credentials
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => router.push('/')}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                <Link2 className="size-4 mr-1.5" />
                {isSubmitting ? 'Saving...' : 'Connect'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
