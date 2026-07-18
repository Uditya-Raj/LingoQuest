'use client'

import Link from 'next/link'

import { QuestMascot } from '@/components/ui/quest-mascot'
import { SurfaceCard } from '@/components/ui/surface-card'
import { StatusBadge } from '@/components/ui/status-badge'
import type { CompletedData } from '@/lib/lesson/session-types'

interface LessonCompletedSurfaceProps {
  skillTitle: string
  completed: CompletedData
}

export function LessonCompletedSurface({
  skillTitle,
  completed,
}: LessonCompletedSurfaceProps) {
  const xpEarned =
    completed.source === 'fresh'
      ? completed.completion.xp.earned
      : completed.summary.xp_earned
  const perfect =
    completed.source === 'fresh'
      ? completed.completion.xp.perfect
      : completed.summary.perfect

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-lq-narrow flex-col justify-center gap-4 px-4 py-8 sm:px-6">
      <SurfaceCard className="space-y-4 p-6 text-center">
        <QuestMascot variant="celebrating" size={72} decorative />
        <div>
          <StatusBadge variant="success">Lesson complete</StatusBadge>
          <h1 className="mt-3 text-lq-2xl font-extrabold">{skillTitle}</h1>
        </div>
        <p className="text-lq-sm text-lq-text-secondary">
          You earned {xpEarned} XP from the server
          {perfect ? ' with a perfect bonus' : ''}. Full celebration UI arrives
          in Phase 10C.
        </p>
        <Link
          href="/"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-lq bg-lq-primary px-5 text-lq-base font-bold text-lq-text-inverse shadow-lq-md"
        >
          Return to learning path
        </Link>
      </SurfaceCard>
    </main>
  )
}
