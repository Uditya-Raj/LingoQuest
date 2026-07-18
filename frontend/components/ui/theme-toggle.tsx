'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore, type ThemePreference } from '@/stores/ui-store'

const options: { value: ThemePreference; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light theme' },
  { value: 'dark', icon: Moon, label: 'Dark theme' },
  { value: 'system', icon: Monitor, label: 'System theme' },
]

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useUIStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className={cn('h-10 w-[132px] rounded-lq-full bg-lq-bg-sunken', className)} />
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme preference"
      className={cn(
        'inline-flex items-center gap-1 p-1',
        'rounded-lq-full bg-lq-bg-sunken',
        'border border-lq-border-default',
        className,
      )}
    >
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          onClick={() => setTheme(value)}
          className={cn(
            'flex items-center justify-center',
            'h-8 w-10 rounded-lq-full',
            'transition-colors duration-[var(--lq-duration-hover)]',
            'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-1',
            theme === value
              ? 'bg-lq-bg-surface shadow-lq-sm text-lq-primary'
              : 'text-lq-text-secondary hover:text-lq-text-primary',
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
}
