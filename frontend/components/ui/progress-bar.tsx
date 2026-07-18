'use client'

import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max: number
  label: string
  variant?: 'success' | 'primary' | 'timed'
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  function ProgressBar(
    { value, max, label, variant = 'success', className, ...props },
    ref,
  ) {
    const clampedValue = Math.max(0, Math.min(value, max))
    const percentage = max > 0 ? (clampedValue / max) * 100 : 0

    const fillColors: Record<string, string> = {
      success: 'bg-lq-success',
      primary: 'bg-lq-primary',
      timed: 'bg-lq-timed',
    }

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className={cn(
          'relative h-4 w-full overflow-hidden',
          'rounded-lq-full',
          'bg-lq-bg-sunken',
          'shadow-lq-inner',
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full rounded-lq-full',
            'transition-[width] duration-[var(--lq-duration-progress)] ease-[var(--lq-ease-out)]',
            fillColors[variant],
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  },
)
