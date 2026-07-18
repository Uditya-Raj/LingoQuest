'use client'

import { useRef, type KeyboardEvent } from 'react'

import { ExerciseFrame } from '@/components/lesson/exercise-frame'
import type { ExerciseRendererProps } from '@/components/lesson/exercise-renderer-types'
import type { AnswerFor, TypeAnswerExercise } from '@/lib/contracts/exercises'
import { cn } from '@/lib/utils'

type TypeDraft = AnswerFor<'type_answer'>

function isTypeDraft(
  draft: ExerciseRendererProps['draftAnswer'],
): draft is TypeDraft {
  return (
    draft !== null &&
    typeof draft === 'object' &&
    'text' in draft &&
    typeof draft.text === 'string'
  )
}

interface TypeAnswerExerciseViewProps extends ExerciseRendererProps {
  exercise: TypeAnswerExercise
}

export function TypeAnswerExerciseView({
  exercise,
  draftAnswer,
  onDraftChange,
  disabled,
  isSubmitting,
  feedback,
  onRequestCheck,
}: TypeAnswerExerciseViewProps) {
  const locked = disabled || isSubmitting || feedback !== null
  const value = isTypeDraft(draftAnswer) ? draftAnswer.text : ''
  const composingRef = useRef(false)

  const inputClass = cn(
    'min-h-11 w-full rounded-lq border-2 bg-lq-bg-surface px-3 py-2',
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
      instruction="Type your answer."
      prompt={exercise.prompt}
      audioUrl={exercise.audio_url}
      ttsText={exercise.tts_text}
      ttsLang={exercise.tts_lang}
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor={`type-answer-${exercise.id}`}
          className="text-lq-sm font-bold text-lq-text-secondary"
        >
          Type your answer
        </label>
        <input
          id={`type-answer-${exercise.id}`}
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
          lang="en"
          aria-describedby={`exercise-prompt-${exercise.id} exercise-instruction-${exercise.id}`}
          className={inputClass}
        />
      </div>
    </ExerciseFrame>
  )
}
