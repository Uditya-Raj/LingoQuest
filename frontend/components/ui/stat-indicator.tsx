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

const variantColors: Record<StatIndicatorVariant, string> = {
  heart: 'text-lq-heart',
  streak: 'text-lq-streak',
  xp: 'text-lq-xp',
  gem: 'text-lq-gem',
  crown: 'text-lq-crown',
}

export const StatIndicator = forwardRef<HTMLDivElement, StatIndicatorProps>(
  function StatIndicator({ variant, value, icon, label, className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5',
          'px-2.5 py-1',
          'rounded-lq-full',
          'text-lq-sm font-bold',
          variantColors[variant],
          className,
        )}
        aria-label={label}
        role="status"
        {...props}
      >
        <span className="shrink-0 [&>svg]:h-5 [&>svg]:w-5" aria-hidden="true">
          {icon}
        </span>
        <span>{value}</span>
      </div>
    )
  },
)
