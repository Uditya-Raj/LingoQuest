'use client'

import { Flame } from 'lucide-react'

import type { LeaderboardEntry } from '@/lib/contracts/leaderboard'
import { cn } from '@/lib/utils'

interface LeaderboardRowProps {
  entry: LeaderboardEntry
  className?: string
}

/**
 * Single ranked row. Uses backend rank/XP — never reorders.
 */
export function LeaderboardRow({ entry, className }: LeaderboardRowProps) {
  const isCurrent = entry.is_current_user

  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-lq px-3 py-3',
        'border-2 border-transparent',
        isCurrent &&
          'border-lq-primary bg-lq-primary/10 shadow-lq-sm ring-1 ring-lq-primary/30',
        className,
      )}
      aria-current={isCurrent ? 'true' : undefined}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center',
          'rounded-lq-full bg-lq-bg-sunken',
          'text-lq-sm font-extrabold tabular-nums text-lq-text-primary',
        )}
        aria-label={`Rank ${entry.rank}`}
      >
        {entry.rank}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate font-extrabold',
            isCurrent ? 'text-lq-primary' : 'text-lq-text-primary',
          )}
          title={entry.display_name}
        >
          {entry.display_name}
          {isCurrent ? (
            <span className="ml-2 text-lq-xs font-bold text-lq-primary">
              (You)
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 inline-flex items-center gap-1 text-lq-xs font-bold text-lq-streak">
          <Flame className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="tabular-nums">{entry.current_streak}</span>
          <span className="sr-only">day streak</span>
        </p>
      </div>
      <p
        className="shrink-0 text-right text-lq-sm font-extrabold tabular-nums text-lq-xp"
        aria-label={`${entry.total_xp} total XP`}
      >
        {entry.total_xp}
        <span className="ml-1 text-lq-xs font-bold text-lq-text-secondary">
          XP
        </span>
      </p>
    </li>
  )
}
