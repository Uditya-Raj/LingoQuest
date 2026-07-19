'use client'

import { Button3D } from '@/components/ui/button-3d'
import { cn } from '@/lib/utils'

interface TypeAnswerEditorProps {
  accepted: string[]
  onChange: (accepted: string[]) => void
  className?: string
}

export function TypeAnswerEditor({
  accepted,
  onChange,
  className,
}: TypeAnswerEditorProps) {
  const update = (index: number, value: string) => {
    onChange(accepted.map((item, i) => (i === index ? value : item)))
  }

  const remove = (index: number) => {
    if (accepted.length <= 1) {
      onChange([''])
      return
    }
    onChange(accepted.filter((_, i) => i !== index))
  }

  return (
    <fieldset
      className={cn(
        'space-y-3 rounded-lq border-2 border-dashed border-lq-border-default p-4',
        className,
      )}
    >
      <legend className="px-1 text-lq-sm font-extrabold">
        Accepted answers{' '}
        <span className="font-bold text-lq-text-secondary">
          (administrator only)
        </span>
      </legend>
      <p className="text-lq-xs text-lq-text-secondary">
        Accents are preserved. Values are not grading-normalized before save.
      </p>
      <ul className="space-y-3" aria-label="Accepted answers">
        {accepted.map((value, index) => (
          <li
            key={`accepted-${index}`}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <label
              htmlFor={`admin-field-accepted-${index}`}
              className="sr-only"
            >
              Accepted answer {index + 1}
            </label>
            <input
              id={`admin-field-accepted-${index}`}
              type="text"
              value={value}
              onChange={(e) => update(index, e.target.value)}
              className="min-h-11 w-full flex-1 rounded-lq border-2 border-lq-border-default bg-lq-bg-surface px-3 text-lq-sm"
              autoComplete="off"
            />
            <Button3D
              type="button"
              size="sm"
              variant="danger"
              aria-label={`Remove accepted answer ${index + 1}`}
              onClick={() => remove(index)}
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
        onClick={() => onChange([...accepted, ''])}
      >
        Add accepted answer
      </Button3D>
    </fieldset>
  )
}
