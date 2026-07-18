'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface LessonLayoutProps {
  header: ReactNode
  exercise: ReactNode
  actions: ReactNode
  feedback: ReactNode
  banner?: ReactNode
}

export function LessonLayout({
  header,
  exercise,
  actions,
  feedback,
  banner,
}: LessonLayoutProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-lq-bg-page text-lq-text-primary">
      {header}
      <div className="mx-auto flex w-full max-w-lq-narrow flex-1 flex-col px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-24 sm:pt-6">
        {banner}
        <section
          aria-label="Current exercise"
          className="flex flex-1 flex-col gap-4"
        >
          {exercise}
        </section>
      </div>

      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-[var(--lq-z-sticky)]',
          'border-t border-lq-border-default bg-lq-bg-page/95 backdrop-blur-sm',
          'px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6',
        )}
      >
        <div className="mx-auto w-full max-w-lq-narrow">{actions}</div>
      </div>

      {feedback}
    </div>
  )
}
