'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type MatchTileState = 'default' | 'selected' | 'paired' | 'correct' | 'incorrect' | 'used'

interface MatchTileProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  state?: MatchTileState
  text: string
}

export const MatchTile = forwardRef<HTMLButtonElement, MatchTileProps>(
  function MatchTile(
    { state = 'default', text, disabled, className, ...props },
    ref,
  ) {
    const isDisabled = disabled || state === 'used'

    return (
      <button
        ref={ref}
        type="button"
        aria-label={`${text}, ${state === 'used' ? 'matched' : state}`}
        aria-pressed={state === 'selected' || state === 'paired'}
        disabled={isDisabled}
        className={cn(
          'flex items-center justify-center',
          'min-h-[44px] w-full px-3 py-2',
          'rounded-lq-sm bg-lq-bg-surface',
          'border-2 border-lq-border-default',
          'border-b-[length:var(--lq-depth-sm)] border-b-lq-border-strong',
          'shadow-lq-sm',
          'text-lq-sm font-semibold select-none text-center',
          'transition-all duration-[var(--lq-duration-press)] ease-[var(--lq-ease-out)]',
          'translate-y-0',
          'hover:translate-y-[-1px] hover:shadow-lq-md',
          'active:translate-y-[var(--lq-depth-sm)] active:border-b-2 active:shadow-none',
          'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-2',
          state === 'selected' && 'border-lq-selected-border bg-lq-selected-bg border-b-lq-primary-depth',
          state === 'paired' && 'border-lq-primary bg-lq-selected-bg border-b-lq-primary-depth',
          state === 'correct' && 'border-lq-success bg-lq-success-bg border-b-lq-success-depth',
          state === 'incorrect' && 'border-lq-error bg-lq-error-bg border-b-lq-error-depth animate-[shake_0.3s_var(--lq-ease-shake)]',
          state === 'used' && 'opacity-30 pointer-events-none border-b-0',
          className,
        )}
        {...props}
      >
        {text}
      </button>
    )
  },
)
