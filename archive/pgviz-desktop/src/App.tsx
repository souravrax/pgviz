'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { ThemeProvider } from '@/components/theme-provider'
import { MenuListener } from '@/components/MenuListener'
import { Sidebar } from '@/components/Sidebar'
import { TabBar } from '@/components/TabBar'
import { Workspace } from '@/components/Workspace'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useTheme } from 'next-themes'
import { useLicense, useActivateLicense, useDeactivateLicense } from '@/hooks/use-tauri-query'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Settings, Moon, Sun, Monitor } from 'lucide-react'
import { openSettingsWindow } from '@/lib/settings-window'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Detect if we're in a settings window
const isSettingsWindow = new URLSearchParams(window.location.search).get('window') === 'settings'

export default function App() {
  if (isSettingsWindow) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            <SettingsWindow />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider>
          <MenuListener />
          <StudioView />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

// ── Studio View ───────────────────────────────────────────────────────────────

function StudioView() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 shrink-0 h-full flex flex-col border-r bg-sidebar">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <TabBar />
        <div className="flex-1 overflow-hidden">
          <Workspace />
        </div>
      </div>
    </div>
  )
}

// ── Settings Window ───────────────────────────────────────────────────────────

function SettingsWindow() {
  const { theme, setTheme } = useTheme()
  const { data: license } = useLicense()
  const deactivate = useDeactivateLicense()
  const [licenseKey, setLicenseKey] = useState('')
  const activate = useActivateLicense()

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex h-10 items-center gap-2 border-b px-4 bg-muted/30">
        <Settings className="size-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Settings</span>
      </header>

      <div className="flex-1 overflow-auto p-6 space-y-8 max-w-lg mx-auto w-full">
        {/* Theme */}
        <section>
          <h3 className="text-sm font-semibold mb-3">Appearance</h3>
          <div className="flex gap-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('light')}
              className="gap-1.5"
            >
              <Sun className="size-3.5" />
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('dark')}
              className="gap-1.5"
            >
              <Moon className="size-3.5" />
              Dark
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('system')}
              className="gap-1.5"
            >
              <Monitor className="size-3.5" />
              System
            </Button>
          </div>
        </section>

        {/* License */}
        <section>
          <h3 className="text-sm font-semibold mb-3">License</h3>
          {license ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span>Activated</span>
              </div>
              <p className="text-xs font-mono text-muted-foreground break-all">{license.key}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deactivate.mutate()}
                disabled={deactivate.isPending}
              >
                {deactivate.isPending ? 'Deactivating...' : 'Deactivate'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                placeholder="Enter license key..."
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
              />
              <Button
                size="sm"
                onClick={() => activate.mutate({ key: licenseKey, productId: 'pgviz' })}
                disabled={activate.isPending || !licenseKey.trim()}
              >
                {activate.isPending ? 'Activating...' : 'Activate'}
              </Button>
            </div>
          )}
        </section>

        {/* App Info */}
        <section>
          <h3 className="text-sm font-semibold mb-3">About</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>pgviz v0.2.0</p>
            <p>Built with Rust + Tauri + React</p>
            <p>Licensed under BSL 1.1</p>
          </div>
        </section>
      </div>
    </div>
  )
}
