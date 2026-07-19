'use client'

import { Button3D } from '@/components/ui/button-3d'
import { QuestMascot } from '@/components/ui/quest-mascot'
import { Skeleton } from '@/components/ui/skeleton'
import { SurfaceCard } from '@/components/ui/surface-card'

export function LeaderboardSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-lq-narrow space-y-4"
      aria-busy="true"
      aria-label="Loading leaderboard"
    >
      <Skeleton height={32} className="w-1/2" />
      <Skeleton height={16} className="w-1/3" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SurfaceCard key={index} className="p-4">
            <Skeleton height={120} className="w-full" />
          </SurfaceCard>
        ))}
      </div>
      <SurfaceCard className="space-y-2 p-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} height={48} className="w-full" />
        ))}
      </SurfaceCard>
    </div>
  )
}

export function LeaderboardError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div
      className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center"
      role="alert"
    >
      <QuestMascot
        variant="concerned"
        size={72}
        decorative={false}
        label="Quest looks concerned"
      />
      <h1 className="text-lq-2xl font-extrabold">Could not load leaderboard</h1>
      <p
        className="text-lq-sm text-lq-text-secondary"
        id="leaderboard-error-message"
      >
        {message}
      </p>
      <Button3D
        variant="primary"
        onClick={onRetry}
        aria-describedby="leaderboard-error-message"
      >
        Retry
      </Button3D>
    </div>
  )
}

export function LeaderboardEmpty({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <QuestMascot variant="encouraging" size={72} decorative />
      <h1 className="text-lq-2xl font-extrabold">No rankings yet</h1>
      <p className="text-lq-sm text-lq-text-secondary">
        The trail is quiet. Earn XP in lessons to appear on the leaderboard.
      </p>
      <Button3D variant="primary" onClick={onRetry}>
        Refresh
      </Button3D>
    </div>
  )
}
