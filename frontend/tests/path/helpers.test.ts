import { describe, expect, it } from 'vitest'

import {
  findCurrentSkill,
  pathOffsetForIndex,
  skillNodeAriaLabel,
} from '@/lib/path/current-skill'
import { resolveSkillIcon } from '@/lib/icons/skill-icons'
import { mockCourse } from '@/tests/fixtures/phase9a'
import { CircleHelp } from 'lucide-react'

describe('findCurrentSkill', () => {
  it('prefers the first in-progress skill', () => {
    const current = findCurrentSkill(mockCourse.units)
    expect(current?.id).toBe(3)
    expect(current?.title).toBe('Food')
  })

  it('falls back to the first available skill', () => {
    const units = mockCourse.units.map((unit) => ({
      ...unit,
      skills: unit.skills.map((skill) =>
        skill.status === 'in_progress'
          ? { ...skill, status: 'completed' as const, crowns: 5 }
          : skill,
      ),
    }))
    const current = findCurrentSkill(units)
    expect(current?.id).toBe(4)
    expect(current?.status).toBe('available')
  })
})

describe('pathOffsetForIndex', () => {
  it('follows 8-step winding S-curve pattern', () => {
    expect(pathOffsetForIndex(0)).toBe('center')
    expect(pathOffsetForIndex(1)).toBe('right')
    expect(pathOffsetForIndex(2)).toBe('far-right')
    expect(pathOffsetForIndex(3)).toBe('right')
    expect(pathOffsetForIndex(4)).toBe('center')
    expect(pathOffsetForIndex(5)).toBe('left')
    expect(pathOffsetForIndex(6)).toBe('far-left')
    expect(pathOffsetForIndex(7)).toBe('left')
    expect(pathOffsetForIndex(8)).toBe('center')
  })
})

describe('skillNodeAriaLabel', () => {
  it('includes status and exact crown values', () => {
    const skill = mockCourse.units[1].skills[0]
    expect(skillNodeAriaLabel(skill, true)).toBe(
      'Food, in progress, 2 of 5 crowns, current lesson',
    )
  })
})

describe('resolveSkillIcon', () => {
  it('maps known seeded keys', () => {
    expect(resolveSkillIcon('wave')).not.toBe(CircleHelp)
    expect(resolveSkillIcon('apple')).not.toBe(CircleHelp)
  })

  it('falls back for unknown keys without throwing', () => {
    expect(resolveSkillIcon('duolingo-owl')).toBe(CircleHelp)
    expect(resolveSkillIcon('totally-unknown')).toBe(CircleHelp)
  })
})
