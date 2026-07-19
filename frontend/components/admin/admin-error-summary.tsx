'use client'

import { useEffect, useRef } from 'react'

import type { FieldError } from '@/lib/admin/exercise-validation'
import { cn } from '@/lib/utils'

interface AdminErrorSummaryProps {
  title?: string
  errors: FieldError[]
  apiMessage?: string | null
  focusOnMount?: boolean
  className?: string
}

/**
 * Accessible form-level error summary for content-admin editors.
 */
export function AdminErrorSummary({
  title = 'Please fix the following',
  errors,
  apiMessage,
  focusOnMount = false,
  className,
}: AdminErrorSummaryProps) {
  const ref = useRef<HTMLDivElement>(null)
  const hasContent = errors.length > 0 || Boolean(apiMessage)

  useEffect(() => {
    if (focusOnMount && hasContent) {
      ref.current?.focus()
    }
  }, [focusOnMount, hasContent, errors, apiMessage])

  if (!hasContent) return null

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-labelledby="admin-error-summary-title"
      className={cn(
        'rounded-lq border-2 border-lq-error bg-lq-error/10 p-4 outline-none',
        'focus-visible:ring-2 focus-visible:ring-lq-focus focus-visible:ring-offset-2',
        className,
      )}
    >
      <h2
        id="admin-error-summary-title"
        className="text-lq-sm font-extrabold text-lq-error"
      >
        {title}
      </h2>
      {apiMessage ? (
        <p className="mt-2 text-lq-sm text-lq-text-primary">{apiMessage}</p>
      ) : null}
      {errors.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-lq-sm">
          {errors.map((error) => (
            <li key={`${error.field}:${error.message}`}>
              <a
                href={`#admin-field-${error.field.replace(/\./g, '-')}`}
                className="font-bold text-lq-text-primary underline underline-offset-2"
              >
                {error.message}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
