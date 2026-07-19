'use client'

import { AppShell } from '@/components/layout/app-shell'
import {
  LeaderboardEmpty,
  LeaderboardError,
  LeaderboardSkeleton,
} from '@/components/leaderboard/leaderboard-states'
import { LeaderboardView } from '@/components/leaderboard/leaderboard-view'
import { useLeaderboardData } from '@/hooks/use-leaderboard-data'
import { useLearnerShellData } from '@/hooks/use-learner-shell-data'
import { useSessionStore } from '@/stores/session-store'

export default function LeaderboardPage() {
  const shell = useLearnerShellData()
  const { data, status, error, reload } = useLeaderboardData()
  const learner = useSessionStore((s) => s.learner)

  return (
    <AppShell
      learner={learner}
      learnerLoading={shell.status === 'loading' || status === 'loading'}
    >
      {status === 'loading' ? <LeaderboardSkeleton /> : null}
      {status === 'error' ? (
        <LeaderboardError
          message={error?.message ?? 'Could not load the leaderboard.'}
          onRetry={reload}
        />
      ) : null}
      {status === 'empty' ? <LeaderboardEmpty onRetry={reload} /> : null}
      {status === 'ready' && data !== null ? (
        <LeaderboardView data={data} />
      ) : null}
    </AppShell>
  )
}
