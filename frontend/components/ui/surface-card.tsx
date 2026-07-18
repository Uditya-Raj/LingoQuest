'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type SurfaceCardVariant = 'default' | 'elevated' | 'interactive'

interface SurfaceCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceCardVariant
  children: ReactNode
}

export const SurfaceCard = forwardRef<HTMLDivElement, SurfaceCardProps>(
  function SurfaceCard({ variant = 'default', className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lq-lg bg-lq-bg-surface',
          'border-2 border-lq-border-default',
          'border-b-[length:var(--lq-depth-md)] border-b-lq-border-strong',
          'shadow-lq-md',
          variant === 'elevated' && 'bg-lq-bg-elevated border-b-[length:var(--lq-depth-lg)] shadow-lq-lg',
          variant === 'interactive' && [
            'cursor-pointer select-none',
            'transition-all duration-[var(--lq-duration-hover)] ease-[var(--lq-ease-out)]',
            'translate-y-0',
            'hover:translate-y-[-1px] hover:shadow-lq-lg',
            'active:translate-y-[var(--lq-depth-md)] active:border-b-2 active:shadow-lq-sm',
          ],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)
