'use client'

import { Flame, Star, Target } from 'lucide-react'

import { ProgressBar } from '@/components/ui/progress-bar'
import { QuestMascot } from '@/components/ui/quest-mascot'
import { SurfaceCard } from '@/components/ui/surface-card'
import type { LearnerSummary } from '@/lib/contracts/common'
import { cn } from '@/lib/utils'

interface LearnerSummaryPanelProps {
  learner: LearnerSummary
  courseTitle: string
  className?: string
}

/**
 * Optional right-rail summary for wide desktop viewports.
 * Displays backend values only — no local progress math.
 */
export function LearnerSummaryPanel({
  learner,
  courseTitle,
  className,
}: LearnerSummaryPanelProps) {
  const dailyMax = Math.max(learner.daily_goal_xp, 1)
  const dailyCurrent = Math.min(learner.today_xp, dailyMax)

  return (
    <aside
      className={cn(
        'hidden xl:block',
        'w-[280px] shrink-0',
        'sticky top-6 self-start',
        className,
      )}
      aria-label="Learner summary"
    >
      <SurfaceCard className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <QuestMascot variant="encouraging" size={56} decorative />
          <div className="min-w-0">
            <p className="truncate text-lq-lg font-extrabold text-lq-text-primary">
              {learner.display_name}
            </p>
            <p className="truncate text-lq-sm text-lq-text-secondary">{courseTitle}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-lq-sm font-bold">
            <span className="inline-flex items-center gap-1.5 text-lq-text-secondary">
              <Target size={16} aria-hidden="true" />
              Daily goal
            </span>
            <span className="tabular-nums text-lq-text-primary">
              {learner.today_xp}/{learner.daily_goal_xp} XP
            </span>
          </div>
          <ProgressBar
            value={dailyCurrent}
            max={dailyMax}
            label={`Daily goal ${learner.today_xp} of ${learner.daily_goal_xp} XP`}
            variant="primary"
          />
        </div>

        <dl className="grid grid-cols-2 gap-3 text-lq-sm">
          <div className="rounded-lq bg-lq-streak-bg p-3">
            <dt className="inline-flex items-center gap-1 font-bold text-lq-streak">
              <Flame size={14} aria-hidden="true" />
              Streak
            </dt>
            <dd className="mt-1 text-lq-xl font-extrabold tabular-nums text-lq-text-primary">
              {learner.current_streak}
            </dd>
          </div>
          <div className="rounded-lq bg-lq-xp-bg p-3">
            <dt className="inline-flex items-center gap-1 font-bold text-lq-xp">
              <Star size={14} aria-hidden="true" />
              Total XP
            </dt>
            <dd className="mt-1 text-lq-xl font-extrabold tabular-nums text-lq-text-primary">
              {learner.total_xp}
            </dd>
          </div>
        </dl>
      </SurfaceCard>
    </aside>
  )
}
