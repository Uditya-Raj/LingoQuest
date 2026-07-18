'use client'

import { useMemo, useState } from 'react'

import { MatchTile, type MatchTileState } from '@/components/ui/match-tile'
import { ExerciseFrame } from '@/components/lesson/exercise-frame'
import type { ExerciseRendererProps } from '@/components/lesson/exercise-renderer-types'
import type {
  AnswerFor,
  MatchPair,
  MatchPairsExercise,
} from '@/lib/contracts/exercises'

type MatchDraft = AnswerFor<'match_pairs'>

function isMatchDraft(
  draft: ExerciseRendererProps['draftAnswer'],
): draft is MatchDraft {
  return (
    draft !== null &&
    typeof draft === 'object' &&
    'pairs' in draft &&
    Array.isArray(draft.pairs)
  )
}

interface MatchPairsExerciseViewProps extends ExerciseRendererProps {
  exercise: MatchPairsExercise
}

export function MatchPairsExerciseView({
  exercise,
  draftAnswer,
  onDraftChange,
  disabled,
  isSubmitting,
  feedback,
}: MatchPairsExerciseViewProps) {
  const locked = disabled || isSubmitting || feedback !== null
  const pairs = useMemo(
    () => (isMatchDraft(draftAnswer) ? draftAnswer.pairs : []),
    [draftAnswer],
  )
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null)
  const [selectedRightId, setSelectedRightId] = useState<string | null>(null)

  const leftText = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of exercise.options.left) map.set(item.id, item.text)
    return map
  }, [exercise.options.left])

  const rightText = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of exercise.options.right) map.set(item.id, item.text)
    return map
  }, [exercise.options.right])

  const pairNumberByLeft = useMemo(() => {
    const map = new Map<string, number>()
    pairs.forEach((pair, index) => map.set(pair.left_id, index + 1))
    return map
  }, [pairs])

  const pairNumberByRight = useMemo(() => {
    const map = new Map<string, number>()
    pairs.forEach((pair, index) => map.set(pair.right_id, index + 1))
    return map
  }, [pairs])

  const pairedLeftIds = useMemo(
    () => new Set(pairs.map((pair) => pair.left_id)),
    [pairs],
  )
  const pairedRightIds = useMemo(
    () => new Set(pairs.map((pair) => pair.right_id)),
    [pairs],
  )

  const statusText = useMemo(() => {
    const parts: string[] = []
    if (selectedLeftId) {
      parts.push(`Selected left: ${leftText.get(selectedLeftId) ?? selectedLeftId}`)
    }
    if (selectedRightId) {
      parts.push(
        `Selected right: ${rightText.get(selectedRightId) ?? selectedRightId}`,
      )
    }
    if (pairs.length > 0) {
      const summary = pairs
        .map((pair, index) => {
          const left = leftText.get(pair.left_id) ?? pair.left_id
          const right = rightText.get(pair.right_id) ?? pair.right_id
          return `Pair ${index + 1}: ${left} with ${right}`
        })
        .join('. ')
      parts.push(summary)
    }
    return parts.length > 0 ? parts.join('. ') : 'No pairs yet.'
  }, [leftText, pairs, rightText, selectedLeftId, selectedRightId])

  const commitPairs = (next: MatchPair[]) => {
    onDraftChange({ pairs: next })
  }

  const removePairContaining = (side: 'left' | 'right', id: string) => {
    const next = pairs.filter((pair) =>
      side === 'left' ? pair.left_id !== id : pair.right_id !== id,
    )
    commitPairs(next)
  }

  const tryCreatePair = (leftId: string, rightId: string) => {
    const withoutConflicts = pairs.filter(
      (pair) => pair.left_id !== leftId && pair.right_id !== rightId,
    )
    commitPairs([...withoutConflicts, { left_id: leftId, right_id: rightId }])
    setSelectedLeftId(null)
    setSelectedRightId(null)
  }

  const onLeftClick = (id: string) => {
    if (locked) return
    if (pairedLeftIds.has(id)) {
      removePairContaining('left', id)
      setSelectedLeftId(null)
      setSelectedRightId(null)
      return
    }
    if (selectedRightId) {
      tryCreatePair(id, selectedRightId)
      return
    }
    setSelectedLeftId((current) => (current === id ? null : id))
  }

  const onRightClick = (id: string) => {
    if (locked) return
    if (pairedRightIds.has(id)) {
      removePairContaining('right', id)
      setSelectedLeftId(null)
      setSelectedRightId(null)
      return
    }
    if (selectedLeftId) {
      tryCreatePair(selectedLeftId, id)
      return
    }
    setSelectedRightId((current) => (current === id ? null : id))
  }

  const tileState = (
    side: 'left' | 'right',
    id: string,
  ): MatchTileState => {
    const paired =
      side === 'left' ? pairedLeftIds.has(id) : pairedRightIds.has(id)
    const selected =
      side === 'left' ? selectedLeftId === id : selectedRightId === id

    if (feedback) {
      if (paired) return feedback.isCorrect ? 'correct' : 'incorrect'
      return 'used'
    }
    if (paired) return 'paired'
    if (selected) return 'selected'
    if (locked) return 'used'
    return 'default'
  }

  return (
    <ExerciseFrame
      exerciseId={exercise.id}
      exerciseType={exercise.type}
      instruction="Match each item on the left with its partner on the right."
      prompt={exercise.prompt}
      audioUrl={exercise.audio_url}
      ttsText={exercise.tts_text}
      ttsLang={exercise.tts_lang}
      statusText={statusText}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <ul className="min-w-0 space-y-2" aria-label="Left items">
            {exercise.options.left.map((item) => {
              const pairNumber = pairNumberByLeft.get(item.id)
              return (
                <li key={item.id} className="min-w-0">
                  <MatchTile
                    text={item.text}
                    state={tileState('left', item.id)}
                    disabled={locked}
                    className="break-words"
                    aria-label={
                      pairNumber
                        ? `${item.text}, pair ${pairNumber}. Activate to unpair.`
                        : selectedLeftId === item.id
                          ? `${item.text}, selected left item`
                          : `${item.text}, left item`
                    }
                    onClick={() => onLeftClick(item.id)}
                  />
                  {pairNumber ? (
                    <span className="mt-1 block text-center text-lq-xs font-bold text-lq-text-secondary">
                      Pair {pairNumber}
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ul>

          <ul className="min-w-0 space-y-2" aria-label="Right items">
            {exercise.options.right.map((item) => {
              const pairNumber = pairNumberByRight.get(item.id)
              return (
                <li key={item.id} className="min-w-0">
                  <MatchTile
                    text={item.text}
                    state={tileState('right', item.id)}
                    disabled={locked}
                    className="break-words"
                    aria-label={
                      pairNumber
                        ? `${item.text}, pair ${pairNumber}. Activate to unpair.`
                        : selectedRightId === item.id
                          ? `${item.text}, selected right item`
                          : `${item.text}, right item`
                    }
                    onClick={() => onRightClick(item.id)}
                  />
                  {pairNumber ? (
                    <span className="mt-1 block text-center text-lq-xs font-bold text-lq-text-secondary">
                      Pair {pairNumber}
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="rounded-lq bg-lq-bg-page/70 p-3" aria-label="Established pairs">
          <p className="mb-2 text-lq-xs font-bold uppercase tracking-wide text-lq-text-secondary">
            Your pairs
          </p>
          {pairs.length === 0 ? (
            <p className="text-lq-sm text-lq-text-tertiary">
              Select one left item and one right item to create a pair.
            </p>
          ) : (
            <ol className="list-decimal space-y-1 pl-5 text-lq-sm text-lq-text-primary">
              {pairs.map((pair) => (
                <li key={`${pair.left_id}-${pair.right_id}`}>
                  {leftText.get(pair.left_id) ?? pair.left_id}
                  {' → '}
                  {rightText.get(pair.right_id) ?? pair.right_id}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </ExerciseFrame>
  )
}
