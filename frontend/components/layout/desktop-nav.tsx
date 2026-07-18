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
        'w-[72px]',
        'flex-col items-center gap-2',
        'border-r-2 border-lq-border-default',
        'bg-lq-bg-surface',
        'px-2 py-4',
      )}
    >
      <Link
        href="/"
        className={cn(
          'mb-4 flex h-12 w-12 items-center justify-center',
          'rounded-lq font-extrabold text-lq-primary',
          'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-2',
        )}
        aria-label="LingoQuest home"
      >
        <span aria-hidden="true" className="text-lq-lg">
          LQ
        </span>
      </Link>

      <ul className="flex w-full flex-col items-center gap-1">
        {LEARNER_NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href)
          const Icon = item.icon
          return (
            <li key={item.href} className="w-full">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 w-full flex-col items-center justify-center gap-0.5',
                  'rounded-lq px-1 py-2',
                  'text-lq-xs font-bold',
                  'transition-colors duration-[var(--lq-duration-hover)]',
                  'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-2',
                  active
                    ? 'bg-lq-selected-bg text-lq-primary'
                    : 'text-lq-text-secondary hover:bg-lq-bg-sunken hover:text-lq-text-primary',
                )}
              >
                <Icon size={22} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
