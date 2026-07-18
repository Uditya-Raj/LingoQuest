'use client'

import { use } from 'react'

import { LessonHandoff } from '@/components/lesson/lesson-handoff'

/**
 * Focused lesson layout — no learner shell navigation.
 * Phase 9A handoff only; full player in Phase 10A.
 */
export default function LessonPage({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const { attemptId: attemptIdRaw } = use(params)
  const attemptId = Number.parseInt(attemptIdRaw, 10)

  if (!Number.isFinite(attemptId) || attemptId <= 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-lq-2xl font-extrabold">Invalid lesson</h1>
          <p className="mt-2 text-lq-sm text-lq-text-secondary">
            That attempt link is invalid.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-lq-bg-page text-lq-text-primary">
      <LessonHandoff attemptId={attemptId} />
    </main>
  )
}
