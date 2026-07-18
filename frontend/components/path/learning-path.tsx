'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button3D } from '@/components/ui/button-3d'
import { QuestMascot } from '@/components/ui/quest-mascot'
import { Skeleton } from '@/components/ui/skeleton'
import { UnitSection } from '@/components/path/unit-section'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import type { CourseResponse } from '@/lib/contracts/course'
import type { SkillSummary } from '@/lib/contracts/course'
import { findCurrentSkill } from '@/lib/path/current-skill'
import { cn } from '@/lib/utils'

interface LearningPathProps {
  course: CourseResponse
}

export function LearningPath({ course }: LearningPathProps) {
  const reducedMotion = useReducedMotion()
  const [lockedMessage, setLockedMessage] = useState<string | null>(null)
  const [showReturn, setShowReturn] = useState(false)
  const currentSkill = useMemo(
    () => findCurrentSkill(course.units),
    [course.units],
  )
  const scrolledRef = useRef(false)

  const handleLockedActivate = useCallback((skill: SkillSummary) => {
    setLockedMessage(
      `${skill.title} is locked. Complete the previous skill to unlock this trail.`,
    )
  }, [])

  useEffect(() => {
    if (scrolledRef.current || !currentSkill) return
    scrolledRef.current = true
    const node = document.getElementById('current-skill-node')
    if (!node || typeof node.scrollIntoView !== 'function') return
    node.scrollIntoView({
      block: 'center',
      behavior: reducedMotion ? 'auto' : 'smooth',
    })
  }, [currentSkill, reducedMotion])

  useEffect(() => {
    if (!currentSkill) return

    const onScroll = () => {
      const node = document.getElementById('current-skill-node')
      if (!node) {
        setShowReturn(false)
        return
      }
      const rect = node.getBoundingClientRect()
      const far =
        rect.bottom < 80 || rect.top > window.innerHeight - 120
      setShowReturn(far)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [currentSkill])

  const returnToCurrent = () => {
    const node = document.getElementById('current-skill-node')
    if (!node || typeof node.scrollIntoView !== 'function') return
    node.scrollIntoView({
      block: 'center',
      behavior: reducedMotion ? 'auto' : 'smooth',
    })
  }

  let pathStartIndex = 0

  return (
    <div className="relative mx-auto w-full max-w-lq-standard overflow-x-clip">
      <header className="mb-6 space-y-1 text-center sm:text-left">
        <p className="text-lq-sm font-bold uppercase tracking-wide text-lq-text-secondary">
          Course
        </p>
        <h1 className="text-lq-3xl font-extrabold text-lq-text-primary">
          {course.course.title}
        </h1>
        <p className="text-lq-sm text-lq-text-secondary">
          {course.course.from_language_code.toUpperCase()} →{' '}
          {course.course.language_code.toUpperCase()}
        </p>
      </header>

      <div className="space-y-10" role="list" aria-label="Learning path units">
        {course.units.map((unit, unitIndex) => {
          const start = pathStartIndex
          pathStartIndex += unit.skills.length
          return (
            <UnitSection
              key={unit.id}
              unit={unit}
              unitIndex={unitIndex + 1}
              pathStartIndex={start}
              currentSkillId={currentSkill?.id ?? null}
              showMascot={unitIndex === 0}
              onLockedActivate={handleLockedActivate}
            />
          )
        })}
      </div>

      {lockedMessage ? (
        <div
          role="status"
          className={cn(
            'fixed bottom-20 left-1/2 z-feedback w-[min(24rem,calc(100%-2rem))]',
            '-translate-x-1/2 rounded-lq-lg border-2 border-lq-locked-border',
            'bg-lq-bg-surface p-3 text-center text-lq-sm font-semibold shadow-lq-lg',
            'lg:bottom-6',
          )}
        >
          <p>{lockedMessage}</p>
          <button
            type="button"
            className="mt-2 text-lq-sm font-bold text-lq-primary underline"
            onClick={() => setLockedMessage(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {showReturn && currentSkill ? (
        <div className="fixed bottom-20 right-4 z-feedback lg:bottom-6 lg:right-8">
          <Button3D
            size="sm"
            variant="primary"
            onClick={returnToCurrent}
            aria-label={`Return to current lesson, ${currentSkill.title}`}
          >
            Return to current
          </Button3D>
        </div>
      ) : null}
    </div>
  )
}

export function LearningPathSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-lq-standard space-y-8"
      aria-busy="true"
      aria-label="Loading learning path"
    >
      <div className="space-y-2">
        <Skeleton width={96} height={16} />
        <Skeleton width={180} height={36} />
      </div>
      <Skeleton height={96} className="w-full" />
      <div className="flex flex-col items-center gap-8">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton
            key={index}
            variant="circular"
            width={80}
            height={80}
          />
        ))}
      </div>
    </div>
  )
}

export function LearningPathError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div
      className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center"
      role="alert"
    >
      <QuestMascot variant="concerned" size={72} decorative={false} label="Quest looks concerned" />
      <h1 className="text-lq-2xl font-extrabold">Something went wrong</h1>
      <p className="text-lq-sm text-lq-text-secondary" id="path-error-message">
        {message}
      </p>
      <Button3D variant="primary" onClick={onRetry} aria-describedby="path-error-message">
        Retry
      </Button3D>
    </div>
  )
}

export function LearningPathEmpty({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <QuestMascot variant="encouraging" size={72} decorative />
      <h1 className="text-lq-2xl font-extrabold">No course found</h1>
      <p className="text-lq-sm text-lq-text-secondary">
        Your learning path is empty. Try refreshing to load your course.
      </p>
      <Button3D variant="primary" onClick={onRetry}>
        Refresh
      </Button3D>
    </div>
  )
}
