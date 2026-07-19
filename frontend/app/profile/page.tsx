'use client'

import { AppShell } from '@/components/layout/app-shell'
import { ProfileError, ProfileSkeleton } from '@/components/profile/profile-states'
import { ProfileView } from '@/components/profile/profile-view'
import { useLearnerShellData } from '@/hooks/use-learner-shell-data'
import { useProfileData } from '@/hooks/use-profile-data'
import { useSessionStore } from '@/stores/session-store'

export default function ProfilePage() {
  const shell = useLearnerShellData()
  const { profile, achievements, status, error, reload } = useProfileData()
  const learner = useSessionStore((s) => s.learner)

  return (
    <AppShell
      learner={learner}
      learnerLoading={shell.status === 'loading' || status === 'loading'}
    >
      {status === 'loading' ? <ProfileSkeleton /> : null}
      {status === 'error' ? (
        <ProfileError
          message={error?.message ?? 'Could not load your profile.'}
          onRetry={reload}
        />
      ) : null}
      {status === 'ready' && profile !== null ? (
        <ProfileView profile={profile} achievements={achievements} />
      ) : null}
    </AppShell>
  )
}
