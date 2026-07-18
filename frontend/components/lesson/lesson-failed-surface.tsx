'use client'

import Link from 'next/link'

import { QuestMascot } from '@/components/ui/quest-mascot'
import { SurfaceCard } from '@/components/ui/surface-card'
import { StatusBadge } from '@/components/ui/status-badge'
import type { FailureReason } from '@/lib/contracts/common'

function failureMessage(reason: FailureReason): {
  title: string
  body: string
  badge: string
} {
  if (reason === 'time_expired') {
    return {
      title: 'Time expired',
      body: 'This timed practice session ended before completion. No XP was awarded.',
      badge: 'Timed practice ended',
    }
  }
  return {
    title: 'Out of hearts',
    body: 'You ran out of hearts before finishing this lesson. No XP was awarded.',
    badge: 'Lesson failed',
  }
}

interface LessonFailedSurfaceProps {
  skillTitle: string
  failureReason: FailureReason
}

export function LessonFailedSurface({
  skillTitle,
  failureReason,
}: LessonFailedSurfaceProps) {
  const copy = failureMessage(failureReason)

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-lq-narrow flex-col justify-center gap-4 px-4 py-8 sm:px-6">
      <SurfaceCard className="space-y-4 p-6 text-center">
        <QuestMascot variant="concerned" size={72} decorative />
        <div>
          <StatusBadge variant="error">{copy.badge}</StatusBadge>
          <h1 className="mt-3 text-lq-2xl font-extrabold">{copy.title}</h1>
          <p className="mt-1 text-lq-sm font-bold text-lq-text-secondary">
            {skillTitle}
          </p>
        </div>
        <p className="text-lq-sm text-lq-text-secondary">{copy.body}</p>
        <p className="text-lq-xs text-lq-text-secondary">
          Refill and retry flows arrive in a later phase.
        </p>
        <Link
          href="/"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-lq bg-lq-secondary px-5 text-lq-base font-bold text-lq-text-inverse shadow-lq-md"
        >
          Return to learning path
        </Link>
      </SurfaceCard>
    </main>
  )
}
