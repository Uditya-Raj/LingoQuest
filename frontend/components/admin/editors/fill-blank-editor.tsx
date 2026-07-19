'use client'

import { cn } from '@/lib/utils'

interface FillBlankEditorProps {
  prompt: string
  answerText: string
  onPromptChange: (prompt: string) => void
  onAnswerChange: (text: string) => void
  className?: string
}

/**
 * Fill-blank admin editor. Preview is plain text — never unsafe HTML.
 */
export function FillBlankEditor({
  prompt,
  answerText,
  onPromptChange,
  onAnswerChange,
  className,
}: FillBlankEditorProps) {
  const blankCount = (prompt.match(/___/g) ?? []).length
  const previewParts = prompt.split('___')

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-1">
        <label htmlFor="admin-field-prompt" className="text-lq-sm font-bold">
          Prompt (exactly one ___ blank)
        </label>
        <textarea
          id="admin-field-prompt"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={3}
          className="w-full rounded-lq border-2 border-lq-border-default bg-lq-bg-surface px-3 py-2 text-lq-sm"
        />
        <p
          className={cn(
            'text-lq-xs',
            blankCount === 1 ? 'text-lq-text-secondary' : 'text-lq-error',
          )}
          role="status"
        >
          Blank markers found: {blankCount} (required: 1)
        </p>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="admin-field-correct_answer"
          className="text-lq-sm font-bold"
        >
          Correct answer text{' '}
          <span className="text-lq-text-secondary">(administrator only)</span>
        </label>
        <input
          id="admin-field-correct_answer"
          type="text"
          value={answerText}
          onChange={(e) => onAnswerChange(e.target.value)}
          className="min-h-11 w-full rounded-lq border-2 border-lq-border-default bg-lq-bg-surface px-3 text-lq-sm"
          autoComplete="off"
        />
        <p className="text-lq-xs text-lq-text-secondary">
          Accents and case are preserved exactly. Grading normalization is not
          applied here.
        </p>
      </div>

      <div
        className="rounded-lq bg-lq-bg-sunken/60 p-3 text-lq-sm"
        aria-label="Learner-style preview"
      >
        <p className="mb-1 text-lq-xs font-bold uppercase tracking-wide text-lq-text-secondary">
          Preview
        </p>
        <p>
          {previewParts.map((part, index) => (
            <span key={`part-${index}`}>
              {part}
              {index < previewParts.length - 1 ? (
                <span className="mx-1 inline-block min-w-[3rem] border-b-2 border-lq-text-primary font-bold">
                  {answerText || '___'}
                </span>
              ) : null}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}
