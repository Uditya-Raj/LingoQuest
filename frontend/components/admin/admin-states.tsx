'use client'

import { Button3D } from '@/components/ui/button-3d'
import { Skeleton } from '@/components/ui/skeleton'
import { SurfaceCard } from '@/components/ui/surface-card'
import { cn } from '@/lib/utils'

export function ContentManagerSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'mx-auto grid w-full max-w-lq-wide gap-4 lg:grid-cols-[280px_1fr]',
        className,
      )}
      aria-busy="true"
      aria-label="Loading content manager"
    >
      <SurfaceCard className="space-y-3 p-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/6" />
      </SurfaceCard>
      <SurfaceCard className="space-y-4 p-5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </SurfaceCard>
    </div>
  )
}

export function ContentManagerError({
  message,
  onRetry,
  className,
}: {
  message: string
  onRetry: () => void
  className?: string
}) {
  return (
    <SurfaceCard
      className={cn('mx-auto max-w-lq-narrow space-y-4 p-6', className)}
      role="alert"
    >
      <h1 className="text-lq-xl font-extrabold">Could not load content</h1>
      <p className="text-lq-sm text-lq-text-secondary">{message}</p>
      <Button3D type="button" onClick={onRetry}>
        Retry
      </Button3D>
    </SurfaceCard>
  )
}

export function AdminAccessDenied({
  message,
  className,
}: {
  message?: string
  className?: string
}) {
  return (
    <SurfaceCard
      className={cn('mx-auto max-w-lq-narrow space-y-4 p-6', className)}
      role="alert"
    >
      <h1 className="text-lq-xl font-extrabold">Access denied</h1>
      <p className="text-lq-sm text-lq-text-secondary">
        {message ??
          'Content administration requires administrator permission. The backend denied this request.'}
      </p>
      <p className="text-lq-xs text-lq-text-secondary">
        This page does not store admin flags locally. Permission is checked by
        the administration API on each load.
      </p>
    </SurfaceCard>
  )
}
