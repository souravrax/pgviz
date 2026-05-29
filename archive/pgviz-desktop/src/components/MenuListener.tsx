'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { schemaStore } from '@/lib/store'
import { useTabStore } from '@/stores/tab-store'
import { queryClient } from '@/lib/query-client'
import { openSettingsWindow } from '@/lib/settings-window'

function isTauri() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export function MenuListener() {
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    if (!isTauri()) return

    let unlistenNavigate: (() => void) | undefined
    let unlistenDisconnect: (() => void) | undefined
    let unlistenRefresh: (() => void) | undefined
    let unlistenToggleTheme: (() => void) | undefined
    let unlistenPreferences: (() => void) | undefined
    let unlistenAbout: (() => void) | undefined

    const init = async () => {
      const { listen } = await import('@tauri-apps/api/event')

      unlistenNavigate = await listen<string>('navigate', (event) => {
        // Legacy navigate event — no-op since we have no router
        console.log('Navigate event (legacy):', event.payload)
      })

      unlistenDisconnect = await listen('disconnect', () => {
        schemaStore.getState().setActiveDatabase(null)
        useTabStore.getState().closeAllTabs()
      })

      unlistenRefresh = await listen('refresh-schema', () => {
        queryClient.invalidateQueries({ queryKey: ['schema'] })
      })

      unlistenToggleTheme = await listen('toggle-theme', () => {
        const isDark = document.documentElement.classList.contains('dark')
        setTheme(isDark ? 'light' : 'dark')
      })

      unlistenPreferences = await listen('show-preferences', () => {
        openSettingsWindow()
      })

      unlistenAbout = await listen('show-about', () => {
        // Could open an about dialog here
        console.log('About pgviz')
      })
    }

    init()

    return () => {
      unlistenNavigate?.()
      unlistenDisconnect?.()
      unlistenRefresh?.()
      unlistenToggleTheme?.()
      unlistenPreferences?.()
      unlistenAbout?.()
    }
  }, [theme, setTheme])

  return null
}
