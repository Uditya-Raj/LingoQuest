'use client'

import { useEffect, useMemo } from 'react'

import { ChoiceTile, type ChoiceTileState } from '@/components/ui/choice-tile'
import { ExerciseFrame } from '@/components/lesson/exercise-frame'
import type { ExerciseRendererProps } from '@/components/lesson/exercise-renderer-types'
import type {
  AnswerFor,
  CorrectAnswerFor,
  MultipleChoiceExercise,
} from '@/lib/contracts/exercises'

type McDraft = AnswerFor<'multiple_choice'>

function isMcDraft(draft: ExerciseRendererProps['draftAnswer']): draft is McDraft {
  return (
    draft !== null &&
    typeof draft === 'object' &&
    'option_id' in draft &&
    typeof draft.option_id === 'string'
  )
}

function feedbackOptionId(
  feedback: ExerciseRendererProps['feedback'],
): string | null {
  if (!feedback) return null
  const answer = feedback.correctAnswer as CorrectAnswerFor<'multiple_choice'>
  return typeof answer.option_id === 'string' ? answer.option_id : null
}

interface MultipleChoiceExerciseViewProps extends ExerciseRendererProps {
  exercise: MultipleChoiceExercise
}

export function MultipleChoiceExerciseView({
  exercise,
  draftAnswer,
  onDraftChange,
  disabled,
  isSubmitting,
  feedback,
}: MultipleChoiceExerciseViewProps) {
  const locked = disabled || isSubmitting || feedback !== null
  const selectedId = isMcDraft(draftAnswer) ? draftAnswer.option_id : null
  const revealedCorrectId = feedbackOptionId(feedback)

  const statusText = useMemo(() => {
    if (selectedId === null) return 'No option selected yet.'
    const label =
      exercise.options.find((option) => option.id === selectedId)?.text ??
      selectedId
    return `Selected: ${label}`
  }, [exercise.options, selectedId])

  useEffect(() => {
    if (locked) return

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }

      const digit = Number.parseInt(event.key, 10)
      if (!Number.isFinite(digit) || digit < 1 || digit > 9) return
      const option = exercise.options[digit - 1]
      if (!option) return
      event.preventDefault()
      onDraftChange({ option_id: option.id })
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [exercise.options, locked, onDraftChange])

  return (
    <ExerciseFrame
      exerciseId={exercise.id}
      exerciseType={exercise.type}
      instruction="Choose the best answer."
      prompt={exercise.prompt}
      statusText={statusText}
    >
      <div
        role="radiogroup"
        aria-labelledby={`exercise-prompt-${exercise.id}`}
        aria-describedby={`exercise-instruction-${exercise.id}`}
        className="flex flex-col gap-3"
      >
        {exercise.options.map((option, index) => {
          let state: ChoiceTileState = 'default'
          if (feedback) {
            if (selectedId === option.id) {
              state = feedback.isCorrect ? 'correct' : 'incorrect'
            } else if (
              !feedback.isCorrect &&
              revealedCorrectId !== null &&
              option.id === revealedCorrectId
            ) {
              state = 'correct'
            } else {
              state = 'disabled'
            }
          } else if (selectedId === option.id) {
            state = 'selected'
          } else if (locked) {
            state = 'disabled'
          }

          const shortcut = index < 9 ? String(index + 1) : undefined

          return (
            <ChoiceTile
              key={option.id}
              label={option.text}
              shortcut={shortcut}
              state={state}
              disabled={locked}
              onClick={() => {
                if (locked) return
                onDraftChange({ option_id: option.id })
              }}
            >
              <span className="break-words">{option.text}</span>
            </ChoiceTile>
          )
        })}
      </div>
    </ExerciseFrame>
  )
}
