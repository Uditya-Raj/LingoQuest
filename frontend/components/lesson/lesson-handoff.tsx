'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Layers } from 'lucide-react'

import { Button3D } from '@/components/ui/button-3d'
import { QuestMascot } from '@/components/ui/quest-mascot'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { SurfaceCard } from '@/components/ui/surface-card'
import { ApiError, getAttempt } from '@/lib/api'
import type { LessonAttemptResponse } from '@/lib/contracts/lesson'
import { useSessionStore } from '@/stores/session-store'
import { cn } from '@/lib/utils'

interface LessonHandoffProps {
  attemptId: number
}

type HandoffStatus = 'loading' | 'ready' | 'error' | 'not_found'

/**
 * Temporary Phase 9A handoff: proves retrieve + navigation.
 * Full exercise player arrives in Phase 10A.
 */
export function LessonHandoff({ attemptId }: LessonHandoffProps) {
  const setAttempt = useSessionStore((s) => s.setAttempt)
  const [attempt, setLocalAttempt] = useState<LessonAttemptResponse | null>(null)
  const [status, setStatus] = useState<HandoffStatus>('loading')
  const [error, setError] = useState<{ code: string; message: string } | null>(
    null,
  )
  const [reloadToken, setReloadToken] = useState(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    setError(null)

    void getAttempt(attemptId, controller.signal)
      .then((response) => {
        if (!mountedRef.current || controller.signal.aborted) return
        setLocalAttempt(response)
        setAttempt(response)
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (!mountedRef.current || controller.signal.aborted) return
        if (err instanceof ApiError) {
          setError({ code: err.code, message: err.message })
          setStatus(err.status === 404 ? 'not_found' : 'error')
          return
        }
        setError({
          code: 'NETWORK_ERROR',
          message: 'Unable to retrieve this lesson attempt.',
        })
        setStatus('error')
      })

    return () => controller.abort()
  }, [attemptId, reloadToken, setAttempt])

  if (status === 'loading') {
    return (
      <div
        className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6"
        aria-busy="true"
        aria-label="Loading lesson attempt"
      >
        <Skeleton height={28} width="70%" />
        <Skeleton height={120} className="w-full" />
        <Skeleton height={48} className="w-full" />
      </div>
    )
  }

  if (status === 'not_found' || status === 'error' || attempt === null) {
    return (
      <div
        className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center"
        role="alert"
      >
        <QuestMascot variant="concerned" size={64} decorative />
        <h1 className="text-lq-2xl font-extrabold">
          {status === 'not_found' ? 'Attempt not found' : 'Could not load attempt'}
        </h1>
        <p className="text-lq-sm text-lq-text-secondary" id="handoff-error">
          {error?.message ?? 'This lesson attempt could not be retrieved.'}
        </p>
        {status === 'error' ? (
          <Button3D
            onClick={() => setReloadToken((t) => t + 1)}
            aria-describedby="handoff-error"
          >
            Retry
          </Button3D>
        ) : null}
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-bold text-lq-primary underline"
        >
          Return to learning path
        </Link>
      </div>
    )
  }

  const modeLabel = attempt.mode === 'timed' ? 'Timed Practice' : 'Standard lesson'
  const exerciseCount = attempt.exercises.length

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-4 sm:p-6">
      <Link
        href="/"
        className={cn(
          'inline-flex min-h-11 w-fit items-center gap-2',
          'text-lq-sm font-bold text-lq-text-secondary hover:text-lq-primary',
        )}
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Return to learning path
      </Link>

      <SurfaceCard className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lq-xs font-bold uppercase tracking-wide text-lq-text-secondary">
              Lesson ready
            </p>
            <h1 className="mt-1 text-lq-2xl font-extrabold text-lq-text-primary">
              {attempt.skill_title}
            </h1>
          </div>
          <QuestMascot variant="encouraging" size={56} decorative />
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge variant={attempt.mode === 'timed' ? 'info' : 'success'}>
            {modeLabel}
          </StatusBadge>
          <StatusBadge variant="default">{attempt.status.replace('_', ' ')}</StatusBadge>
          {attempt.resumed ? (
            <StatusBadge variant="warning">Resumed</StatusBadge>
          ) : (
            <StatusBadge variant="info">New attempt</StatusBadge>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-3 text-lq-sm">
          <div className="rounded-lq bg-lq-bg-sunken p-3">
            <dt className="inline-flex items-center gap-1 font-bold text-lq-text-secondary">
              <Layers size={14} aria-hidden="true" />
              Exercises
            </dt>
            <dd className="mt-1 text-lq-lg font-extrabold tabular-nums">
              {attempt.total_exercises}
            </dd>
          </div>
          <div className="rounded-lq bg-lq-bg-sunken p-3">
            <dt className="inline-flex items-center gap-1 font-bold text-lq-text-secondary">
              <Clock size={14} aria-hidden="true" />
              Position
            </dt>
            <dd className="mt-1 text-lq-lg font-extrabold tabular-nums">
              {attempt.current_index + 1} / {attempt.total_exercises}
            </dd>
          </div>
        </dl>

        <p className="text-lq-sm text-lq-text-secondary">
          Attempt #{attempt.attempt_id} retrieved successfully
          {exerciseCount > 0
            ? ` with ${exerciseCount} public exercises loaded.`
            : '.'}{' '}
          The interactive player arrives next — answers are not submitted from
          this screen.
        </p>

        <p className="sr-only">
          Hearts {attempt.hearts} of {attempt.max_hearts}. Mistakes{' '}
          {attempt.mistakes_count}.
        </p>
      </SurfaceCard>
    </div>
  )
}
