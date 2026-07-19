'use client'

import type { ReactNode } from 'react'

import { SurfaceCard } from '@/components/ui/surface-card'
import { cn } from '@/lib/utils'

interface ProfileStatCardProps {
  label: string
  value: number | string
  icon: ReactNode
  hint?: string
  className?: string
}

/**
 * Dimensional stat card for backend-provided profile values.
 */
export function ProfileStatCard({
  label,
  value,
  icon,
  hint,
  className,
}: ProfileStatCardProps) {
  return (
    <SurfaceCard className={cn('p-4', className)}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center',
            'rounded-lq bg-lq-bg-sunken text-lq-primary',
            '[&>svg]:h-5 [&>svg]:w-5',
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <dt className="text-lq-xs font-bold uppercase tracking-wide text-lq-text-secondary">
            {label}
          </dt>
          <dd
            className="mt-1 break-words text-lq-2xl font-extrabold tabular-nums text-lq-text-primary"
            title={String(value)}
          >
            {value}
          </dd>
          {hint ? (
            <p className="mt-0.5 text-lq-xs text-lq-text-secondary">{hint}</p>
          ) : null}
        </div>
      </div>
    </SurfaceCard>
  )
}
