'use client'

import { Check, Lock } from 'lucide-react'
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
  left: '-translate-x-4 sm:-translate-x-10 md:-translate-x-16',
  right: 'translate-x-4 sm:translate-x-10 md:translate-x-16',
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

  const nodeClass = cn(
    'relative flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20',
    'rounded-lq-full',
    'border-[3px]',
    'border-b-[length:var(--lq-depth-lg)]',
    'shadow-lq-md',
    'transition-transform duration-[var(--lq-duration-press)]',
    'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-4',
    locked && [
      'bg-lq-locked-bg border-lq-locked-border border-b-lq-locked-border',
      'text-lq-locked-text cursor-not-allowed',
    ],
    available && [
      'bg-lq-primary border-lq-primary border-b-lq-primary-depth',
      'text-lq-text-inverse',
      'lq-available-pulse',
    ],
    inProgress && [
      'bg-lq-bg-surface border-lq-primary border-b-lq-primary-depth',
      'text-lq-primary',
      'ring-4 ring-lq-active-ring',
      'shadow-lq-lg',
    ],
    completed && [
      'bg-lq-success border-lq-success border-b-lq-success-depth',
      'text-lq-text-inverse',
    ],
    !locked && 'hover:translate-y-[-2px] active:translate-y-[var(--lq-depth-md)] active:border-b-[3px]',
  )

  const inner = (
    <>
      <span className="absolute inset-0 flex items-center justify-center">
        <ProgressRing
          value={skill.crowns}
          max={skill.max_level}
          size={72}
          strokeWidth={4}
          label={`${skill.crowns} of ${skill.max_level} crowns`}
          className="pointer-events-none absolute h-full w-full scale-110"
        />
      </span>
      <span className="relative z-[1] flex items-center justify-center">
        {locked ? (
          <Lock size={26} aria-hidden="true" />
        ) : completed ? (
          <Check size={28} strokeWidth={3} aria-hidden="true" />
        ) : (
          <SkillIcon iconKey={skill.icon} size={28} decorative />
        )}
      </span>
      {skill.crowns > 0 ? (
        <span
          className={cn(
            'absolute -bottom-1 left-1/2 z-[2] -translate-x-1/2',
            'rounded-lq-full bg-lq-crown-bg px-1.5 py-0.5',
            'text-[10px] font-extrabold tabular-nums text-lq-text-primary',
            'border border-lq-crown',
          )}
          aria-hidden="true"
        >
          {skill.crowns}/{skill.max_level}
        </span>
      ) : null}
    </>
  )

  return (
    <div
      className={cn(
        'relative z-[1] flex w-full justify-center',
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
    </div>
  )
}
