'use client'

import { PathConnector } from '@/components/path/path-connector'
import { SkillNode } from '@/components/path/skill-node'
import { UnitBanner } from '@/components/path/unit-banner'
import type { SkillSummary, UnitSummary } from '@/lib/contracts/course'
import { cn } from '@/lib/utils'

interface UnitSectionProps {
  unit: UnitSummary
  unitIndex: number
  pathStartIndex: number
  currentSkillId: number | null
  showMascot?: boolean
  onLockedActivate?: (skill: SkillSummary) => void
}

export function UnitSection({
  unit,
  unitIndex,
  pathStartIndex,
  currentSkillId,
  showMascot = false,
  onLockedActivate,
}: UnitSectionProps) {
  return (
    <section
      aria-labelledby={`unit-${unit.id}-title`}
      className="space-y-4"
      data-unit-id={unit.id}
    >
      <UnitBanner
        title={unit.title}
        description={unit.description}
        colorTheme={unit.color_theme}
        unitIndex={unitIndex}
        showMascot={showMascot}
        titleId={`unit-${unit.id}-title`}
      />

      <ol
        className={cn(
          'relative mx-auto flex max-w-md flex-col items-stretch',
          'px-6 sm:px-8',
          'overflow-x-clip',
        )}
      >
        {unit.skills.map((skill, skillIndex) => {
          const pathIndex = pathStartIndex + skillIndex
          const isCurrent = currentSkillId === skill.id
          const previous = skillIndex > 0 ? unit.skills[skillIndex - 1] : null

          return (
            <li key={skill.id} className="flex flex-col items-stretch">
              {previous ? (
                <PathConnector
                  fromStatus={previous.status}
                  toStatus={skill.status}
                />
              ) : null}
              <SkillNode
                skill={skill}
                pathIndex={pathIndex}
                isCurrent={isCurrent}
                onLockedActivate={onLockedActivate}
              />
              <p className="mt-2 text-center text-lq-sm font-bold text-lq-text-primary">
                {skill.title}
              </p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
