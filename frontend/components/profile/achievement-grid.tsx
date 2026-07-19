'use client'

import { AchievementBadge } from '@/components/profile/achievement-badge'
import { QuestMascot } from '@/components/ui/quest-mascot'
import type { AchievementListItem } from '@/lib/contracts/achievements'
import { cn } from '@/lib/utils'

interface AchievementGridProps {
  achievements: AchievementListItem[]
  className?: string
}

/**
 * Semantic achievement gallery from GET /achievements.
 */
export function AchievementGrid({ achievements, className }: AchievementGridProps) {
  if (achievements.length === 0) {
    return (
      <section
        className={cn('flex flex-col items-center gap-3 py-8 text-center', className)}
        aria-labelledby="achievements-heading"
      >
        <h2 id="achievements-heading" className="text-lq-xl font-extrabold">
          Achievements
        </h2>
        <QuestMascot variant="encouraging" size={64} decorative />
        <p className="text-lq-sm text-lq-text-secondary">
          No achievements are available yet. Keep learning to unlock Quest badges.
        </p>
      </section>
    )
  }

  const earnedCount = achievements.filter((item) => item.earned).length

  return (
    <section className={cn('space-y-4', className)} aria-labelledby="achievements-heading">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="achievements-heading" className="text-lq-xl font-extrabold">
          Achievements
        </h2>
        <p className="text-lq-sm font-bold text-lq-text-secondary">
          {earnedCount} of {achievements.length} earned
        </p>
      </div>
      <ul
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
        aria-label="Achievement gallery"
      >
        {achievements.map((achievement) => (
          <AchievementBadge key={achievement.id} achievement={achievement} />
        ))}
      </ul>
    </section>
  )
}
