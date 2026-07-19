'use client'

import { LeaderboardPodium } from '@/components/leaderboard/leaderboard-podium'
import { LeaderboardRow } from '@/components/leaderboard/leaderboard-row'
import { SurfaceCard } from '@/components/ui/surface-card'
import type { LeaderboardResponse } from '@/lib/contracts/leaderboard'
import { formatRankingBasis } from '@/lib/leaderboard/ranking-label'
import { cn } from '@/lib/utils'

interface LeaderboardViewProps {
  data: LeaderboardResponse
  className?: string
}

/**
 * Backend-ordered leaderboard with optional current-user footer.
 */
export function LeaderboardView({ data, className }: LeaderboardViewProps) {
  const { entries, current_user: currentUser, ranking_basis: rankingBasis } =
    data
  const podiumEntries = entries.slice(0, 3)
  const remainingEntries = entries.slice(3)
  const currentInList = entries.some(
    (entry) => entry.user_id === currentUser.user_id,
  )

  return (
    <div className={cn('mx-auto w-full max-w-lq-narrow space-y-6', className)}>
      <header className="space-y-1">
        <h1 className="text-lq-2xl font-extrabold sm:text-lq-3xl">
          Leaderboard
        </h1>
        <p className="text-lq-sm font-semibold text-lq-text-secondary">
          {formatRankingBasis(rankingBasis)}
        </p>
        <p className="text-lq-sm text-lq-text-secondary">
          Your rank:{' '}
          <span className="font-extrabold text-lq-primary tabular-nums">
            #{currentUser.rank}
          </span>
        </p>
      </header>

      {podiumEntries.length > 0 ? (
        <LeaderboardPodium entries={podiumEntries} />
      ) : null}

      {remainingEntries.length > 0 ? (
        <SurfaceCard className="p-2 sm:p-3">
          <ol className="space-y-1" aria-label="Leaderboard rankings">
            {remainingEntries.map((entry) => (
              <LeaderboardRow key={entry.user_id} entry={entry} />
            ))}
          </ol>
        </SurfaceCard>
      ) : null}

      {!currentInList ? (
        <SurfaceCard className="border-lq-primary p-2 sm:p-3" variant="elevated">
          <p className="mb-2 px-3 text-lq-xs font-bold uppercase tracking-wide text-lq-primary">
            Your standing
          </p>
          <ol aria-label="Your leaderboard standing">
            <LeaderboardRow entry={currentUser} />
          </ol>
        </SurfaceCard>
      ) : null}
    </div>
  )
}
