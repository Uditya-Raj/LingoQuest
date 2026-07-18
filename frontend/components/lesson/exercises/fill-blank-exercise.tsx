'use client'

import { useRef, type KeyboardEvent } from 'react'

import { ExerciseFrame } from '@/components/lesson/exercise-frame'
import type { ExerciseRendererProps } from '@/components/lesson/exercise-renderer-types'
import type { AnswerFor, FillBlankExercise } from '@/lib/contracts/exercises'
import { cn } from '@/lib/utils'

const BLANK_MARKER = '___'

type FillDraft = AnswerFor<'fill_blank'>

function isFillDraft(
  draft: ExerciseRendererProps['draftAnswer'],
): draft is FillDraft {
  return (
    draft !== null &&
    typeof draft === 'object' &&
    'text' in draft &&
    typeof draft.text === 'string'
  )
}

export function splitPromptAtBlank(prompt: string): {
  before: string
  after: string
  hasMarker: boolean
} {
  const index = prompt.indexOf(BLANK_MARKER)
  if (index === -1) {
    return { before: prompt, after: '', hasMarker: false }
  }
  return {
    before: prompt.slice(0, index),
    after: prompt.slice(index + BLANK_MARKER.length),
    hasMarker: true,
  }
}

interface FillBlankExerciseViewProps extends ExerciseRendererProps {
  exercise: FillBlankExercise
}

export function FillBlankExerciseView({
  exercise,
  draftAnswer,
  onDraftChange,
  disabled,
  isSubmitting,
  feedback,
  onRequestCheck,
}: FillBlankExerciseViewProps) {
  const locked = disabled || isSubmitting || feedback !== null
  const value = isFillDraft(draftAnswer) ? draftAnswer.text : ''
  const composingRef = useRef(false)
  const { hasMarker } = splitPromptAtBlank(exercise.prompt)

  const inputClass = cn(
    'min-h-11 min-w-[6rem] flex-1 rounded-lq border-2 bg-lq-bg-surface px-3 py-2',
    'text-lq-base font-semibold text-lq-text-primary',
    'border-lq-border-default border-b-[length:var(--lq-depth-sm)] border-b-lq-border-strong',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lq-border-focus',
    feedback?.isCorrect && 'border-lq-success bg-lq-success-bg',
    feedback && !feedback.isCorrect && 'border-lq-error bg-lq-error-bg',
  )

  const handleChange = (next: string) => {
    if (locked) return
    onDraftChange({ text: next })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    if (composingRef.current || event.nativeEvent.isComposing) return
    if (locked) return
    if (value.trim().length === 0) return
    event.preventDefault()
    onRequestCheck?.()
  }

  return (
    <ExerciseFrame
      exerciseId={exercise.id}
      exerciseType={exercise.type}
      instruction="Fill in the missing word."
      prompt={exercise.prompt}
    >
      <div className="space-y-3">
        {!hasMarker ? (
          <p className="text-lq-sm text-lq-text-secondary">
            Type the missing word for this sentence.
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          <label
            htmlFor={`fill-blank-${exercise.id}`}
            className="text-lq-sm font-bold text-lq-text-secondary"
          >
            Type the missing word
          </label>
          <input
            id={`fill-blank-${exercise.id}`}
            type="text"
            value={value}
            onChange={(event) => handleChange(event.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => {
              composingRef.current = true
            }}
            onCompositionEnd={() => {
              composingRef.current = false
            }}
            disabled={locked}
            readOnly={locked}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-describedby={`exercise-prompt-${exercise.id} exercise-instruction-${exercise.id}`}
            className={inputClass}
          />
        </div>
      </div>
    </ExerciseFrame>
  )
}
