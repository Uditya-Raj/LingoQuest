'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type WordTileState = 'available' | 'placed' | 'correct' | 'incorrect' | 'disabled'

interface WordTileProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  state?: WordTileState
  word: string
}

export const WordTile = forwardRef<HTMLButtonElement, WordTileProps>(
  function WordTile(
    { state = 'available', word, disabled, className, ...props },
    ref,
  ) {
    const isDisabled = disabled || state === 'disabled'

    return (
      <button
        ref={ref}
        type="button"
        aria-label={`${word}, ${state}`}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center',
          'min-h-[40px] px-3 py-1.5',
          'rounded-lq-sm bg-lq-bg-surface',
          'border-2 border-lq-border-default',
          'border-b-[length:var(--lq-depth-sm)] border-b-lq-border-strong',
          'shadow-lq-sm',
          'text-lq-sm font-semibold select-none whitespace-nowrap',
          'transition-all duration-[var(--lq-duration-press)] ease-[var(--lq-ease-out)]',
          'translate-y-0',
          'hover:translate-y-[-1px] hover:shadow-lq-md',
          'active:translate-y-[var(--lq-depth-sm)] active:border-b-2 active:shadow-none',
          'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-2',
          state === 'placed' && 'bg-lq-selected-bg border-lq-selected-border border-b-lq-primary-depth',
          state === 'correct' && 'bg-lq-success-bg border-lq-success border-b-lq-success-depth',
          state === 'incorrect' && 'bg-lq-error-bg border-lq-error border-b-lq-error-depth',
          isDisabled && 'opacity-[var(--lq-disabled-opacity)] pointer-events-none border-b-0',
          className,
        )}
        {...props}
      >
        {word}
      </button>
    )
  },
)
