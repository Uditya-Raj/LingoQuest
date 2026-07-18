'use client'

import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

interface CelebrationBurstProps {
  active: boolean
  className?: string
}

/**
 * Original restrained sparkle burst — transform/opacity only, no particle library.
 * Hidden from assistive technology (decorative).
 */
export function CelebrationBurst({ active, className }: CelebrationBurstProps) {
  const reducedMotion = useReducedMotion()

  if (!active) return null

  if (reducedMotion) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 top-6 flex justify-center gap-3 opacity-70',
          className,
        )}
      >
        {['★', '✦', '★'].map((mark, index) => (
          <span
            key={index}
            className="text-lq-lg text-lq-xp"
            style={{ opacity: 0.85 }}
          >
            {mark}
          </span>
        ))}
      </div>
    )
  }

  const sparks = [
    { left: '18%', delay: '0ms', color: 'var(--lq-xp-color)' },
    { left: '32%', delay: '40ms', color: 'var(--lq-primary)' },
    { left: '48%', delay: '80ms', color: 'var(--lq-streak-color)' },
    { left: '64%', delay: '50ms', color: 'var(--lq-crown-color)' },
    { left: '78%', delay: '20ms', color: 'var(--lq-secondary)' },
    { left: '40%', delay: '100ms', color: 'var(--lq-success)' },
    { left: '58%', delay: '70ms', color: 'var(--lq-xp-color)' },
  ]

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-x-0 top-2 h-28 overflow-hidden',
        className,
      )}
    >
      {sparks.map((spark, index) => (
        <span
          key={index}
          className="lq-celebration-spark absolute top-10 h-2.5 w-2.5 rounded-full"
          style={{
            left: spark.left,
            background: spark.color,
            animationDelay: spark.delay,
          }}
        />
      ))}
    </div>
  )
}
