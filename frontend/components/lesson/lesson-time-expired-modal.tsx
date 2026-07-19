'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'

import { Button3D } from '@/components/ui/button-3d'
import { Modal } from '@/components/ui/modal'
import { QuestMascot } from '@/components/ui/quest-mascot'
import { StatusBadge } from '@/components/ui/status-badge'
import { useToast } from '@/components/ui/toast'
import { ApiError, startTimedPractice } from '@/lib/api'
import type { LessonAttemptResponse } from '@/lib/contracts/lesson'
import { cancelActiveLessonAudio } from '@/lib/audio/lesson-audio-controller'
import { useSessionStore } from '@/stores/session-store'

interface LessonTimeExpiredModalProps {
  skillTitle: string
  attempt: LessonAttemptResponse
}

export function LessonTimeExpiredModal({
  skillTitle,
  attempt,
}: LessonTimeExpiredModalProps) {
  const router = useRouter()
  const { addToast } = useToast()
  const titleId = useId()
  const descriptionId = useId()
  const setAttempt = useSessionStore((s) => s.setAttempt)

  const [retryPending, setRetryPending] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const retryInFlightRef = useRef(false)

  useEffect(() => {
    cancelActiveLessonAudio()
  }, [])

  const handleReturnToPath = useCallback(() => {
    cancelActiveLessonAudio()
    useSessionStore.setState({ attempt: null, completion: null })
    router.push('/learn')
  }, [router])

  const handleRetryTimed = useCallback(() => {
    if (retryInFlightRef.current) return
    const skillId = attempt.skill_id
    if (!Number.isFinite(skillId) || skillId <= 0) {
      setActionError('Cannot retry — skill is missing from this attempt.')
      return
    }

    retryInFlightRef.current = true
    setRetryPending(true)
    setActionError(null)
    cancelActiveLessonAudio()

    void startTimedPractice(skillId)
      .then((nextAttempt) => {
        setAttempt(nextAttempt)
        router.replace(`/lesson/${nextAttempt.attempt_id}`)
      })
      .catch((err: unknown) => {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Could not start Timed Practice. Try again.'
        setActionError(message)
        addToast({
          variant: 'error',
          title: 'Retry failed',
          description: message,
          priority: 'high',
          duration: 5000,
        })
      })
      .finally(() => {
        retryInFlightRef.current = false
        setRetryPending(false)
      })
  }, [addToast, attempt.skill_id, router, setAttempt])

  const answered = Math.min(attempt.current_index, attempt.total_exercises)
  const mistakes = attempt.mistakes_count

  return (
    <main className="min-h-[100dvh] bg-lq-bg-page">
      <Modal
        open
        dismissible={false}
        size="md"
        labelledBy={titleId}
        describedBy={descriptionId}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <QuestMascot variant="concerned" size={80} decorative />
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lq-full bg-lq-error-bg text-lq-timed-critical"
            aria-hidden="true"
          >
            <Clock className="h-6 w-6" />
          </div>
          <StatusBadge variant="error">Time expired</StatusBadge>
          <div>
            <h1 id={titleId} className="text-lq-2xl font-extrabold">
              Time&apos;s up!
            </h1>
            <p className="mt-1 text-lq-sm font-bold text-lq-text-secondary">
              {skillTitle}
            </p>
          </div>
          <p id={descriptionId} className="text-lq-sm text-lq-text-secondary">
            This Timed Practice session ended before you finished. No XP was
            awarded. Hearts were not spent.
          </p>
          <p className="text-lq-xs font-bold text-lq-text-secondary">
            Progress: {answered}/{attempt.total_exercises} answered
            {Number.isFinite(mistakes) ? ` · ${mistakes} mistakes` : ''}
          </p>

          {actionError ? (
            <p className="w-full text-lq-sm font-bold text-lq-text-error" role="alert">
              {actionError}
            </p>
          ) : null}

          <Button3D
            className="w-full"
            variant="timed"
            onClick={handleRetryTimed}
            loading={retryPending}
            disabled={retryPending}
          >
            Retry Timed Practice
          </Button3D>
          <Button3D
            variant="ghost"
            className="w-full"
            onClick={handleReturnToPath}
            disabled={retryPending}
          >
            Return to learning path
          </Button3D>
        </div>
      </Modal>
    </main>
  )
}
