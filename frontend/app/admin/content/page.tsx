'use client'

import { ContentManager } from '@/components/admin/content-manager'
import { AppShell } from '@/components/layout/app-shell'
import { useLearnerShellData } from '@/hooks/use-learner-shell-data'
import { useSessionStore } from '@/stores/session-store'

/**
 * Content administration — permission is established by GET /admin/content/tree.
 * Do not infer admin access from username, seed data, or localStorage.
 */
export default function AdminContentPage() {
  const shell = useLearnerShellData()
  const learner = useSessionStore((s) => s.learner)

  return (
    <AppShell
      learner={learner}
      learnerLoading={shell.status === 'loading'}
    >
      <ContentManager />
    </AppShell>
  )
}
