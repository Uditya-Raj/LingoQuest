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
    <div className="mx-auto w-full max-w-md space-y-4">
      <Link
        href="/"
        className={cn(
          'inline-flex min-h-11 items-center gap-2',
          'text-lq-sm font-bold text-lq-text-secondary',
          'hover:text-lq-primary',
          'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-2',
        )}
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Back to path
      </Link>

      <SurfaceCard className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex h-16 w-16 shrink-0 items-center justify-center',
              'rounded-lq-full border-[3px] border-b-[length:var(--lq-depth-md)]',
              locked
                ? 'border-lq-locked-border bg-lq-locked-bg text-lq-locked-text'
                : 'border-lq-primary-depth bg-lq-primary text-lq-text-inverse',
            )}
          >
            {locked ? (
              <Lock size={28} aria-hidden="true" />
            ) : (
              <SkillIcon iconKey={skill.icon} size={28} decorative />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lq-2xl font-extrabold text-lq-text-primary">
                {skill.title}
              </h1>
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
            <p className="text-lq-sm text-lq-text-secondary">{skill.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ProgressRing
            value={skill.crowns}
            max={skill.max_level}
            size={72}
            label={`${skill.crowns} of ${skill.max_level} crowns`}
          />
          <div>
            <p className="text-lq-sm font-bold text-lq-text-secondary">Crowns</p>
            <p className="text-lq-xl font-extrabold tabular-nums">
              {skill.crowns} / {skill.max_level}
            </p>
            <p className="text-lq-xs text-lq-text-secondary">
              Max level {skill.max_level}
            </p>
          </div>
          <QuestMascot
            className="ml-auto hidden sm:block"
            variant={locked ? 'concerned' : 'encouraging'}
            size={56}
            decorative
          />
        </div>

        {locked ? (
          <div
            className="rounded-lq border-2 border-lq-locked-border bg-lq-locked-bg p-3 text-lq-sm"
            role="status"
          >
            <p className="font-bold text-lq-text-primary">This skill is locked</p>
            <p className="mt-1 text-lq-text-secondary">
              {blocked_reason ??
                (skill.prerequisite
                  ? `Complete “${skill.prerequisite.title}” first to unlock this skill.`
                  : 'Finish the previous skill on your path to continue.')}
            </p>
          </div>
        ) : null}

        {!locked && !can_start && blocked_reason ? (
          <div
            className="rounded-lq border-2 border-lq-error bg-lq-error-bg p-3 text-lq-sm text-lq-text-error"
            role="status"
          >
            {blocked_reason}
          </div>
        ) : null}

        {hasActive && active_attempt ? (
          <p className="text-lq-sm font-semibold text-lq-text-secondary">
            In progress: exercise {active_attempt.current_index + 1} of{' '}
            {active_attempt.total_exercises}
          </p>
        ) : null}

        <p className="text-lq-xs text-lq-text-secondary">
          Lesson pool {lesson.exercise_pool_size} · {lesson.attempt_exercise_count}{' '}
          exercises · {lesson.base_xp} XP base
        </p>

        {actionError ? (
          <div
            className="rounded-lq border-2 border-lq-error bg-lq-error-bg p-3 text-lq-sm"
            role="alert"
            id="skill-action-error"
          >
            <p className="font-bold text-lq-text-error">{actionError.code}</p>
            <p className="text-lq-text-error">{actionError.message}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          {!locked ? (
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
          ) : null}

          {!locked ? (
            <div className="space-y-2 rounded-lq border-2 border-lq-secondary/40 bg-lq-bg-elevated p-3">
              <div className="flex items-start gap-2">
                <Clock
                  size={18}
                  className="mt-0.5 shrink-0 text-lq-timed"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-bold text-lq-text-primary">Timed Practice</p>
                  <p className="text-lq-xs text-lq-text-secondary">
                    120-second challenge with {lesson.attempt_exercise_count}{' '}
                    exercises. Mistakes do not cost hearts. Successful completion
                    awards fixed XP without crowns.
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
      </SurfaceCard>
    </div>
  )
}

function SkillDetailSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-md space-y-4"
      aria-busy="true"
      aria-label="Loading skill details"
    >
      <Skeleton width={120} height={20} />
      <SurfaceCard className="space-y-4 p-6">
        <div className="flex gap-4">
          <Skeleton variant="circular" width={64} height={64} />
          <div className="flex-1 space-y-2">
            <Skeleton height={28} width="60%" />
            <Skeleton height={16} width="90%" />
          </div>
        </div>
        <Skeleton height={48} className="w-full" />
        <Skeleton height={56} className="w-full" />
      </SurfaceCard>
    </div>
  )
}
