'use client'

import { useMemo } from 'react'

import { WordTile } from '@/components/ui/word-tile'
import { Button3D } from '@/components/ui/button-3d'
import { ExerciseFrame } from '@/components/lesson/exercise-frame'
import type { ExerciseRendererProps } from '@/components/lesson/exercise-renderer-types'
import type {
  AnswerFor,
  TranslateWordBankExercise,
} from '@/lib/contracts/exercises'

type WordBankDraft = AnswerFor<'translate_word_bank'>

function isWordBankDraft(
  draft: ExerciseRendererProps['draftAnswer'],
): draft is WordBankDraft {
  return (
    draft !== null &&
    typeof draft === 'object' &&
    'ordered_ids' in draft &&
    Array.isArray(draft.ordered_ids)
  )
}

interface WordBankExerciseViewProps extends ExerciseRendererProps {
  exercise: TranslateWordBankExercise
}

export function WordBankExerciseView({
  exercise,
  draftAnswer,
  onDraftChange,
  disabled,
  isSubmitting,
  feedback,
}: WordBankExerciseViewProps) {
  const locked = disabled || isSubmitting || feedback !== null
  const orderedIds = useMemo(
    () => (isWordBankDraft(draftAnswer) ? draftAnswer.ordered_ids : []),
    [draftAnswer],
  )
  const placedSet = useMemo(() => new Set(orderedIds), [orderedIds])

  const textById = useMemo(() => {
    const map = new Map<string, string>()
    for (const option of exercise.options) {
      map.set(option.id, option.text)
    }
    return map
  }, [exercise.options])

  const statusText = useMemo(() => {
    if (orderedIds.length === 0) return 'Answer area empty.'
    const words = orderedIds.map((id) => textById.get(id) ?? id)
    return `Your answer: ${words.join(' ')}`
  }, [orderedIds, textById])

  const appendId = (id: string) => {
    if (locked || placedSet.has(id)) return
    onDraftChange({ ordered_ids: [...orderedIds, id] })
  }

  const removeId = (id: string) => {
    if (locked) return
    onDraftChange({ ordered_ids: orderedIds.filter((item) => item !== id) })
  }

  const clearAll = () => {
    if (locked || orderedIds.length === 0) return
    onDraftChange({ ordered_ids: [] })
  }

  const bankOptions = exercise.options.filter((option) => !placedSet.has(option.id))

  return (
    <ExerciseFrame
      exerciseId={exercise.id}
      exerciseType={exercise.type}
      instruction="Build the translation by tapping words in order."
      prompt={exercise.prompt}
      statusText={statusText}
    >
      <div className="space-y-4">
        <div
          className="min-h-[3.5rem] rounded-lq border-2 border-dashed border-lq-border-default bg-lq-bg-page/60 p-3"
          aria-label="Your answer"
        >
          {orderedIds.length === 0 ? (
            <p className="text-lq-sm text-lq-text-tertiary">Tap words below to build your answer.</p>
          ) : (
            <ul className="flex flex-wrap gap-2" aria-label="Selected words in order">
              {orderedIds.map((id, index) => {
                const word = textById.get(id) ?? id
                return (
                  <li key={`${id}-${index}`}>
                    <WordTile
                      word={word}
                      state={
                        feedback
                          ? feedback.isCorrect
                            ? 'correct'
                            : 'incorrect'
                          : 'placed'
                      }
                      disabled={locked}
                      className="min-h-11 max-w-full whitespace-normal break-words"
                      aria-label={`Remove ${word} from position ${index + 1}`}
                      onClick={() => removeId(id)}
                    />
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {orderedIds.length > 0 ? (
          <Button3D
            variant="ghost"
            size="sm"
            type="button"
            disabled={locked}
            onClick={clearAll}
          >
            Clear answer
          </Button3D>
        ) : null}

        <div>
          <p className="mb-2 text-lq-xs font-bold uppercase tracking-wide text-lq-text-secondary">
            Word bank
          </p>
          <ul className="flex flex-wrap gap-2" aria-label="Available words">
            {bankOptions.map((option) => {
              const duplicateCount = exercise.options.filter(
                (item) => item.text === option.text,
              ).length
              const occurrence =
                exercise.options
                  .filter((item) => item.text === option.text)
                  .findIndex((item) => item.id === option.id) + 1
              const addLabel =
                duplicateCount > 1
                  ? `Add ${option.text}, choice ${occurrence}`
                  : `Add ${option.text}`

              return (
                <li key={option.id}>
                  <WordTile
                    word={option.text}
                    state="available"
                    disabled={locked}
                    className="min-h-11 max-w-full whitespace-normal break-words"
                    aria-label={addLabel}
                    onClick={() => appendId(option.id)}
                  />
                </li>
              )
            })}
          </ul>
          {bankOptions.length === 0 ? (
            <p className="mt-2 text-lq-sm text-lq-text-secondary">
              All words are in your answer. Tap a word above to remove it.
            </p>
          ) : null}
        </div>
      </div>
    </ExerciseFrame>
  )
}
