'use client'

import { useCallback, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gem, Heart } from 'lucide-react'

import { LessonTimeExpiredModal } from '@/components/lesson/lesson-time-expired-modal'
import { Button3D } from '@/components/ui/button-3d'
import { Modal } from '@/components/ui/modal'
import { QuestMascot } from '@/components/ui/quest-mascot'
import { StatusBadge } from '@/components/ui/status-badge'
import { useToast } from '@/components/ui/toast'
import { ApiError, refillHearts, startLesson } from '@/lib/api'
import type { FailureReason } from '@/lib/contracts/common'
import type { LessonAttemptResponse } from '@/lib/contracts/lesson'
import { useSessionStore } from '@/stores/session-store'

const REFILL_GEM_COST = 20

interface LessonFailedSurfaceProps {
  skillTitle: string
  failureReason: FailureReason
  attempt: LessonAttemptResponse
}

export function LessonFailedSurface({
  skillTitle,
  failureReason,
  attempt,
}: LessonFailedSurfaceProps) {
  const router = useRouter()
  const { addToast } = useToast()
  const titleId = useId()
  const descriptionId = useId()

  const learner = useSessionStore((s) => s.learner)
  const applyRefill = useSessionStore((s) => s.applyRefill)
  const setAttempt = useSessionStore((s) => s.setAttempt)

  const [refillPending, setRefillPending] = useState(false)
  const [retryPending, setRetryPending] = useState(false)
  const [refilled, setRefilled] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const refillInFlightRef = useRef(false)
  const retryInFlightRef = useRef(false)

  const isOutOfHearts = failureReason === 'out_of_hearts'
  const gemBalance = learner?.gems
  const canAfford =
    gemBalance === undefined ? true : gemBalance >= REFILL_GEM_COST

  const handleReturnToPath = useCallback(() => {
    router.push('/')
  }, [router])

  const handleRefill = useCallback(() => {
    if (!isOutOfHearts || refillInFlightRef.current || refilled) return
    refillInFlightRef.current = true
    setRefillPending(true)
    setActionError(null)

    void refillHearts({ confirm_spend: true })
      .then((response) => {
        applyRefill(response)
        setRefilled(true)
        addToast({
          variant: 'success',
          title: 'Hearts refilled',
          description: `Spent ${response.gems_spent} gems · ${response.hearts} hearts ready`,
          priority: 'normal',
          duration: 3500,
        })
      })
      .catch((err: unknown) => {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Could not refill hearts. Try again.'
        setActionError(message)
        addToast({
          variant: 'error',
          title: 'Refill failed',
          description: message,
          priority: 'high',
          duration: 5000,
        })
      })
      .finally(() => {
        refillInFlightRef.current = false
        setRefillPending(false)
      })
  }, [addToast, applyRefill, isOutOfHearts, refilled])

  const handleRetry = useCallback(() => {
    if (!refilled || retryInFlightRef.current) return
    const skillId = attempt.skill_id
    if (!Number.isFinite(skillId) || skillId <= 0) {
      setActionError('Cannot retry — skill is missing from this attempt.')
      return
    }

    retryInFlightRef.current = true
    setRetryPending(true)
    setActionError(null)

    void startLesson(skillId)
      .then((nextAttempt) => {
        setAttempt(nextAttempt)
        router.replace(`/lesson/${nextAttempt.attempt_id}`)
      })
      .catch((err: unknown) => {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Could not start a new lesson. Try again.'
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
  }, [addToast, attempt.skill_id, refilled, router, setAttempt])

  if (!isOutOfHearts) {
    return (
      <LessonTimeExpiredModal skillTitle={skillTitle} attempt={attempt} />
    )
  }

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
          <div className="flex items-center gap-2" aria-hidden="true">
            {Array.from({ length: attempt.max_hearts || 5 }, (_, index) => (
              <Heart
                key={index}
                className="h-6 w-6 fill-transparent text-lq-border-strong"
                strokeWidth={2}
              />
            ))}
          </div>
          <StatusBadge variant="error">0 hearts</StatusBadge>
          <div>
            <h1 id={titleId} className="text-lq-2xl font-extrabold">
              Out of hearts
            </h1>
            <p className="mt-1 text-lq-sm font-bold text-lq-text-secondary">
              {skillTitle}
            </p>
          </div>
          <p id={descriptionId} className="text-lq-sm text-lq-text-secondary">
            This lesson attempt has ended. No XP was awarded. Refill your hearts
            to start a fresh attempt — the failed one stays closed.
          </p>

          {actionError ? (
            <p className="w-full text-lq-sm font-bold text-lq-text-error" role="alert">
              {actionError}
            </p>
          ) : null}

          {!refilled ? (
            <Button3D
              className="w-full"
              onClick={handleRefill}
              loading={refillPending}
              disabled={!canAfford || refillPending}
              aria-label={`Refill hearts for ${REFILL_GEM_COST} gems`}
            >
              <Gem className="h-4 w-4" aria-hidden="true" />
              Refill for {REFILL_GEM_COST} gems
              {gemBalance !== undefined ? ` · ${gemBalance} owned` : ''}
            </Button3D>
          ) : (
            <Button3D
              className="w-full"
              variant="success"
              onClick={handleRetry}
              loading={retryPending}
              disabled={retryPending}
            >
              Retry lesson
            </Button3D>
          )}

          {!canAfford && !refilled ? (
            <p className="text-lq-xs font-bold text-lq-text-secondary">
              Not enough gems for a refill right now.
            </p>
          ) : null}

          <p className="text-lq-xs text-lq-text-secondary">
            Practice to refill — Coming Soon
          </p>

          <Button3D
            variant="ghost"
            className="w-full"
            onClick={handleReturnToPath}
            disabled={refillPending || retryPending}
          >
            Return to learning path
          </Button3D>
        </div>
      </Modal>
    </main>
  )
}
