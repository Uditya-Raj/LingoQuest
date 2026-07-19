'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'

import { DesktopNav } from '@/components/layout/desktop-nav'
import { GamificationBar } from '@/components/layout/gamification-bar'
import { MobileNav } from '@/components/layout/mobile-nav'
import type { LearnerSummary } from '@/lib/contracts/common'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: ReactNode
  learner: LearnerSummary | null
  learnerLoading?: boolean
  rightPanel?: ReactNode
  /** Extra header content below the gamification bar (e.g. course title). */
  headerExtra?: ReactNode
}

/**
 * Responsive learner application shell.
 * Lesson routes must not use this shell.
 */
export function AppShell({
  children,
  learner,
  learnerLoading = false,
  rightPanel,
  headerExtra,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-lq-bg-page text-lq-text-primary">
      <a
        href="#main-content"
        className={cn(
          'sr-only focus:not-sr-only',
          'fixed left-4 top-4 z-toast',
          'rounded-lq bg-lq-primary px-4 py-2 font-bold text-lq-text-inverse',
        )}
      >
        Skip to main content
      </a>

      <DesktopNav />
      <MobileNav />

      <div
        className={cn(
          'lg:pl-[88px]',
          'pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-6',
        )}
      >
        <header
          className={cn(
            'sticky top-0 z-sticky',
            'border-b border-lq-border-default',
            'bg-lq-bg-surface/95 backdrop-blur-sm',
            'px-4 py-2.5 sm:px-6',
          )}
        >
          <div className="mx-auto flex max-w-lq-full flex-col gap-2">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <Link
                href="/"
                className="truncate text-lq-base font-extrabold text-lq-primary sm:text-lq-lg lg:hidden"
                aria-label="LingoQuest home"
              >
                LingoQuest
              </Link>
              <GamificationBar
                learner={learner}
                loading={learnerLoading}
                className="w-full justify-between sm:w-auto sm:min-w-0 sm:flex-1 sm:justify-end lg:justify-start"
                showDailyGoal={false}
              />
            </div>
            {headerExtra}
          </div>
        </header>

        <div
          className={cn(
            'mx-auto flex w-full max-w-lq-full gap-8',
            'px-4 py-6 sm:px-6 lg:px-8',
          )}
        >
          <main id="main-content" className="min-w-0 flex-1">
            {children}
          </main>
          {rightPanel}
        </div>
      </div>
    </div>
  )
}
