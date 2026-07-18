'use client'

import { Check, Crown, Lock } from 'lucide-react'
import Link from 'next/link'

import { ProgressRing } from '@/components/ui/progress-ring'
import { SkillIcon } from '@/lib/icons/skill-icons'
import {
  pathOffsetForIndex,
  skillNodeAriaLabel,
  type PathOffset,
} from '@/lib/path/current-skill'
import type { SkillSummary } from '@/lib/contracts/course'
import { cn } from '@/lib/utils'

interface SkillNodeProps {
  skill: SkillSummary
  pathIndex: number
  isCurrent: boolean
  onLockedActivate?: (skill: SkillSummary) => void
}

const OFFSET_CLASS: Record<PathOffset, string> = {
  center: 'translate-x-0',
  left: '-translate-x-6 sm:-translate-x-12 md:-translate-x-16',
  right: 'translate-x-6 sm:translate-x-12 md:translate-x-16',
  'far-left': '-translate-x-10 sm:-translate-x-16 md:-translate-x-24',
  'far-right': 'translate-x-10 sm:translate-x-16 md:translate-x-24',
}

export function SkillNode({
  skill,
  pathIndex,
  isCurrent,
  onLockedActivate,
}: SkillNodeProps) {
  const offset = pathOffsetForIndex(pathIndex)
  const label = skillNodeAriaLabel(skill, isCurrent)
  const locked = skill.status === 'locked'
  const completed = skill.status === 'completed'
  const available = skill.status === 'available'
  const inProgress = skill.status === 'in_progress'

  // Colored nodes stay bright in both themes — use white ink, not text-inverse
  // (dark theme inverse is near-black and collapses icon contrast on primary/success).
  const nodeClass = cn(
    'relative flex items-center justify-center',
    'h-[68px] w-[68px] sm:h-[80px] sm:w-[80px]',
    'rounded-lq-full',
    'border-[3px]',
    'shadow-lq-md',
    'transition-all duration-[var(--lq-duration-press)]',
    'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-4',
    isCurrent && 'scroll-mt-28',
    locked && [
      'bg-lq-locked-bg border-lq-locked-border',
      'text-lq-locked-text cursor-not-allowed',
      'shadow-none',
    ],
    available && [
      'bg-lq-primary border-lq-primary',
      'border-b-[length:var(--lq-depth-lg)] border-b-lq-primary-depth',
      'text-white',
      !isCurrent && 'lq-available-pulse',
    ],
    inProgress && [
      'bg-lq-primary border-lq-primary',
      'border-b-[length:var(--lq-depth-lg)] border-b-lq-primary-depth',
      'text-white',
      'shadow-lq-lg',
    ],
    (inProgress || available) && isCurrent && [
      'ring-[5px] ring-lq-active-ring/60',
      'scale-110',
      'lq-available-pulse',
    ],
    completed && [
      'bg-lq-success border-lq-success',
      'border-b-[length:var(--lq-depth-lg)] border-b-lq-success-depth',
      'text-white',
    ],
    !locked && [
      'hover:-translate-y-0.5 hover:shadow-lq-lg',
      'active:translate-y-[var(--lq-depth-md)] active:border-b-[3px] active:shadow-lq-sm',
    ],
  )

  const ringSize = 88

  const inner = (
    <>
      {(completed || inProgress) && skill.crowns > 0 ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <ProgressRing
            value={skill.crowns}
            max={skill.max_level}
            size={ringSize}
            strokeWidth={5}
            label={`${skill.crowns} of ${skill.max_level} crowns`}
            className="pointer-events-none absolute h-full w-full scale-110"
          />
        </span>
      ) : null}
      <span className="relative z-[1] flex items-center justify-center">
        {locked ? (
          <Lock size={24} aria-hidden="true" />
        ) : completed ? (
          <Check size={30} strokeWidth={3} aria-hidden="true" />
        ) : (
          <SkillIcon iconKey={skill.icon} size={30} decorative />
        )}
      </span>
      {skill.crowns > 0 ? (
        <span
          className={cn(
            'absolute -bottom-2.5 left-1/2 z-[2] -translate-x-1/2',
            'inline-flex items-center gap-0.5',
            'rounded-lq-full px-2 py-0.5',
            'text-[11px] font-extrabold leading-none tabular-nums',
            'border-2 shadow-lq-sm',
            completed
              ? 'border-lq-crown bg-lq-crown-bg text-lq-text-primary'
              : 'border-lq-border-strong bg-lq-bg-surface text-lq-text-primary',
          )}
          aria-hidden="true"
        >
          <Crown size={10} className="text-lq-crown" aria-hidden="true" />
          {skill.crowns}/{skill.max_level}
        </span>
      ) : null}
    </>
  )

  return (
    <div
      className={cn(
        'relative z-[1] flex w-full flex-col items-center justify-center',
        OFFSET_CLASS[offset],
      )}
      data-skill-id={skill.id}
      data-skill-status={skill.status}
    >
      {locked ? (
        <button
          type="button"
          className={nodeClass}
          aria-label={label}
          aria-disabled="true"
          onClick={() => onLockedActivate?.(skill)}
        >
          {inner}
        </button>
      ) : (
        <Link
          href={`/skill/${skill.id}`}
          className={nodeClass}
          aria-label={label}
          aria-current={isCurrent ? 'step' : undefined}
          id={isCurrent ? 'current-skill-node' : undefined}
        >
          {inner}
        </Link>
      )}
      <p
        className={cn(
          'mt-2 text-center text-lq-sm font-bold',
          locked ? 'text-lq-locked-text' : 'text-lq-text-primary',
        )}
      >
        {skill.title}
      </p>
    </div>
  )
}
