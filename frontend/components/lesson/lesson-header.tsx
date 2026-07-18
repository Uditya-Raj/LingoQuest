'use client'

import { LessonExitControl } from '@/components/lesson/lesson-exit-control'
import { LessonHearts } from '@/components/lesson/lesson-hearts'
import { LessonProgress } from '@/components/lesson/lesson-progress'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'

interface LessonHeaderProps {
  skillTitle: string
  mode: 'standard' | 'timed'
  progress: { current: number; total: number } | null
  hearts: { hearts: number; maxHearts: number } | null
  confirmExitOpen: boolean
  onRequestExit: () => void
  onConfirmExit: () => void
  onCancelExit: () => void
}

export function LessonHeader({
  skillTitle,
  mode,
  progress,
  hearts,
  confirmExitOpen,
  onRequestExit,
  onConfirmExit,
  onCancelExit,
}: LessonHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-[var(--lq-z-sticky)]',
        'border-b border-lq-border-default bg-lq-bg-page/95 backdrop-blur-sm',
        'px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6',
      )}
    >
      <div className="mx-auto flex w-full max-w-lq-narrow flex-col gap-3">
        <div className="flex items-center gap-3">
          <LessonExitControl
            skillTitle={skillTitle}
            confirmOpen={confirmExitOpen}
            onRequestExit={onRequestExit}
            onConfirmExit={onConfirmExit}
            onCancelExit={onCancelExit}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lq-xs font-bold uppercase tracking-wide text-lq-text-secondary">
              {mode === 'timed' ? 'Timed Practice' : 'Lesson'}
            </p>
            <h1 className="truncate text-lq-base font-extrabold sm:text-lq-lg">
              {skillTitle}
            </h1>
          </div>
          {mode === 'timed' ? (
            <StatusBadge variant="info" className="shrink-0">
              Timed
            </StatusBadge>
          ) : null}
          {hearts ? (
            <LessonHearts
              hearts={hearts.hearts}
              maxHearts={hearts.maxHearts}
              mode={mode}
              className="shrink-0"
            />
          ) : null}
        </div>
        {progress ? (
          <LessonProgress
            current={progress.current}
            total={progress.total}
            mode={mode}
          />
        ) : null}
      </div>
    </header>
  )
}
