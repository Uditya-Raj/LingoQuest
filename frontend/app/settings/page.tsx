'use client'

import { AppShell } from '@/components/layout/app-shell'
import { SurfaceCard } from '@/components/ui/surface-card'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useLearnerShellData } from '@/hooks/use-learner-shell-data'
import { useSessionStore } from '@/stores/session-store'

export default function SettingsPage() {
  const { status } = useLearnerShellData()
  const learner = useSessionStore((s) => s.learner)

  return (
    <AppShell learner={learner} learnerLoading={status === 'loading'}>
      <SurfaceCard className="mx-auto max-w-lq-narrow space-y-4 p-6">
        <h1 className="text-lq-2xl font-extrabold">Settings</h1>
        <p className="text-lq-sm text-lq-text-secondary">
          Theme preference is stored locally. Learner progress stays on the
          backend.
        </p>
        <div className="flex items-center justify-between gap-3">
          <span className="font-bold">Appearance</span>
          <ThemeToggle />
        </div>
      </SurfaceCard>
    </AppShell>
  )
}
