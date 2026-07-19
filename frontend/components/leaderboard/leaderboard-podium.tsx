'use client'

import { Flame } from 'lucide-react'

import { SurfaceCard } from '@/components/ui/surface-card'
import type { LeaderboardEntry } from '@/lib/contracts/leaderboard'
import { cn } from '@/lib/utils'

interface LeaderboardPodiumProps {
  /** First up to three entries in backend order — not re-sorted. */
  entries: LeaderboardEntry[]
  className?: string
}

const PODIUM_STYLES = [
  'border-lq-crown/50 bg-lq-crown-bg/50 sm:order-2 sm:-translate-y-2',
  'border-lq-border-default bg-lq-bg-sunken/80 sm:order-1',
  'border-lq-streak/40 bg-lq-streak-bg/40 sm:order-3',
] as const

/**
 * Celebratory top-three treatment using original medallions.
 * Preserves backend entry order and rank numbers.
 */
export function LeaderboardPodium({ entries, className }: LeaderboardPodiumProps) {
  const podium = entries.slice(0, 3)
  if (podium.length === 0) return null

  return (
    <ol
      className={cn(
        'grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end',
        className,
      )}
      aria-label="Top ranked learners"
    >
      {podium.map((entry, index) => {
        const isCurrent = entry.is_current_user
        return (
          <li
            key={entry.user_id}
            className={cn(PODIUM_STYLES[index] ?? '')}
            aria-current={isCurrent ? 'true' : undefined}
          >
            <SurfaceCard
              className={cn(
                'h-full p-4 text-center',
                isCurrent && 'ring-2 ring-lq-primary',
              )}
            >
              <div
                className={cn(
                  'mx-auto flex h-14 w-14 items-center justify-center',
                  'rounded-lq-full border-2 border-lq-primary',
                  'border-b-[length:var(--lq-depth-sm)] border-b-lq-primary-depth',
                  'bg-lq-primary/15 text-lq-xl font-extrabold text-lq-primary',
                )}
                aria-label={`Rank ${entry.rank}`}
              >
                {entry.rank}
              </div>
              <p
                className="mt-3 truncate text-lq-base font-extrabold text-lq-text-primary"
                title={entry.display_name}
              >
                {entry.display_name}
                {isCurrent ? (
                  <span className="sr-only"> (you)</span>
                ) : null}
              </p>
              <p className="mt-1 text-lq-sm font-extrabold tabular-nums text-lq-xp">
                {entry.total_xp} XP
              </p>
              <p className="mt-1 inline-flex items-center justify-center gap-1 text-lq-xs font-bold text-lq-streak">
                <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                {entry.current_streak}
              </p>
            </SurfaceCard>
          </li>
        )
      })}
    </ol>
  )
}
