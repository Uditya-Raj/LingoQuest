'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ChoiceTileState = 'default' | 'selected' | 'correct' | 'incorrect' | 'disabled'

interface ChoiceTileProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  state?: ChoiceTileState
  label: string
  shortcut?: string
  children?: ReactNode
}

export const ChoiceTile = forwardRef<HTMLButtonElement, ChoiceTileProps>(
  function ChoiceTile(
    { state = 'default', label, shortcut, disabled, className, children, ...props },
    ref,
  ) {
    const isDisabled = disabled || state === 'disabled'

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={state === 'selected' || state === 'correct'}
        aria-label={label}
        disabled={isDisabled}
        className={cn(
          'relative flex w-full items-center gap-3',
          'min-h-[48px] px-4 py-3',
          'rounded-lq bg-lq-bg-surface',
          'border-2 border-lq-border-default',
          'border-b-[length:var(--lq-depth-md)] border-b-lq-border-strong',
          'shadow-lq-sm',
          'text-lq-base font-semibold text-left',
          'transition-all duration-[var(--lq-duration-press)] ease-[var(--lq-ease-out)]',
          'translate-y-0',
          'hover:translate-y-[-1px] hover:shadow-lq-md hover:border-lq-primary',
          'active:translate-y-[var(--lq-depth-md)] active:border-b-2 active:shadow-none',
          'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-2',
          state === 'selected' && 'border-lq-selected-border bg-lq-selected-bg border-b-lq-primary-depth',
          state === 'correct' && 'border-lq-success bg-lq-success-bg border-b-lq-success-depth',
          state === 'incorrect' && 'border-lq-error bg-lq-error-bg border-b-lq-error-depth animate-[shake_0.3s_var(--lq-ease-shake)]',
          isDisabled && 'opacity-[var(--lq-disabled-opacity)] pointer-events-none border-b-0',
          className,
        )}
        {...props}
      >
        {shortcut && (
          <span
            className={cn(
              'flex h-7 w-7 items-center justify-center',
              'rounded-lq-sm border border-lq-border-strong',
              'text-lq-sm font-bold text-lq-text-secondary',
              state === 'selected' && 'border-lq-primary text-lq-primary',
            )}
            aria-hidden="true"
          >
            {shortcut}
          </span>
        )}
        <span className="flex-1">{children ?? label}</span>
        {state === 'correct' && <Check className="h-5 w-5 text-lq-success shrink-0" aria-hidden="true" />}
        {state === 'incorrect' && <X className="h-5 w-5 text-lq-error shrink-0" aria-hidden="true" />}
      </button>
    )
  },
)
