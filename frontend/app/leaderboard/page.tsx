'use client'

import { AppShell } from '@/components/layout/app-shell'
import { SurfaceCard } from '@/components/ui/surface-card'
import { useLearnerShellData } from '@/hooks/use-learner-shell-data'
import { useSessionStore } from '@/stores/session-store'

export default function LeaderboardPage() {
  const { status } = useLearnerShellData()
  const learner = useSessionStore((s) => s.learner)

  return (
    <AppShell learner={learner} learnerLoading={status === 'loading'}>
      <SurfaceCard className="mx-auto max-w-lq-narrow p-6">
        <h1 className="text-lq-2xl font-extrabold">Leaderboard</h1>
        <p className="mt-2 text-lq-sm text-lq-text-secondary">
          Ranked XP standings arrive in a later phase. Navigation is live so you
          can return to Learn anytime.
        </p>
      </SurfaceCard>
    </AppShell>
  )
}
