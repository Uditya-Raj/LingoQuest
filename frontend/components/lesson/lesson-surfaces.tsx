'use client'

import Link from 'next/link'

import { Button3D } from '@/components/ui/button-3d'
import { QuestMascot } from '@/components/ui/quest-mascot'
import { Skeleton } from '@/components/ui/skeleton'
import { SurfaceCard } from '@/components/ui/surface-card'

export function LessonLoadingSurface() {
  return (
    <div
      className="mx-auto flex min-h-[100dvh] max-w-lq-narrow flex-col justify-center gap-4 px-4 py-8 sm:px-6"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading lesson"
    >
      <Skeleton height={28} width="60%" />
      <Skeleton height={16} className="w-full" />
      <Skeleton height={180} className="w-full" />
      <Skeleton height={48} className="w-full" />
    </div>
  )
}

interface LessonErrorSurfaceProps {
  title: string
  message: string
  recoverable: boolean
  onRetry?: () => void
}

export function LessonErrorSurface({
  title,
  message,
  recoverable,
  onRetry,
}: LessonErrorSurfaceProps) {
  return (
    <main
      className="mx-auto flex min-h-[100dvh] max-w-lq-narrow flex-col items-center justify-center gap-4 px-4 py-8 text-center sm:px-6"
      role="alert"
    >
      <QuestMascot variant="concerned" size={64} decorative />
      <h1 className="text-lq-2xl font-extrabold">{title}</h1>
      <p className="text-lq-sm text-lq-text-secondary" id="lesson-error-message">
        {message}
      </p>
      {recoverable && onRetry ? (
        <Button3D onClick={onRetry} aria-describedby="lesson-error-message">
          Retry
        </Button3D>
      ) : null}
      <Link
        href="/"
        className="inline-flex min-h-11 items-center font-bold text-lq-primary underline"
      >
        Return to learning path
      </Link>
    </main>
  )
}

interface LessonTimedNoticeProps {
  remainingSeconds: number | null
}

export function LessonTimedNotice({ remainingSeconds }: LessonTimedNoticeProps) {
  return (
    <SurfaceCard className="mb-4 border-lq-timed/30 bg-lq-timed/5 p-4">
      <p className="text-lq-sm font-bold text-lq-text-primary">
        Timed Practice session
      </p>
      <p className="mt-1 text-lq-sm text-lq-text-secondary">
        Live countdown and timed interactions arrive in a later update. This
        shell retrieves your timed attempt
        {remainingSeconds !== null ? ` (${remainingSeconds}s remaining on server)` : ''}{' '}
        without failing locally.
      </p>
    </SurfaceCard>
  )
}
