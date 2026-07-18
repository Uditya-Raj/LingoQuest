'use client'

import { type HTMLAttributes, type ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export type StatusBadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'locked'

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: StatusBadgeVariant
  children: ReactNode
}

const variantStyles: Record<StatusBadgeVariant, string> = {
  default: 'bg-lq-bg-sunken text-lq-text-primary border-lq-border-default',
  success: 'bg-lq-success-bg text-lq-text-success border-lq-success',
  error: 'bg-lq-error-bg text-lq-text-error border-lq-error',
  warning: 'bg-lq-xp-bg text-lq-text-primary border-lq-warning',
  info: 'bg-lq-selected-bg text-lq-primary border-lq-primary',
  locked: 'bg-lq-locked-bg text-lq-locked-text border-lq-locked-border',
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  function StatusBadge({ variant = 'default', className, children, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1',
          'px-2.5 py-0.5',
          'rounded-lq-full',
          'border',
          'text-lq-xs font-bold uppercase tracking-wide',
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        {children}
      </span>
    )
  },
)
