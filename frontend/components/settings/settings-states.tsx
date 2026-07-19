'use client'

import { Button3D } from '@/components/ui/button-3d'
import { QuestMascot } from '@/components/ui/quest-mascot'
import { Skeleton } from '@/components/ui/skeleton'
import { SurfaceCard } from '@/components/ui/surface-card'

export function SettingsSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-lq-narrow space-y-4"
      aria-busy="true"
      aria-label="Loading settings"
    >
      <Skeleton height={32} className="w-1/3" />
      <SurfaceCard className="space-y-4 p-5">
        <Skeleton height={20} className="w-1/2" />
        <Skeleton height={44} className="w-full" />
        <Skeleton height={44} className="w-full" />
        <Skeleton height={48} className="w-32" />
      </SurfaceCard>
      <SurfaceCard className="p-5">
        <Skeleton height={40} className="w-40" />
      </SurfaceCard>
    </div>
  )
}

export function SettingsError({
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
      <h1 className="text-lq-2xl font-extrabold">Could not load settings</h1>
      <p className="text-lq-sm text-lq-text-secondary" id="settings-error-message">
        {message}
      </p>
      <Button3D
        variant="primary"
        onClick={onRetry}
        aria-describedby="settings-error-message"
      >
        Retry
      </Button3D>
    </div>
  )
}
