'use client'

import { AppShell } from '@/components/layout/app-shell'
import { LearnerSummaryPanel } from '@/components/layout/learner-summary-panel'
import {
  LearningPath,
  LearningPathEmpty,
  LearningPathError,
  LearningPathSkeleton,
} from '@/components/path/learning-path'
import { useLearnerShellData } from '@/hooks/use-learner-shell-data'
import { useSessionStore } from '@/stores/session-store'

/**
 * Learner dashboard / learning path (entered from the welcome Get Started CTA).
 */
export default function LearnPage() {
  const { course, status, error, reload } = useLearnerShellData()
  const learner = useSessionStore((s) => s.learner)

  const rightPanel =
    status === 'ready' && course !== null ? (
      <LearnerSummaryPanel
        learner={course.learner}
        courseTitle={course.course.title}
      />
    ) : null

  return (
    <AppShell
      learner={learner ?? course?.learner ?? null}
      learnerLoading={status === 'loading'}
      rightPanel={rightPanel}
    >
      {status === 'loading' ? <LearningPathSkeleton /> : null}
      {status === 'error' ? (
        <LearningPathError
          message={error?.message ?? 'Could not load your learning path.'}
          onRetry={reload}
        />
      ) : null}
      {status === 'empty' ? <LearningPathEmpty onRetry={reload} /> : null}
      {status === 'ready' && course !== null ? (
        <LearningPath course={course} />
      ) : null}
    </AppShell>
  )
}
