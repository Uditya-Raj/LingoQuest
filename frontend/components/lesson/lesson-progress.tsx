'use client'

import { ProgressBar } from '@/components/ui/progress-bar'

interface LessonProgressProps {
  current: number
  total: number
  mode: 'standard' | 'timed'
}

export function LessonProgress({ current, total, mode }: LessonProgressProps) {
  const safeTotal = Math.max(total, 1)
  const safeCurrent = Math.max(0, Math.min(current, safeTotal))
  const label = `Exercise ${safeCurrent} of ${safeTotal}`

  return (
    <div className="min-w-0 flex-1">
      <p className="sr-only">{label}</p>
      <ProgressBar
        value={safeCurrent}
        max={safeTotal}
        label={label}
        variant={mode === 'timed' ? 'timed' : 'success'}
        aria-hidden={false}
      />
    </div>
  )
}
