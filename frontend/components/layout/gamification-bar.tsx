'use client'

import { Flame, Gem, Heart, Star } from 'lucide-react'

import { ProgressBar } from '@/components/ui/progress-bar'
import { Skeleton } from '@/components/ui/skeleton'
import { StatIndicator } from '@/components/ui/stat-indicator'
import type { LearnerSummary } from '@/lib/contracts/common'
import { cn } from '@/lib/utils'

interface GamificationBarProps {
  learner: LearnerSummary | null
  loading?: boolean
  className?: string
  showDailyGoal?: boolean
}

function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  }
  if (value >= 10_000) {
    return `${Math.round(value / 1000)}k`
  }
  return String(value)
}

export function GamificationBar({
  learner,
  loading = false,
  className,
  showDailyGoal = true,
}: GamificationBarProps) {
  if (loading || learner === null) {
    return (
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 sm:gap-3',
          'min-h-11',
          className,
        )}
        aria-busy="true"
        aria-label="Loading learner stats"
      >
        <Skeleton width={72} height={32} className="rounded-lq-full" />
        <Skeleton width={64} height={32} className="rounded-lq-full" />
        <Skeleton width={72} height={32} className="rounded-lq-full" />
        <Skeleton width={64} height={32} className="rounded-lq-full" />
      </div>
    )
  }

  const dailyMax = Math.max(learner.daily_goal_xp, 1)
  const dailyCurrent = Math.min(learner.today_xp, dailyMax)

  return (
    <div
      className={cn(
        'flex flex-nowrap items-center gap-1 sm:gap-2',
        'min-h-11',
        className,
      )}
    >
      <StatIndicator
        variant="streak"
        value={learner.current_streak}
        icon={<Flame />}
        label={`${learner.current_streak} day streak`}
      />
      <StatIndicator
        variant="heart"
        value={`${learner.hearts}/${learner.max_hearts}`}
        icon={<Heart fill="currentColor" />}
        label={`${learner.hearts} of ${learner.max_hearts} hearts`}
      />
      <StatIndicator
        variant="xp"
        value={formatCompactNumber(learner.total_xp)}
        icon={<Star fill="currentColor" />}
        label={`${learner.total_xp} total XP`}
      />
      <StatIndicator
        variant="gem"
        value={formatCompactNumber(learner.gems)}
        icon={<Gem />}
        label={`${learner.gems} gems`}
      />
      {showDailyGoal ? (
        <div className="ml-auto hidden min-w-[8rem] max-w-[12rem] flex-1 sm:block">
          <ProgressBar
            value={dailyCurrent}
            max={dailyMax}
            label={`Daily goal ${learner.today_xp} of ${learner.daily_goal_xp} XP`}
            variant="primary"
          />
        </div>
      ) : null}
    </div>
  )
}
