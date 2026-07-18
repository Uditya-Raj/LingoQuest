'use client'

import { AlertTriangle, Clock, Loader2 } from 'lucide-react'

import type { TimedClockPhase } from '@/lib/lesson/timed-clock'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

interface TimedCountdownProps {
  phase: TimedClockPhase
  displayLabel: string
  accessibleLabel: string
  announcement: string | null
  className?: string
}

export function TimedCountdown({
  phase,
  displayLabel,
  accessibleLabel,
  announcement,
  className,
}: TimedCountdownProps) {
  const reducedMotion = useReducedMotion()
  const inactive = phase === 'inactive'
  const checking = phase === 'checking_expiry'
  const expired = phase === 'backend_expired'
  const warning = phase === 'warning'
  const critical = phase === 'critical'

  const Icon = checking ? Loader2 : critical || expired ? AlertTriangle : Clock

  return (
    <div className={cn('flex flex-col items-end gap-0.5', className)}>
      <div
        role="timer"
        aria-live="off"
        aria-atomic="true"
        aria-label={accessibleLabel}
        className={cn(
          'inline-flex min-h-11 min-w-[5.5rem] items-center justify-center gap-1.5 rounded-lq-lg px-2.5',
          'border-2 border-b-[length:var(--lq-depth-md)] font-extrabold tabular-nums',
          'text-lq-lg leading-none sm:text-lq-xl',
          inactive &&
            'border-lq-border-default border-b-lq-border-strong bg-lq-bg-sunken text-lq-text-secondary',
          phase === 'normal' &&
            'border-lq-timed border-b-lq-secondary-depth bg-lq-timed/10 text-lq-timed',
          warning &&
            'border-lq-timed-warning border-b-lq-warning-depth bg-lq-xp-bg text-lq-text-primary',
          critical &&
            'border-lq-timed-critical border-b-lq-error-depth bg-lq-error-bg text-lq-text-error',
          checking &&
            'border-lq-border-strong border-b-lq-border-strong bg-lq-bg-sunken text-lq-text-primary',
          expired &&
            'border-lq-timed-critical border-b-lq-error-depth bg-lq-error-bg text-lq-text-error',
          critical &&
            !reducedMotion &&
            'motion-safe:animate-[lq-timed-critical_1s_ease-in-out_infinite]',
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4 shrink-0 sm:h-5 sm:w-5',
            checking && !reducedMotion && 'animate-spin',
          )}
          aria-hidden="true"
        />
        <span className="inline-block w-[3.25ch] text-center tracking-tight">
          {checking ? '…' : displayLabel}
        </span>
      </div>
      {(warning || critical) && !checking && !expired ? (
        <span className="text-[10px] font-extrabold uppercase tracking-wide text-lq-text-secondary">
          {critical ? 'Hurry!' : 'Almost up'}
        </span>
      ) : null}
      {checking ? (
        <span className="text-[10px] font-extrabold uppercase tracking-wide text-lq-text-secondary">
          Checking…
        </span>
      ) : null}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement ?? ''}
      </span>
    </div>
  )
}
