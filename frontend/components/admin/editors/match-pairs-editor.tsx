'use client'

import { Button3D } from '@/components/ui/button-3d'
import { createOptionId } from '@/lib/admin/option-id'
import type {
  ExerciseOptionItem,
  MatchPair,
  MatchPairsOptions,
} from '@/lib/contracts/exercises'
import { cn } from '@/lib/utils'

interface MatchPairsEditorProps {
  options: MatchPairsOptions
  pairs: MatchPair[]
  onChange: (next: {
    options: MatchPairsOptions
    correct_answer: { pairs: MatchPair[] }
  }) => void
  className?: string
}

function syncPairs(
  left: ExerciseOptionItem[],
  right: ExerciseOptionItem[],
  pairs: MatchPair[],
): MatchPair[] {
  const leftIds = new Set(left.map((o) => o.id))
  const rightIds = new Set(right.map((o) => o.id))
  const kept = pairs.filter(
    (p) => leftIds.has(p.left_id) && rightIds.has(p.right_id),
  )
  const usedLeft = new Set(kept.map((p) => p.left_id))
  const usedRight = new Set(kept.map((p) => p.right_id))
  const next = [...kept]
  for (const leftItem of left) {
    if (usedLeft.has(leftItem.id)) continue
    const freeRight = right.find((r) => !usedRight.has(r.id))
    if (!freeRight) break
    next.push({ left_id: leftItem.id, right_id: freeRight.id })
    usedLeft.add(leftItem.id)
    usedRight.add(freeRight.id)
  }
  return next
}

export function MatchPairsEditor({
  options,
  pairs,
  onChange,
  className,
}: MatchPairsEditorProps) {
  const updateSide = (
    side: 'left' | 'right',
    index: number,
    text: string,
  ) => {
    const nextSide = options[side].map((opt, i) =>
      i === index ? { ...opt, text } : opt,
    )
    const nextOptions = { ...options, [side]: nextSide }
    onChange({
      options: nextOptions,
      correct_answer: { pairs },
    })
  }

  const removeSide = (side: 'left' | 'right', index: number) => {
    const removed = options[side][index]
    const nextSide = options[side].filter((_, i) => i !== index)
    const nextOptions = { ...options, [side]: nextSide }
    const nextPairs = removed
      ? pairs.filter((p) =>
          side === 'left'
            ? p.left_id !== removed.id
            : p.right_id !== removed.id,
        )
      : pairs
    onChange({
      options: nextOptions,
      correct_answer: {
        pairs: syncPairs(nextOptions.left, nextOptions.right, nextPairs),
      },
    })
  }

  const addSide = (side: 'left' | 'right') => {
    const nextSide = [
      ...options[side],
      { id: createOptionId(side), text: '' },
    ]
    const nextOptions = { ...options, [side]: nextSide }
    onChange({
      options: nextOptions,
      correct_answer: {
        pairs: syncPairs(nextOptions.left, nextOptions.right, pairs),
      },
    })
  }

  const setPairRight = (leftId: string, rightId: string) => {
    const withoutLeft = pairs.filter((p) => p.left_id !== leftId)
    const withoutRight = withoutLeft.filter((p) => p.right_id !== rightId)
    const next = [...withoutRight, { left_id: leftId, right_id: rightId }]
    onChange({ options, correct_answer: { pairs: next } })
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid gap-4 md:grid-cols-2">
        {(['left', 'right'] as const).map((side) => (
          <fieldset
            key={side}
            className="space-y-3 rounded-lq border-2 border-dashed border-lq-border-default p-4"
          >
            <legend className="px-1 text-lq-sm font-extrabold capitalize">
              {side} items{' '}
              <span className="font-bold text-lq-text-secondary">
                (admin only)
              </span>
            </legend>
            <ul className="space-y-3" aria-label={`${side} match items`}>
              {options[side].map((opt, index) => (
                <li
                  key={opt.id}
                  className="space-y-2 rounded-lq bg-lq-bg-sunken/60 p-3"
                >
                  <span className="text-lq-xs font-bold text-lq-text-secondary">
                    ID: {opt.id}
                  </span>
                  <label
                    htmlFor={`admin-field-${side}-${index}-text`}
                    className="sr-only"
                  >
                    {side} item {index + 1} text
                  </label>
                  <input
                    id={`admin-field-${side}-${index}-text`}
                    type="text"
                    value={opt.text}
                    onChange={(e) => updateSide(side, index, e.target.value)}
                    className="min-h-11 w-full rounded-lq border-2 border-lq-border-default bg-lq-bg-surface px-3 text-lq-sm"
                  />
                  <Button3D
                    type="button"
                    size="sm"
                    variant="danger"
                    aria-label={`Remove ${side} item ${index + 1}`}
                    disabled={options[side].length <= 2}
                    onClick={() => removeSide(side, index)}
                  >
                    Remove
                  </Button3D>
                </li>
              ))}
            </ul>
            <Button3D
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => addSide(side)}
            >
              Add {side} item
            </Button3D>
          </fieldset>
        ))}
      </div>

      <fieldset className="space-y-3 rounded-lq border-2 border-lq-primary/40 p-4">
        <legend className="px-1 text-lq-sm font-extrabold">
          Correct pairs
        </legend>
        <p className="text-lq-xs text-lq-text-secondary">
          Pair each left item using the keyboard-accessible select. No
          pointer-only drawing.
        </p>
        <ul className="space-y-3" aria-label="Correct match pairs">
          {options.left.map((left, index) => {
            const current = pairs.find((p) => p.left_id === left.id)
            return (
              <li
                key={left.id}
                className="flex flex-col gap-2 rounded-lq bg-lq-bg-sunken/60 p-3 sm:flex-row sm:items-center"
              >
                <span className="min-w-0 flex-1 text-lq-sm font-bold">
                  {left.text || left.id}
                </span>
                <label
                  htmlFor={`admin-field-pairs-${index}`}
                  className="sr-only"
                >
                  Pair right item for {left.text || left.id}
                </label>
                <select
                  id={`admin-field-pairs-${index}`}
                  value={current?.right_id ?? ''}
                  onChange={(e) => setPairRight(left.id, e.target.value)}
                  className="min-h-11 min-w-[10rem] flex-1 rounded-lq border-2 border-lq-border-default bg-lq-bg-surface px-3 text-lq-sm"
                >
                  <option value="">Select right item…</option>
                  {options.right.map((right) => (
                    <option key={right.id} value={right.id}>
                      {right.text || right.id}
                    </option>
                  ))}
                </select>
              </li>
            )
          })}
        </ul>
      </fieldset>
    </div>
  )
}
