'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'

/**
 * Icon-only light/dark toggle for the welcome header (no border/box).
 */
export function WelcomeThemeButton({ className }: { className?: string }) {
  const { theme, setTheme } = useUIStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  if (!mounted) {
    return <span className={cn('inline-block h-5 w-5', className)} aria-hidden="true" />
  }

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'inline-flex items-center justify-center p-1',
        'text-lq-text-secondary hover:text-lq-text-primary',
        'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-2',
        className,
      )}
    >
      {isDark ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  )
}
