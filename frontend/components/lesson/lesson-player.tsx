'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
  LessonTimedNotice,
} from '@/components/lesson/lesson-surfaces'
import { placeholderExerciseRenderer } from '@/components/lesson/placeholder-exercise-renderer'
import { Button3D } from '@/components/ui/button-3d'
import { useLessonSession } from '@/hooks/use-lesson-session'
import type { SubmittedAnswer } from '@/lib/contracts/exercises'

interface LessonPlayerProps {
  attemptId: number
  renderer?: ExerciseRendererContract
}

export function LessonPlayer({
  attemptId,
  renderer = placeholderExerciseRenderer,
}: LessonPlayerProps) {
  const router = useRouter()
  const session = useLessonSession({ attemptId })
  const { state } = session

  const [draftAnswer, setDraftAnswer] = useState<SubmittedAnswer | null>(null)
  const [confirmExitOpen, setConfirmExitOpen] = useState(false)

  const activeExercise =
    state.status === 'ready' || state.status === 'submitting'
      ? state.currentExercise
      : state.status === 'feedback'
        ? state.answeredExercise
        : null

  const rendererResetKey = useMemo(() => {
    if (activeExercise === null) return 'idle'
    return renderer.resetKey(activeExercise)
  }, [activeExercise, renderer])

  useEffect(() => {
    setDraftAnswer(null)
  }, [rendererResetKey])

  const submitPayload = useMemo(() => {
    if (activeExercise === null || state.status !== 'ready') return null
    return renderer.buildSubmitPayload(activeExercise, draftAnswer)
  }, [activeExercise, draftAnswer, renderer, state.status])

  const canPressCheck =
    session.canSubmit &&
    submitPayload !== null &&
    activeExercise !== null &&
    renderer.isDraftValid(activeExercise, draftAnswer)

  const handleSubmit = useCallback(() => {
    if (submitPayload === null) return
    session.submitCurrentAnswer(submitPayload)
  }, [session, submitPayload])

  const handleConfirmExit = useCallback(() => {
    setConfirmExitOpen(false)
    router.push('/')
  }, [router])

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
      />
    )
  }

  const attempt = state.attempt
  const feedbackState = state.status === 'feedback' ? state : null
  const Renderer = renderer.Component

  return (
    <LessonLayout
      header={
        <LessonHeader
          skillTitle={attempt.skill_title}
          mode={attempt.mode}
          progress={session.progress}
          hearts={session.hearts}
          confirmExitOpen={confirmExitOpen}
          onRequestExit={() => setConfirmExitOpen(true)}
          onConfirmExit={handleConfirmExit}
          onCancelExit={() => setConfirmExitOpen(false)}
        />
      }
      banner={
        attempt.mode === 'timed' ? (
          <LessonTimedNotice remainingSeconds={attempt.remaining_seconds} />
        ) : undefined
      }
      exercise={
        activeExercise ? (
          <Renderer
            exercise={activeExercise}
            draftAnswer={draftAnswer}
            onDraftChange={setDraftAnswer}
            disabled={!session.canSubmit}
            isSubmitting={session.isSubmitting}
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
          <p className="text-lq-sm text-lq-text-secondary" aria-live="polite">
            Completing lesson…
          </p>
        ) : null
      }
      actions={
        <div className="space-y-2">
          {session.mutationError ? (
            <p className="text-lq-sm font-bold text-lq-text-error" role="alert">
              {session.mutationError.message}
            </p>
          ) : null}
          <Button3D
            className="w-full"
            onClick={handleSubmit}
            disabled={!canPressCheck}
            loading={session.isSubmitting}
          >
            Check
          </Button3D>
          {activeExercise &&
          state.status === 'ready' &&
          !renderer.isDraftValid(activeExercise, draftAnswer) ? (
            <p className="text-center text-lq-xs text-lq-text-secondary">
              Phase 10B exercise interactions will enable Check here.
            </p>
          ) : null}
        </div>
      }
      feedback={
        feedbackState ? (
          <LessonFeedbackRegion
            open
            answerResult={feedbackState.answerResult}
            answeredExercise={feedbackState.answeredExercise}
            canContinue={session.canContinue}
            isCompleting={session.isCompleting}
            onContinue={session.continueLesson}
          />
        ) : null
      }
    />
  )
}
