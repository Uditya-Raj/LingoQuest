'use client'

import { Button3D } from '@/components/ui/button-3d'
import { createOptionId } from '@/lib/admin/option-id'
import type { ExerciseOptionItem } from '@/lib/contracts/exercises'
import { cn } from '@/lib/utils'

interface MultipleChoiceEditorProps {
  options: ExerciseOptionItem[]
  correctOptionId: string
  onChange: (next: {
    options: ExerciseOptionItem[]
    correct_answer: { option_id: string }
  }) => void
  className?: string
}

export function MultipleChoiceEditor({
  options,
  correctOptionId,
  onChange,
  className,
}: MultipleChoiceEditorProps) {
  const updateOption = (index: number, text: string) => {
    const next = options.map((opt, i) =>
      i === index ? { ...opt, text } : opt,
    )
    onChange({ options: next, correct_answer: { option_id: correctOptionId } })
  }

  const removeOption = (index: number) => {
    const removed = options[index]
    const next = options.filter((_, i) => i !== index)
    const nextCorrect =
      removed && removed.id === correctOptionId ? '' : correctOptionId
    onChange({
      options: next,
      correct_answer: { option_id: nextCorrect },
    })
  }

  const moveOption = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= options.length) return
    const next = [...options]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    onChange({ options: next, correct_answer: { option_id: correctOptionId } })
  }

  const addOption = () => {
    const next = [...options, { id: createOptionId('mc'), text: '' }]
    onChange({ options: next, correct_answer: { option_id: correctOptionId } })
  }

  return (
    <fieldset
      className={cn(
        'space-y-3 rounded-lq border-2 border-dashed border-lq-border-default p-4',
        className,
      )}
    >
      <legend className="px-1 text-lq-sm font-extrabold">
        Multiple choice options{' '}
        <span className="font-bold text-lq-text-secondary">
          (administrator only)
        </span>
      </legend>

      <ul className="space-y-3" aria-label="Multiple choice options">
        {options.map((opt, index) => (
          <li
            key={opt.id}
            className="space-y-2 rounded-lq bg-lq-bg-sunken/60 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lq-xs font-bold text-lq-text-secondary">
                ID: {opt.id}
              </span>
              <label className="flex min-h-11 items-center gap-2 text-lq-sm font-bold">
                <input
                  type="radio"
                  name="mc-correct"
                  checked={correctOptionId === opt.id}
                  onChange={() =>
                    onChange({
                      options,
                      correct_answer: { option_id: opt.id },
                    })
                  }
                  className="h-4 w-4"
                />
                Correct answer
              </label>
            </div>
            <label
              htmlFor={`admin-field-options-${index}-text`}
              className="sr-only"
            >
              Option {index + 1} text
            </label>
            <input
              id={`admin-field-options-${index}-text`}
              type="text"
              value={opt.text}
              onChange={(e) => updateOption(index, e.target.value)}
              className="min-h-11 w-full rounded-lq border-2 border-lq-border-default bg-lq-bg-surface px-3 text-lq-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Button3D
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Move option ${index + 1} up`}
                disabled={index === 0}
                onClick={() => moveOption(index, -1)}
              >
                Up
              </Button3D>
              <Button3D
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Move option ${index + 1} down`}
                disabled={index === options.length - 1}
                onClick={() => moveOption(index, 1)}
              >
                Down
              </Button3D>
              <Button3D
                type="button"
                size="sm"
                variant="danger"
                aria-label={`Remove option ${index + 1}`}
                disabled={options.length <= 2}
                onClick={() => removeOption(index)}
              >
                Remove
              </Button3D>
            </div>
          </li>
        ))}
      </ul>

      <Button3D type="button" size="sm" variant="secondary" onClick={addOption}>
        Add option
      </Button3D>

      {correctOptionId ? (
        <p className="text-lq-xs text-lq-text-secondary" role="status">
          Admin preview — correct option ID:{' '}
          <strong>{correctOptionId}</strong>
          {options.find((o) => o.id === correctOptionId)?.text
            ? ` (“${options.find((o) => o.id === correctOptionId)?.text}”)`
            : ''}
        </p>
      ) : (
        <p className="text-lq-xs text-lq-error" role="status">
          No correct option selected.
        </p>
      )}
    </fieldset>
  )
}
