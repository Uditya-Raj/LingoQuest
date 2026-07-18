'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LEARNER_NAV_ITEMS, isNavItemActive } from '@/components/layout/nav-items'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'lg:hidden',
        'fixed inset-x-0 bottom-0 z-navigation',
        'border-t-2 border-lq-border-default',
        'bg-lq-bg-surface',
        'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      <ul className="grid h-14 grid-cols-4">
        {LEARNER_NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-full min-h-11 flex-col items-center justify-center gap-0.5',
                  'text-lq-xs font-bold',
                  'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-[-2px]',
                  active
                    ? 'text-lq-primary'
                    : 'text-lq-text-secondary',
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
