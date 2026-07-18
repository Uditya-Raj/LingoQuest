'use client'

/**
 * Phase 10A placeholder renderer — displays exercise metadata only.
 * Does not fabricate answers in production; submission stays disabled here.
 */

import { useEffect } from 'react'

import { SurfaceCard } from '@/components/ui/surface-card'
import { StatusBadge } from '@/components/ui/status-badge'
import type { ExerciseRendererContract } from '@/components/lesson/exercise-renderer-types'
import { buildAnswerPayload } from '@/components/lesson/exercise-renderer-types'
import { exerciseTypeLabel } from '@/lib/lesson/format-solution'
import type { PublicExercise, SubmittedAnswer } from '@/lib/contracts/exercises'

function PlaceholderExerciseView({
  exercise,
  feedback,
}: {
  exercise: PublicExercise
  feedback: { isCorrect: boolean } | null
}) {
  return (
    <SurfaceCard className="space-y-4 p-5 sm:p-6" aria-labelledby="exercise-prompt">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge variant="info">{exerciseTypeLabel(exercise.type)}</StatusBadge>
        {feedback ? (
          <StatusBadge variant={feedback.isCorrect ? 'success' : 'error'}>
            {feedback.isCorrect ? 'Correct' : 'Incorrect'}
          </StatusBadge>
        ) : null}
      </div>
      <h2 id="exercise-prompt" className="text-lq-xl font-extrabold text-lq-text-primary">
        {exercise.prompt}
      </h2>
      <p className="text-lq-sm text-lq-text-secondary">
        The dedicated {exerciseTypeLabel(exercise.type).toLowerCase()} interaction
        arrives in Phase 10B. Answers are orchestrated by the lesson session; this
        placeholder never submits fabricated responses.
      </p>
    </SurfaceCard>
  )
}

function PlaceholderDraftReset({
  exercise,
  onDraftChange,
}: {
  exercise: PublicExercise
  onDraftChange: (answer: SubmittedAnswer | null) => void
}) {
  useEffect(() => {
    onDraftChange(null)
  }, [exercise.id, exercise.position, onDraftChange])

  return null
}

export const placeholderExerciseRenderer: ExerciseRendererContract = {
  Component: function PlaceholderExerciseRenderer({
    exercise,
    onDraftChange,
    feedback,
  }) {
    return (
      <>
        <PlaceholderDraftReset exercise={exercise} onDraftChange={onDraftChange} />
        <PlaceholderExerciseView exercise={exercise} feedback={feedback} />
      </>
    )
  },

  buildSubmitPayload() {
    return null
  },

  isDraftValid() {
    return false
  },

  resetKey(exercise) {
    return `${exercise.id}-${exercise.position}`
  },
}

/**
 * Test-only renderer that forwards typed payloads without UI fabrication in production paths.
 */
export const testExerciseRenderer: ExerciseRendererContract = {
  Component: PlaceholderExerciseView,

  buildSubmitPayload(exercise, draft) {
    if (draft === null) return null
    return buildAnswerPayload(exercise, draft)
  },

  isDraftValid(_exercise, draft) {
    return draft !== null
  },

  resetKey(exercise) {
    return `${exercise.id}-${exercise.position}`
  },
}
