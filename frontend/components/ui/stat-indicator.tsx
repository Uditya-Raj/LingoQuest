'use client'

import { type HTMLAttributes, type ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export type StatIndicatorVariant = 'heart' | 'streak' | 'xp' | 'gem' | 'crown'

interface StatIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  variant: StatIndicatorVariant
  value: number | string
  icon: ReactNode
  label: string
}

const variantStyles: Record<StatIndicatorVariant, { color: string; bg: string }> = {
  heart: { color: 'text-lq-heart', bg: 'bg-lq-heart-bg' },
  streak: { color: 'text-lq-streak', bg: 'bg-lq-streak-bg' },
  xp: { color: 'text-lq-xp', bg: 'bg-lq-xp-bg' },
  gem: { color: 'text-lq-gem', bg: 'bg-lq-primary/10' },
  crown: { color: 'text-lq-crown', bg: 'bg-lq-crown-bg' },
}

export const StatIndicator = forwardRef<HTMLDivElement, StatIndicatorProps>(
  function StatIndicator({ variant, value, icon, label, className, ...props }, ref) {
    const style = variantStyles[variant]
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 sm:gap-1.5',
          'px-1.5 py-1 sm:px-2.5 sm:py-1.5',
          'rounded-lq-full',
          'text-lq-xs sm:text-lq-sm font-bold',
          'min-h-11',
          style.color,
          style.bg,
          className,
        )}
        aria-label={label}
        role="status"
        {...props}
      >
        <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5" aria-hidden="true">
          {icon}
        </span>
        <span className="tabular-nums">{value}</span>
      </div>
    )
  },
)
