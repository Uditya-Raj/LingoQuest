'use client'

import type { ReactNode } from 'react'

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
          'lg:pl-[72px]',
          'pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-6',
        )}
      >
        <header
          className={cn(
            'sticky top-0 z-sticky',
            'border-b-2 border-lq-border-default',
            'bg-lq-bg-surface/95 backdrop-blur-sm',
            'px-4 py-3 sm:px-6',
          )}
        >
          <div className="mx-auto flex max-w-lq-full flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate font-extrabold text-lq-primary lg:hidden">
                LingoQuest
              </p>
              <GamificationBar
                learner={learner}
                loading={learnerLoading}
                className="min-w-0 flex-1 justify-end overflow-hidden lg:justify-start"
                showDailyGoal={false}
              />
            </div>
            {headerExtra}
          </div>
        </header>

        <div
          className={cn(
            'mx-auto flex w-full max-w-lq-full gap-6',
            'px-4 py-6 sm:px-6',
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
