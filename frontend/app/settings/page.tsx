'use client'

import { AppShell } from '@/components/layout/app-shell'
import { ComingSoonSection } from '@/components/settings/coming-soon-section'
import { SettingsForm } from '@/components/settings/settings-form'
import {
  SettingsError,
  SettingsSkeleton,
} from '@/components/settings/settings-states'
import { SurfaceCard } from '@/components/ui/surface-card'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useLearnerShellData } from '@/hooks/use-learner-shell-data'
import { useSettingsData } from '@/hooks/use-settings-data'
import { useSessionStore } from '@/stores/session-store'

export default function SettingsPage() {
  const shell = useLearnerShellData()
  const { profile, status, error, reload } = useSettingsData()
  const learner = useSessionStore((s) => s.learner)

  return (
    <AppShell
      learner={learner}
      learnerLoading={shell.status === 'loading' || status === 'loading'}
    >
      {status === 'loading' ? <SettingsSkeleton /> : null}
      {status === 'error' ? (
        <SettingsError
          message={error?.message ?? 'Could not load settings.'}
          onRetry={reload}
        />
      ) : null}
      {status === 'ready' && profile !== null ? (
        <div className="mx-auto w-full max-w-lq-narrow space-y-6 pb-4">
          <header className="space-y-1">
            <h1 className="text-lq-2xl font-extrabold sm:text-lq-3xl">
              Settings
            </h1>
            <p className="text-lq-sm text-lq-text-secondary">
              Update your learner preferences. Theme stays on this device;
              progress always comes from the backend.
            </p>
          </header>

          <SettingsForm profile={profile} />

          <SurfaceCard className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lq-lg font-extrabold">Appearance</h2>
              <p className="mt-1 text-lq-sm text-lq-text-secondary">
                Light, dark, or match your system. Only theme preference is
                stored locally.
              </p>
            </div>
            <ThemeToggle />
          </SurfaceCard>

          <ComingSoonSection />
        </div>
      ) : null}
    </AppShell>
  )
}
