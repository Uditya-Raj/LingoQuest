'use client'

import { Lock } from 'lucide-react'

import { AchievementIcon } from '@/components/profile/achievement-icon'
import { SurfaceCard } from '@/components/ui/surface-card'
import type { AchievementListItem } from '@/lib/contracts/achievements'
import { formatEarnedAt } from '@/lib/profile/format-date'
import { cn } from '@/lib/utils'

interface AchievementBadgeProps {
  achievement: AchievementListItem
  className?: string
}

/**
 * Earned/locked achievement card. State is not color-only.
 * Progress uses API current_value / criteria_value only.
 */
export function AchievementBadge({ achievement, className }: AchievementBadgeProps) {
  const earned = achievement.earned
  const statusText = earned ? 'Earned' : 'Not yet earned'
  const earnedDate =
    earned && achievement.earned_at
      ? formatEarnedAt(achievement.earned_at)
      : null
  const progressLabel = `Progress ${achievement.current_value} of ${achievement.criteria_value}`
  const ariaLabel = [
    achievement.title,
    statusText,
    progressLabel,
    earnedDate ? `Earned ${earnedDate}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <li className={cn('min-w-0', className)}>
      <SurfaceCard
        className={cn(
          'h-full p-4',
          earned
            ? 'border-lq-crown/40 bg-lq-crown-bg/40'
            : 'bg-lq-bg-sunken/60',
        )}
        aria-label={ariaLabel}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'relative flex h-12 w-12 shrink-0 items-center justify-center',
              'rounded-lq-full border-2',
              earned
                ? 'border-lq-crown bg-lq-crown-bg'
                : 'border-lq-border-default bg-lq-bg-surface',
            )}
            aria-hidden="true"
          >
            <AchievementIcon iconKey={achievement.icon} earned={earned} />
            {!earned ? (
              <span className="absolute -bottom-1 -right-1 rounded-lq-full bg-lq-bg-surface p-0.5 shadow-lq-sm">
                <Lock className="h-3.5 w-3.5 text-lq-text-secondary" />
              </span>
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-lq-text-primary">{achievement.title}</p>
            <p className="mt-1 text-lq-sm text-lq-text-secondary">
              {achievement.description}
            </p>
            <p
              className={cn(
                'mt-2 inline-flex items-center rounded-lq px-2 py-0.5',
                'text-lq-xs font-bold',
                earned
                  ? 'bg-lq-success-bg text-lq-success'
                  : 'bg-lq-bg-surface text-lq-text-secondary',
              )}
            >
              {statusText}
            </p>
            {earnedDate ? (
              <p className="mt-1 text-lq-xs text-lq-text-secondary">
                <time dateTime={achievement.earned_at ?? undefined}>
                  Earned {earnedDate}
                </time>
              </p>
            ) : null}
            <p className="mt-1 text-lq-xs tabular-nums text-lq-text-secondary">
              {progressLabel}
            </p>
          </div>
        </div>
      </SurfaceCard>
    </li>
  )
}
