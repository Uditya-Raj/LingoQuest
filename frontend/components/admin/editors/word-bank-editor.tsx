'use client'

import { Button3D } from '@/components/ui/button-3d'
import { createOptionId } from '@/lib/admin/option-id'
import type { ExerciseOptionItem } from '@/lib/contracts/exercises'
import { cn } from '@/lib/utils'

interface WordBankEditorProps {
  options: ExerciseOptionItem[]
  orderedIds: string[]
  onChange: (next: {
    options: ExerciseOptionItem[]
    correct_answer: { ordered_ids: string[] }
  }) => void
  className?: string
}

export function WordBankEditor({
  options,
  orderedIds,
  onChange,
  className,
}: WordBankEditorProps) {
  const optionIds = new Set(options.map((o) => o.id))

  const updateText = (index: number, text: string) => {
    const next = options.map((opt, i) =>
      i === index ? { ...opt, text } : opt,
    )
    onChange({
      options: next,
      correct_answer: { ordered_ids: orderedIds },
    })
  }

  const removeTile = (index: number) => {
    const removed = options[index]
    const next = options.filter((_, i) => i !== index)
    const nextOrdered = removed
      ? orderedIds.filter((id) => id !== removed.id)
      : orderedIds
    onChange({
      options: next,
      correct_answer: { ordered_ids: nextOrdered },
    })
  }

  const addTile = () => {
    onChange({
      options: [...options, { id: createOptionId('wb'), text: '' }],
      correct_answer: { ordered_ids: orderedIds },
    })
  }

  const addToSequence = (id: string) => {
    if (orderedIds.includes(id)) return
    onChange({
      options,
      correct_answer: { ordered_ids: [...orderedIds, id] },
    })
  }

  const removeFromSequence = (index: number) => {
    onChange({
      options,
      correct_answer: {
        ordered_ids: orderedIds.filter((_, i) => i !== index),
      },
    })
  }

  const moveSequence = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= orderedIds.length) return
    const next = [...orderedIds]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    onChange({ options, correct_answer: { ordered_ids: next } })
  }

  return (
    <div className={cn('space-y-4', className)}>
      <fieldset className="space-y-3 rounded-lq border-2 border-dashed border-lq-border-default p-4">
        <legend className="px-1 text-lq-sm font-extrabold">
          Available tiles{' '}
          <span className="font-bold text-lq-text-secondary">
            (administrator only)
          </span>
        </legend>
        <ul className="space-y-3" aria-label="Word bank tiles">
          {options.map((opt, index) => (
            <li
              key={opt.id}
              className="space-y-2 rounded-lq bg-lq-bg-sunken/60 p-3"
            >
              <span className="text-lq-xs font-bold text-lq-text-secondary">
                ID: {opt.id}
              </span>
              <label
                htmlFor={`admin-field-wb-${index}-text`}
                className="sr-only"
              >
                Tile {index + 1} text
              </label>
              <input
                id={`admin-field-wb-${index}-text`}
                type="text"
                value={opt.text}
                onChange={(e) => updateText(index, e.target.value)}
                className="min-h-11 w-full rounded-lq border-2 border-lq-border-default bg-lq-bg-surface px-3 text-lq-sm"
              />
              <div className="flex flex-wrap gap-2">
                <Button3D
                  type="button"
                  size="sm"
                  variant="secondary"
                  aria-label={`Add tile ${index + 1} to correct sequence`}
                  disabled={orderedIds.includes(opt.id)}
                  onClick={() => addToSequence(opt.id)}
                >
                  Add to sequence
                </Button3D>
                <Button3D
                  type="button"
                  size="sm"
                  variant="danger"
                  aria-label={`Remove tile ${index + 1}`}
                  disabled={options.length <= 2}
                  onClick={() => removeTile(index)}
                >
                  Remove tile
                </Button3D>
              </div>
            </li>
          ))}
        </ul>
        <Button3D type="button" size="sm" variant="secondary" onClick={addTile}>
          Add tile
        </Button3D>
      </fieldset>

      <fieldset className="space-y-3 rounded-lq border-2 border-lq-primary/40 p-4">
        <legend className="px-1 text-lq-sm font-extrabold">
          Correct sequence
        </legend>
        <p className="text-lq-xs text-lq-text-secondary">
          Distractor tiles stay in Available tiles but are omitted here.
        </p>
        {orderedIds.length === 0 ? (
          <p className="text-lq-sm text-lq-error">Sequence is empty.</p>
        ) : (
          <ol className="space-y-2" aria-label="Correct ordered IDs">
            {orderedIds.map((id, index) => {
              const tile = options.find((o) => o.id === id)
              const dangling = !optionIds.has(id)
              return (
                <li
                  key={`${id}-${index}`}
                  className="flex flex-wrap items-center gap-2 rounded-lq bg-lq-bg-sunken/60 p-2"
                >
                  <span className="min-w-0 flex-1 text-lq-sm font-bold">
                    {index + 1}. {tile?.text || id}
                    {dangling ? (
                      <span className="ml-2 text-lq-error"> (missing tile)</span>
                    ) : null}
                  </span>
                  <Button3D
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Move sequence item ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => moveSequence(index, -1)}
                  >
                    Up
                  </Button3D>
                  <Button3D
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Move sequence item ${index + 1} down`}
                    disabled={index === orderedIds.length - 1}
                    onClick={() => moveSequence(index, 1)}
                  >
                    Down
                  </Button3D>
                  <Button3D
                    type="button"
                    size="sm"
                    variant="danger"
                    aria-label={`Remove sequence item ${index + 1}`}
                    onClick={() => removeFromSequence(index)}
                  >
                    Remove
                  </Button3D>
                </li>
              )
            })}
          </ol>
        )}
      </fieldset>
    </div>
  )
}
