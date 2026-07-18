'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import type { ExerciseRendererContract } from '@/components/lesson/exercise-renderer-types'
import { LessonCompletedSurface } from '@/components/lesson/lesson-completed-surface'
import { LessonFailedSurface } from '@/components/lesson/lesson-failed-surface'
import { LessonFeedbackRegion } from '@/components/lesson/lesson-feedback-region'
import { LessonHeader } from '@/components/lesson/lesson-header'
import { LessonLayout } from '@/components/lesson/lesson-layout'
import {
  LessonErrorSurface,
  LessonLoadingSurface,
} from '@/components/lesson/lesson-surfaces'
import { LessonTimedCompletedSurface } from '@/components/lesson/lesson-timed-completed-surface'
import { exerciseRenderer } from '@/components/lesson/exercise-renderer'
import { Button3D } from '@/components/ui/button-3d'
import { QuestMascot } from '@/components/ui/quest-mascot'
import { useToast } from '@/components/ui/toast'
import { useLessonSession } from '@/hooks/use-lesson-session'
import { useTimedLessonClock } from '@/hooks/use-timed-lesson-clock'
import { cancelActiveLessonAudio } from '@/lib/audio/lesson-audio-controller'
import type { SubmittedAnswer } from '@/lib/contracts/exercises'

interface LessonPlayerProps {
  attemptId: number
  renderer?: ExerciseRendererContract
}

