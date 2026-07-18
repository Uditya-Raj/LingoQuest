'use client'

import { use } from 'react'

import { LessonPlayer } from '@/components/lesson/lesson-player'

/**
 * Focused lesson layout — no learner shell navigation.
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
      <LessonPlayer attemptId={attemptId} />
    </main>
  )
}
