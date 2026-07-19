'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LEARNER_NAV_ITEMS, isNavItemActive } from '@/components/layout/nav-items'
import { cn } from '@/lib/utils'

export function DesktopNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'hidden lg:flex',
        'fixed inset-y-0 left-0 z-navigation',
        'w-[88px]',
        'flex-col items-center gap-1',
        'border-r-2 border-lq-border-default',
        'bg-lq-bg-surface',
        'px-2 pt-4 pb-6',
      )}
    >
      <Link
        href="/learn"
        className={cn(
          'mb-6 flex h-12 items-center justify-center gap-1',
          'rounded-lq-lg px-2 font-extrabold text-lq-primary',
          'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-2',
        )}
        aria-label="LingoQuest home"
      >
        <span aria-hidden="true" className="text-lq-xl tracking-tight">
          LQ
        </span>
      </Link>

      <ul className="flex w-full flex-1 flex-col items-center gap-1">
        {LEARNER_NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href)
          const Icon = item.icon
          return (
            <li key={item.href} className="w-full">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex min-h-12 w-full flex-col items-center justify-center gap-0.5',
                  'rounded-lq-lg px-1 py-2',
                  'text-[11px] font-bold leading-tight',
                  'transition-colors duration-[var(--lq-duration-hover)]',
                  'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-2',
                  active
                    ? 'bg-lq-selected-bg text-lq-primary'
                    : 'text-lq-text-secondary hover:bg-lq-bg-sunken hover:text-lq-text-primary',
                )}
              >
                {active ? (
                  <span className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-lq-primary" />
                ) : null}
                <Icon size={22} aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
