/**
 * Presentation-only helpers for highlighting the learner's current path position.
 * Never mutates backend progress.
 */

import type { SkillStatus } from '@/lib/contracts/common'
import type { SkillSummary, UnitSummary } from '@/lib/contracts/course'

export function flattenSkills(units: UnitSummary[]): SkillSummary[] {
  return units.flatMap((unit) => unit.skills)
}

/**
 * Prefer the first in-progress skill; otherwise the first available skill.
 */
export function findCurrentSkill(units: UnitSummary[]): SkillSummary | null {
  const skills = flattenSkills(units)
  const inProgress = skills.find((skill) => skill.status === 'in_progress')
  if (inProgress) return inProgress
  const available = skills.find((skill) => skill.status === 'available')
  return available ?? null
}

export function statusLabel(status: SkillStatus): string {
  switch (status) {
    case 'completed':
      return 'completed'
    case 'in_progress':
      return 'in progress'
    case 'available':
      return 'available'
    case 'locked':
      return 'locked'
  }
}

export function skillNodeAriaLabel(skill: SkillSummary, isCurrent: boolean): string {
  const crownPart = `${skill.crowns} of ${skill.max_level} crowns`
  const currentPart = isCurrent ? ', current lesson' : ''
  return `${skill.title}, ${statusLabel(skill.status)}, ${crownPart}${currentPart}`
}

/** Winding offsets producing a natural S-curve with handcrafted feel. */
export type PathOffset = 'center' | 'left' | 'right' | 'far-left' | 'far-right'

export function pathOffsetForIndex(index: number): PathOffset {
  const pattern: PathOffset[] = [
    'center',
    'right',
    'far-right',
    'right',
    'center',
    'left',
    'far-left',
    'left',
  ]
  return pattern[index % pattern.length]
}
