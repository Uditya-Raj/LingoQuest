/**
 * Strict exercise renderer boundary for Phase 10B components.
 */

import type { ComponentType } from 'react'

import type {
  CorrectAnswer,
  PublicExercise,
  SubmittedAnswer,
} from '@/lib/contracts/exercises'
import type { AnswerSubmitPayload } from '@/lib/contracts/lesson'

export interface ExerciseRendererFeedback {
  isCorrect: boolean
  correctAnswer: CorrectAnswer
}

export interface ExerciseRendererProps {
  exercise: PublicExercise
  draftAnswer: SubmittedAnswer | null
  onDraftChange: (answer: SubmittedAnswer | null) => void
  disabled: boolean
  isSubmitting: boolean
  feedback: ExerciseRendererFeedback | null
  /** Optional Check trigger for Enter in text exercises when draft is valid. */
  onRequestCheck?: () => void
}

export interface ExerciseRendererContract {
  /** Visual interaction component — must not expose correct answers from retrieval. */
  Component: ComponentType<ExerciseRendererProps>
  /** Returns null when the draft cannot produce a valid typed payload. */
  buildSubmitPayload: (
    exercise: PublicExercise,
    draft: SubmittedAnswer | null,
  ) => AnswerSubmitPayload | null
  isDraftValid: (
    exercise: PublicExercise,
    draft: SubmittedAnswer | null,
  ) => boolean
  resetKey: (exercise: PublicExercise) => string
}

export function buildAnswerPayload(
  exercise: PublicExercise,
  draft: SubmittedAnswer,
): AnswerSubmitPayload {
  return {
    exercise_id: exercise.id,
    position: exercise.position,
    answer: draft,
  }
}