export function LessonPlayer({
  attemptId,
  renderer = exerciseRenderer,
}: LessonPlayerProps) {
  const router = useRouter()
  const { addToast } = useToast()
  const session = useLessonSession({ attemptId })
  const { state } = session

  const [draftAnswer, setDraftAnswer] = useState<SubmittedAnswer | null>(null)
  const [confirmExitOpen, setConfirmExitOpen] = useState(false)
  const mutationToastKeyRef = useRef<string | null>(null)

  const attemptForClock =
    state.status === 'ready' ||
    state.status === 'submitting' ||
    state.status === 'feedback' ||
    state.status === 'completing'
      ? state.attempt
      : null

  const checkExpiry = session.checkExpiry
  const confirmExpiry = useCallback(async () => {
    const result = await checkExpiry()
    if (result.outcome === 'expired') {
      return { outcome: 'expired' as const }
    }
    if (result.outcome === 'in_progress') {
      return {
        outcome: 'in_progress' as const,
        remainingSeconds: result.remainingSeconds,
        expiresAt: result.expiresAt,
      }
    }
    return { outcome: 'error' as const }
  }, [checkExpiry])

  const timedClock = useTimedLessonClock({
    mode: attemptForClock?.mode,
    expiresAt: attemptForClock?.expires_at,
    remainingSeconds: attemptForClock?.remaining_seconds,
    attemptId: attemptForClock?.attempt_id,
    enabled: attemptForClock?.status === 'in_progress',
    confirmExpiry,
  })

  const activeExercise =
    state.status === 'ready' || state.status === 'submitting'
      ? state.currentExercise
      : state.status === 'feedback'
        ? state.answeredExercise
        : state.status === 'completing'
          ? state.resumeFeedback.answeredExercise
          : null

  const rendererResetKey = useMemo(() => {
    if (activeExercise === null) return 'idle'
    return renderer.resetKey(activeExercise)
  }, [activeExercise, renderer])

  useEffect(() => {
    setDraftAnswer(null)
  }, [rendererResetKey])

  useEffect(() => {
    if (!session.mutationError) {
      mutationToastKeyRef.current = null
      return
    }
    const key = `${session.mutationError.code}:${session.mutationError.message}`
    if (mutationToastKeyRef.current === key) return
    mutationToastKeyRef.current = key
    addToast({
      variant: 'error',
      title: 'Connection issue',
      description: session.mutationError.message,
      priority: 'high',
      duration: 5000,
    })
  }, [addToast, session.mutationError])

  const submitPayload = useMemo(() => {
    if (activeExercise === null || state.status !== 'ready') return null
    return renderer.buildSubmitPayload(activeExercise, draftAnswer)
  }, [activeExercise, draftAnswer, renderer, state.status])

  const interactionBlocked = timedClock.blocksInteraction

  const canPressCheck =
    session.canSubmit &&
    !interactionBlocked &&
    submitPayload !== null &&
    activeExercise !== null &&
    renderer.isDraftValid(activeExercise, draftAnswer)

  const handleSubmit = useCallback(() => {
    if (submitPayload === null || interactionBlocked) return
    // Cancel speech on Check so feedback announcements are not overlapping.
    cancelActiveLessonAudio()
    session.submitCurrentAnswer(submitPayload)
  }, [interactionBlocked, session, submitPayload])

  const handleContinue = useCallback(() => {
    if (interactionBlocked) return
    cancelActiveLessonAudio()
    session.continueLesson()
  }, [interactionBlocked, session])

  const handleConfirmExit = useCallback(() => {
    cancelActiveLessonAudio()
    setConfirmExitOpen(false)
    router.push('/')
  }, [router])

  // Cancel on attempt change, terminal surfaces, and unmount.
  useEffect(() => {
    return () => {
      cancelActiveLessonAudio()
    }
  }, [attemptId])

  useEffect(() => {
    if (
      state.status === 'completed' ||
      state.status === 'failed' ||
      state.status === 'completing'
    ) {
      cancelActiveLessonAudio()
    }
  }, [state.status])

  useEffect(() => {
    if (timedClock.isBackendExpired) {
      cancelActiveLessonAudio()
    }
  }, [timedClock.isBackendExpired])

  if (state.status === 'loading') {
    return <LessonLoadingSurface />
  }

  if (state.status === 'error') {
    const title =
      state.error.status === 404 ? 'Attempt not found' : 'Could not load attempt'
    return (
      <LessonErrorSurface
        title={title}
        message={state.error.message}
        recoverable={state.recoverable}
        onRetry={state.recoverable ? session.retryRead : undefined}
      />
    )
  }

  if (state.status === 'completed') {
    if (state.attempt.mode === 'timed') {
      return (
        <LessonTimedCompletedSurface
          skillTitle={state.attempt.skill_title}
          skillId={state.attempt.skill_id}
          completed={state.completed}
          mistakesCount={state.attempt.mistakes_count}
        />
      )
    }
    return (
      <LessonCompletedSurface
        skillTitle={state.attempt.skill_title}
        completed={state.completed}
      />
    )
  }

  if (state.status === 'failed') {
    return (
      <LessonFailedSurface
        skillTitle={state.attempt.skill_title}
        failureReason={state.failureReason}
        attempt={state.attempt}
      />
    )
  }

  const attempt = state.attempt
  const feedbackState =
    state.status === 'feedback'
      ? state
      : state.status === 'completing'
        ? {
            answerResult: state.resumeFeedback.answerResult,
            answeredExercise: state.resumeFeedback.answeredExercise,
          }
        : null
  const Renderer = renderer.Component
  const showActionBar = state.status === 'ready' || state.status === 'submitting'
  const isTimed = attempt.mode === 'timed'

  return (
    <LessonLayout
      header={
        <LessonHeader
          skillTitle={attempt.skill_title}
          mode={attempt.mode}
          progress={session.progress}
          hearts={isTimed ? null : session.hearts}
          timedClock={
            isTimed
              ? {
                  phase: timedClock.phase,
                  displayLabel: timedClock.displayLabel,
                  accessibleLabel: timedClock.accessibleLabel,
                  announcement: timedClock.announcement,
                }
              : null
          }
          confirmExitOpen={confirmExitOpen}
          onRequestExit={() => setConfirmExitOpen(true)}
          onConfirmExit={handleConfirmExit}
          onCancelExit={() => setConfirmExitOpen(false)}
        />
      }
      exercise={
        activeExercise && state.status !== 'completing' ? (
          <Renderer
            exercise={activeExercise}
            draftAnswer={draftAnswer}
            onDraftChange={setDraftAnswer}
            disabled={!session.canSubmit || interactionBlocked}
            isSubmitting={session.isSubmitting}
            onRequestCheck={canPressCheck ? handleSubmit : undefined}
            feedback={
              feedbackState
                ? {
                    isCorrect: feedbackState.answerResult.is_correct,
                    correctAnswer: feedbackState.answerResult.correct_answer,
                  }
                : null
            }
          />
        ) : state.status === 'completing' ? (
          <div
            className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center"
            aria-live="polite"
            aria-busy="true"
          >
            <QuestMascot variant="celebrating" size={72} decorative />
            <p className="text-lq-lg font-extrabold">
              {isTimed ? 'Confirming Timed Practice…' : 'Wrapping up your quest…'}
            </p>
            <p className="text-lq-sm text-lq-text-secondary">
              Confirming XP and progress with the server.
            </p>
          </div>
        ) : null
      }
      actions={
        showActionBar ? (
          <div className="space-y-2">
            {session.mutationError ? (
              <p className="text-lq-sm font-bold text-lq-text-error" role="alert">
                {session.mutationError.message}
              </p>
            ) : null}
            {timedClock.isCheckingExpiry ? (
              <p className="text-lq-sm font-bold text-lq-text-secondary" aria-live="polite">
                Checking time…
              </p>
            ) : null}
            <Button3D
              className="w-full"
              onClick={handleSubmit}
              disabled={!canPressCheck}
              loading={session.isSubmitting}
            >
              {session.isSubmitting ? 'Checking…' : 'Check'}
            </Button3D>
          </div>
        ) : null
      }
      feedback={
        feedbackState ? (
          <LessonFeedbackRegion
            open
            answerResult={feedbackState.answerResult}
            answeredExercise={feedbackState.answeredExercise}
            showHearts={attempt.mode === 'standard'}
            canContinue={
              (session.canContinue || session.isCompleting) && !interactionBlocked
            }
            isCompleting={session.isCompleting}
            mutationError={session.mutationError?.message ?? null}
            onContinue={handleContinue}
          />
        ) : null
      }
    />
  )
}
