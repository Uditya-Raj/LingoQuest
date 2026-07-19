'use client'

import { Button3D } from '@/components/ui/button-3d'
import { QuestMascot } from '@/components/ui/quest-mascot'
import { Skeleton } from '@/components/ui/skeleton'
import { SurfaceCard } from '@/components/ui/surface-card'

export function ProfileSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-lq-standard space-y-4"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <SurfaceCard className="p-5">
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" width={80} height={80} />
          <div className="flex-1 space-y-2">
            <Skeleton height={28} className="w-2/3" />
            <Skeleton height={16} className="w-1/3" />
            <Skeleton height={14} className="w-1/2" />
          </div>
        </div>
      </SurfaceCard>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SurfaceCard key={index} className="p-4">
            <Skeleton height={64} className="w-full" />
          </SurfaceCard>
        ))}
      </div>
      <SurfaceCard className="p-5">
        <Skeleton height={20} className="mb-3 w-1/3" />
        <Skeleton height={16} className="w-full" />
      </SurfaceCard>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <SurfaceCard key={index} className="p-4">
            <Skeleton height={96} className="w-full" />
          </SurfaceCard>
        ))}
      </div>
    </div>
  )
}

export function ProfileError({
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
      <h1 className="text-lq-2xl font-extrabold">Could not load profile</h1>
      <p className="text-lq-sm text-lq-text-secondary" id="profile-error-message">
        {message}
      </p>
      <Button3D
        variant="primary"
        onClick={onRetry}
        aria-describedby="profile-error-message"
      >
        Retry
      </Button3D>
    </div>
  )
}
