'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { schemaStore } from '@/lib/store'

function isTauri() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export function MenuListener() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    if (!isTauri()) return

    let unlistenNavigate: (() => void) | undefined
    let unlistenDisconnect: (() => void) | undefined
    let unlistenRefresh: (() => void) | undefined
    let unlistenToggleTheme: (() => void) | undefined

    const init = async () => {
      const { listen } = await import('@tauri-apps/api/event')

      unlistenNavigate = await listen<string>('navigate', (event) => {
        if (event.payload) {
          router.push(event.payload)
        }
      })

      unlistenDisconnect = await listen('disconnect', () => {
        schemaStore.getState().setActiveDatabase(null)
        router.push('/')
      })

      unlistenRefresh = await listen('refresh-schema', () => {
        // Force schema reload by toggling selected schema back to itself
        const { selectedSchema, setSelectedSchema } = schemaStore.getState()
        setSelectedSchema(selectedSchema)
      })

      unlistenToggleTheme = await listen('toggle-theme', () => {
        const isDark = document.documentElement.classList.contains('dark')
        setTheme(isDark ? 'light' : 'dark')
      })
    }

    init()

    return () => {
      unlistenNavigate?.()
      unlistenDisconnect?.()
      unlistenRefresh?.()
      unlistenToggleTheme?.()
    }
  }, [router, theme, setTheme])

  return null
}
