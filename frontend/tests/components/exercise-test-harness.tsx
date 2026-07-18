'use client'

import { useState } from 'react'

import { exerciseRenderer } from '@/components/lesson/exercise-renderer'
import type { ExerciseRendererFeedback } from '@/components/lesson/exercise-renderer-types'
import type { PublicExercise, SubmittedAnswer } from '@/lib/contracts/exercises'

interface ExerciseHarnessProps {
  exercise: PublicExercise
  disabled?: boolean
  isSubmitting?: boolean
  feedback?: ExerciseRendererFeedback | null
  onRequestCheck?: () => void
  onDraftChange?: (answer: SubmittedAnswer | null) => void
}

/** Controlled draft wrapper for Testing Library interactions. */
export function ExerciseHarness({
  exercise,
  disabled = false,
  isSubmitting = false,
  feedback = null,
  onRequestCheck,
  onDraftChange,
}: ExerciseHarnessProps) {
  const [draftAnswer, setDraftAnswer] = useState<SubmittedAnswer | null>(null)
  const Renderer = exerciseRenderer.Component

  return (
    <Renderer
      exercise={exercise}
      draftAnswer={draftAnswer}
      onDraftChange={(next) => {
        setDraftAnswer(next)
        onDraftChange?.(next)
      }}
      disabled={disabled}
      isSubmitting={isSubmitting}
      feedback={feedback}
      onRequestCheck={onRequestCheck}
    />
  )
}
