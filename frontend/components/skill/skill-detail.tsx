'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Lock } from 'lucide-react'

import { Button3D } from '@/components/ui/button-3d'
import { ProgressRing } from '@/components/ui/progress-ring'
import { QuestMascot } from '@/components/ui/quest-mascot'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { SurfaceCard } from '@/components/ui/surface-card'
import { ApiError, getSkill, startLesson, startTimedPractice } from '@/lib/api'
import type { SkillDetailResponse } from '@/lib/contracts/course'
import { SkillIcon } from '@/lib/icons/skill-icons'
import { statusLabel } from '@/lib/path/current-skill'
import { useSessionStore } from '@/stores/session-store'
import { cn } from '@/lib/utils'

interface SkillDetailViewProps {
  skillId: number
}

type DetailStatus = 'loading' | 'ready' | 'error' | 'not_found'

export function SkillDetailView({ skillId }: SkillDetailViewProps) {
  const router = useRouter()
  const setLearner = useSessionStore((s) => s.setLearner)
  const setAttempt = useSessionStore((s) => s.setAttempt)

  const [data, setData] = useState<SkillDetailResponse | null>(null)
  const [status, setStatus] = useState<DetailStatus>('loading')
  const [error, setError] = useState<{ code: string; message: string } | null>(
    null,
  )
  const [actionError, setActionError] = useState<{
    code: string
    message: string
  } | null>(null)
  const [pendingAction, setPendingAction] = useState<
    'standard' | 'timed' | null
  >(null)
  const [reloadToken, setReloadToken] = useState(0)
  const mountedRef = useRef(true)
  const pendingRef = useRef(false)

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
    setActionError(null)

    void getSkill(skillId, controller.signal)
      .then((response) => {
        if (!mountedRef.current || controller.signal.aborted) return
        setData(response)
        setLearner(response.learner)
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
          message: 'Unable to reach the LingoQuest API.',
        })
        setStatus('error')
      })

    return () => controller.abort()
  }, [skillId, reloadToken, setLearner])

  const runStart = useCallback(
    async (mode: 'standard' | 'timed') => {
      if (pendingRef.current) return
      pendingRef.current = true
      setPendingAction(mode)
      setActionError(null)

      try {
        const attempt =
          mode === 'standard'
            ? await startLesson(skillId)
            : await startTimedPractice(skillId)

        if (!mountedRef.current) return
        setAttempt(attempt)
        const existing = useSessionStore.getState().learner
        if (existing !== null) {
          setLearner({
            ...existing,
            hearts: attempt.hearts,
            max_hearts: attempt.max_hearts,
            next_heart_at: attempt.next_heart_at,
          })
        }
        router.push(`/lesson/${attempt.attempt_id}`)
      } catch (err: unknown) {
        if (!mountedRef.current) return
        if (err instanceof ApiError) {
          setActionError({ code: err.code, message: err.message })
        } else {
          setActionError({
            code: 'NETWORK_ERROR',
            message: 'Unable to start the lesson. Try again.',
          })
        }
        pendingRef.current = false
        setPendingAction(null)
      }
    },
    [router, setAttempt, setLearner, skillId],
  )

  if (status === 'loading') {
    return <SkillDetailSkeleton />
  }

  if (status === 'not_found') {
    return (
      <div className="mx-auto max-w-md py-12 text-center" role="alert">
        <QuestMascot variant="concerned" size={64} decorative />
        <h1 className="mt-4 text-lq-2xl font-extrabold">Skill not found</h1>
        <p className="mt-2 text-lq-sm text-lq-text-secondary">
          {error?.message ?? 'This skill is not in your active course.'}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center font-bold text-lq-primary underline"
        >
          Back to learning path
        </Link>
      </div>
    )
  }

  if (status === 'error' || data === null) {
    return (
      <div className="mx-auto max-w-md py-12 text-center" role="alert">
        <QuestMascot variant="concerned" size={64} decorative />
        <h1 className="mt-4 text-lq-2xl font-extrabold">Something went wrong</h1>
        <p className="mt-2 text-lq-sm text-lq-text-secondary" id="skill-error">
          {error?.message ?? 'Could not load this skill.'}
        </p>
        <Button3D
          className="mt-6"
          onClick={() => setReloadToken((t) => t + 1)}
          aria-describedby="skill-error"
        >
          Retry
        </Button3D>
      </div>
    )
  }

  const { skill, lesson, active_attempt, can_start, blocked_reason } = data
  const locked = skill.status === 'locked'
  const hasActive = active_attempt !== null
  const standardLabel = hasActive ? 'Resume Lesson' : 'Start Lesson'
  const timedLabel = 'Timed Practice'
  const pending = pendingAction !== null

  return (
    <div className="mx-auto w-full max-w-md space-y-5 pb-28 sm:pb-6">
      <Link
        href="/"
        className={cn(
          'inline-flex min-h-11 items-center gap-2',
          'rounded-lq-lg px-2 py-1',
          'text-lq-sm font-bold text-lq-text-secondary',
          'hover:bg-lq-bg-sunken hover:text-lq-primary',
          'transition-colors duration-[var(--lq-duration-hover)]',
          'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-2',
        )}
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Back to path
      </Link>

      <SurfaceCard className="overflow-hidden">
        <div
          className={cn(
            'flex flex-col items-center gap-3 px-5 pb-4 pt-6 text-center sm:px-6',
            locked
              ? 'bg-lq-locked-bg'
              : 'bg-gradient-to-b from-lq-primary/10 to-transparent',
          )}
        >
          <div
            className={cn(
              'flex h-20 w-20 items-center justify-center',
              'rounded-lq-full border-[3px]',
              'border-b-[length:var(--lq-depth-lg)]',
              'shadow-lq-md',
              locked
                ? 'border-lq-locked-border bg-lq-locked-bg text-lq-locked-text'
                : skill.status === 'completed'
                  ? 'border-lq-success bg-lq-success text-white border-b-lq-success-depth'
                  : 'border-lq-primary bg-lq-primary text-white border-b-lq-primary-depth',
            )}
          >
            {locked ? (
              <Lock size={32} aria-hidden="true" />
            ) : (
              <SkillIcon iconKey={skill.icon} size={32} decorative />
            )}
          </div>
          <div>
            <h1 className="text-lq-2xl font-extrabold text-lq-text-primary">
              {skill.title}
            </h1>
            <p className="mt-1 text-lq-sm text-lq-text-secondary">{skill.description}</p>
          </div>
          <StatusBadge
            variant={
              locked
                ? 'locked'
                : skill.status === 'completed'
                  ? 'success'
                  : skill.status === 'in_progress'
                    ? 'warning'
                    : 'info'
            }
          >
            {statusLabel(skill.status)}
          </StatusBadge>
        </div>

        <div className="space-y-5 px-5 pb-5 pt-4 sm:px-6">
          <div className="flex items-center gap-4 rounded-lq-lg bg-lq-bg-page p-3">
            <ProgressRing
              value={skill.crowns}
              max={skill.max_level}
              size={64}
              label={`${skill.crowns} of ${skill.max_level} crowns`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-lq-sm font-bold text-lq-text-secondary">Crown progress</p>
              <p className="text-lq-xl font-extrabold tabular-nums text-lq-text-primary">
                {skill.crowns} / {skill.max_level}
              </p>
            </div>
            <QuestMascot
              variant={locked ? 'concerned' : 'encouraging'}
              size={48}
              decorative
              className="shrink-0"
            />
          </div>

          {locked ? (
            <div
              className="flex items-start gap-3 rounded-lq-lg border-2 border-lq-locked-border bg-lq-locked-bg p-4 text-lq-sm"
              role="status"
            >
              <Lock size={20} className="mt-0.5 shrink-0 text-lq-locked-text" aria-hidden="true" />
              <div>
                <p className="font-bold text-lq-text-primary">Skill locked</p>
                <p className="mt-0.5 text-lq-text-secondary">
                  {blocked_reason ??
                    (skill.prerequisite
                      ? `Complete "${skill.prerequisite.title}" first to unlock this trail.`
                      : 'Finish the previous skill on your path to continue.')}
                </p>
              </div>
            </div>
          ) : null}

          {!locked && !can_start && blocked_reason ? (
            <div
              className="flex items-start gap-3 rounded-lq-lg border-2 border-lq-error bg-lq-error-bg p-4 text-lq-sm text-lq-text-error"
              role="status"
            >
              {blocked_reason}
            </div>
          ) : null}

          {hasActive && active_attempt ? (
            <div className="flex items-center gap-2 rounded-lq-lg bg-lq-primary/10 p-3 text-lq-sm font-semibold text-lq-primary">
              <div className="h-2 w-2 rounded-full bg-lq-primary" />
              In progress — exercise {active_attempt.current_index + 1} of{' '}
              {active_attempt.total_exercises}
            </div>
          ) : null}

          <p className="text-lq-xs text-lq-text-secondary">
            {lesson.attempt_exercise_count} exercises · {lesson.base_xp} XP base
          </p>

          {actionError ? (
            <div
              className="rounded-lq-lg border-2 border-lq-error bg-lq-error-bg p-4 text-lq-sm"
              role="alert"
              id="skill-action-error"
            >
              <p className="font-bold text-lq-text-error">{actionError.code}</p>
              <p className="mt-0.5 text-lq-text-error">{actionError.message}</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            {!locked ? (
              <div
                className={cn(
                  'fixed inset-x-0 z-sticky sm:static sm:z-auto',
                  'bottom-[calc(3.5rem+env(safe-area-inset-bottom))]',
                  'border-t-2 border-lq-border-default bg-lq-bg-surface/95 px-4 py-3 backdrop-blur-sm',
                  'sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none',
                )}
              >
                <Button3D
                  variant="primary"
                  size="lg"
                  className="w-full"
                  loading={pendingAction === 'standard'}
                  disabled={pending || !can_start}
                  onClick={() => void runStart('standard')}
                  aria-describedby={actionError ? 'skill-action-error' : undefined}
                >
                  {standardLabel}
                </Button3D>
              </div>
            ) : null}

            {!locked ? (
              <div className="space-y-3 rounded-lq-lg border-2 border-lq-secondary/30 bg-lq-bg-elevated p-4">
                <div className="flex items-start gap-2.5">
                  <Clock
                    size={20}
                    className="mt-0.5 shrink-0 text-lq-timed"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-bold text-lq-text-primary">Timed Practice</p>
                    <p className="mt-0.5 text-lq-xs text-lq-text-secondary">
                      120-second challenge · {lesson.attempt_exercise_count}{' '}
                      exercises · No heart cost · Fixed XP
                    </p>
                  </div>
                </div>
                <Button3D
                  variant="timed"
                  size="md"
                  className="w-full"
                  loading={pendingAction === 'timed'}
                  disabled={pending || skill.status === 'locked'}
                  onClick={() => void runStart('timed')}
                  aria-describedby={actionError ? 'skill-action-error' : undefined}
                >
                  {timedLabel}
                </Button3D>
              </div>
            ) : null}
          </div>
        </div>
      </SurfaceCard>
    </div>
  )
}

function SkillDetailSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-md space-y-5"
      aria-busy="true"
      aria-label="Loading skill details"
    >
      <Skeleton width={120} height={20} className="rounded-lq-lg" />
      <SurfaceCard className="overflow-hidden">
        <div className="flex flex-col items-center gap-3 px-6 pb-4 pt-6">
          <Skeleton variant="circular" width={80} height={80} />
          <Skeleton height={28} width="50%" />
          <Skeleton height={16} width="70%" />
        </div>
        <div className="space-y-4 px-6 pb-6">
          <Skeleton height={64} className="w-full rounded-lq-lg" />
          <Skeleton height={52} className="w-full rounded-lq-lg" />
          <Skeleton height={80} className="w-full rounded-lq-lg" />
        </div>
      </SurfaceCard>
    </div>
  )
}
