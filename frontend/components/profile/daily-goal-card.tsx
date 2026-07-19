'use client'

import { Target } from 'lucide-react'

import { ProgressBar } from '@/components/ui/progress-bar'
import { SurfaceCard } from '@/components/ui/surface-card'
import type { ProfileStats } from '@/lib/contracts/user'
import { cn } from '@/lib/utils'

interface DailyGoalCardProps {
  stats: Pick<ProfileStats, 'today_xp' | 'daily_goal_xp' | 'daily_goal_progress'>
  className?: string
}

/**
 * Daily goal progress from backend today_xp / daily_goal_xp / progress.
 * Visual bar clamps display safely when today_xp exceeds the goal.
 */
export function DailyGoalCard({ stats, className }: DailyGoalCardProps) {
  const goalXp = Math.max(stats.daily_goal_xp, 1)
  const barValue = Math.min(stats.today_xp, goalXp)
  const reached = stats.daily_goal_progress >= 1

  return (
    <SurfaceCard className={cn('p-5', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-lq-lg font-extrabold">
          <Target className="h-5 w-5 text-lq-primary" aria-hidden="true" />
          Daily goal
        </h2>
        <p className="text-lq-sm font-bold tabular-nums text-lq-text-secondary">
          {stats.today_xp}/{stats.daily_goal_xp} XP
        </p>
      </div>
      <ProgressBar
        className="mt-3"
        value={barValue}
        max={goalXp}
        label={`Daily goal ${stats.today_xp} of ${stats.daily_goal_xp} XP`}
        variant="primary"
      />
      <p className="mt-2 text-lq-sm text-lq-text-secondary">
        {reached
          ? 'Today’s goal is complete — keep exploring if you like.'
          : `${Math.max(stats.daily_goal_xp - stats.today_xp, 0)} XP left to reach today’s goal.`}
      </p>
    </SurfaceCard>
  )
}
