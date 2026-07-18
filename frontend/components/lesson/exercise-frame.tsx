'use client'

import { useEffect, useRef, type ReactNode } from 'react'

import { SurfaceCard } from '@/components/ui/surface-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { exerciseTypeLabel } from '@/lib/lesson/format-solution'
import type { ExerciseType } from '@/lib/contracts/exercises'
import { cn } from '@/lib/utils'

export interface ExerciseFrameProps {
  exerciseId: number
  exerciseType: ExerciseType
  instruction: string
  prompt: string
  /** Reserved composition slot for Phase 10D AudioControl — never a dead button. */
  audioSlot?: ReactNode
  statusText?: string
  children: ReactNode
  className?: string
}

/**
 * Shared presentation frame for lesson exercises.
 * Prompt is the visual focus; TTS fields stay available for a later audio control.
 */
export function ExerciseFrame({
  exerciseId,
  exerciseType,
  instruction,
  prompt,
  audioSlot,
  statusText,
  children,
  className,
}: ExerciseFrameProps) {
  const promptRef = useRef<HTMLHeadingElement>(null)
  const previousIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (previousIdRef.current === exerciseId) return
    previousIdRef.current = exerciseId
    promptRef.current?.focus({ preventScroll: true })
  }, [exerciseId])

  return (
    <SurfaceCard
      className={cn('space-y-4 p-5 sm:p-6', className)}
      aria-labelledby={`exercise-prompt-${exerciseId}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge variant="info">{exerciseTypeLabel(exerciseType)}</StatusBadge>
      </div>

      <p
        id={`exercise-instruction-${exerciseId}`}
        className="text-lq-sm font-bold text-lq-text-secondary"
      >
        {instruction}
      </p>

      {audioSlot ? (
        <div className="flex items-start gap-2" data-tts-slot>
          {audioSlot}
        </div>
      ) : null}

      <h2
        ref={promptRef}
        id={`exercise-prompt-${exerciseId}`}
        tabIndex={-1}
        className="text-lq-xl font-extrabold leading-snug text-lq-text-primary break-words outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lq-border-focus"
      >
        {prompt}
      </h2>

      {statusText ? (
        <p className="sr-only" aria-live="polite">
          {statusText}
        </p>
      ) : null}

      <div className="min-w-0">{children}</div>
    </SurfaceCard>
  )
}

export function ExerciseErrorFrame({
  exerciseId,
  exerciseType,
  message,
}: {
  exerciseId: number
  exerciseType?: string
  message: string
}) {
  return (
    <SurfaceCard
      className="space-y-3 p-5 sm:p-6"
      role="alert"
      aria-labelledby={`exercise-error-${exerciseId}`}
    >
      <h2
        id={`exercise-error-${exerciseId}`}
        className="text-lq-lg font-extrabold text-lq-text-error"
      >
        This exercise could not be shown
      </h2>
      <p className="text-lq-sm text-lq-text-secondary break-words">{message}</p>
      {process.env.NODE_ENV !== 'production' && exerciseType ? (
        <p className="text-lq-xs text-lq-text-tertiary">
          Dev: exercise {exerciseId} ({exerciseType})
        </p>
      ) : null}
    </SurfaceCard>
  )
}
