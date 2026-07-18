'use client'

import { Heart } from 'lucide-react'

import { cn } from '@/lib/utils'

interface LessonHeartsProps {
  hearts: number
  maxHearts: number
  mode: 'standard' | 'timed'
  className?: string
}

export function LessonHearts({
  hearts,
  maxHearts,
  mode,
  className,
}: LessonHeartsProps) {
  const safeHearts = Math.max(0, hearts)
  const safeMax = Math.max(0, maxHearts)
  const label =
    mode === 'timed'
      ? `${safeHearts} of ${safeMax} hearts (timed practice)`
      : `${safeHearts} of ${safeMax} hearts`

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      <ul className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: safeMax }, (_, index) => {
          const filled = index < safeHearts
          return (
            <li key={index}>
              <Heart
                className={cn(
                  'h-5 w-5 sm:h-6 sm:w-6',
                  filled
                    ? 'fill-lq-heart text-lq-heart'
                    : 'fill-transparent text-lq-border-strong',
                )}
                strokeWidth={2}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
