'use client'

import { useEffect, useRef } from 'react'

import { Button3D } from '@/components/ui/button-3d'
import { FeedbackSurface } from '@/components/ui/feedback-surface'
import {
  correctFeedbackMessage,
  incorrectFeedbackMessage,
} from '@/lib/lesson/feedback-copy'
import { formatCorrectSolution } from '@/lib/lesson/format-solution'
import type { PublicExercise } from '@/lib/contracts/exercises'
import type { AnswerResponse } from '@/lib/contracts/lesson'

interface LessonFeedbackRegionProps {
  open: boolean
  answerResult: AnswerResponse
  answeredExercise: PublicExercise
  /** Hide heart-loss messaging for timed practice. */
  showHearts: boolean
  canContinue: boolean
  isCompleting: boolean
  mutationError?: string | null
  onContinue: () => void
}

function SolutionBody({
  exercise,
  correctAnswer,
}: {
  exercise: PublicExercise
  correctAnswer: AnswerResponse['correct_answer']
}) {
  const solution = formatCorrectSolution(exercise, correctAnswer)

  if (solution.pairs && solution.pairs.length > 0) {
    return (
      <div>
        <p className="font-bold text-lq-text-secondary">Correct pairs</p>
        <ul className="mt-1 space-y-1" aria-label={solution.text}>
          {solution.pairs.map((pair) => (
            <li
              key={`${pair.left}-${pair.right}`}
              className="rounded-lq-sm bg-lq-bg-surface/70 px-2 py-1 text-lq-sm font-bold"
            >
              <span>{pair.left}</span>
              <span className="mx-1.5 text-lq-text-secondary" aria-hidden="true">
                →
              </span>
              <span className="sr-only"> matches </span>
              <span>{pair.right}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <p>
      <span className="font-bold text-lq-text-secondary">Correct answer: </span>
      <span className="break-words font-bold">{solution.text}</span>
    </p>
  )
}

export function LessonFeedbackRegion({
  open,
  answerResult,
  answeredExercise,
  showHearts,
  canContinue,
  isCompleting,
  mutationError = null,
  onContinue,
}: LessonFeedbackRegionProps) {
  const continueRef = useRef<HTMLButtonElement>(null)
  const isCorrect = answerResult.is_correct
  const message = isCorrect
    ? correctFeedbackMessage(answeredExercise.id)
    : incorrectFeedbackMessage(answeredExercise.id)

  const heartsLabel =
    showHearts
      ? `${answerResult.hearts_remaining} of ${answerResult.max_hearts} hearts remaining`
      : undefined

  const announcement = isCorrect
    ? `${message}. ${heartsLabel ?? ''}`.trim()
    : `${message}. Correct answer: ${formatCorrectSolution(answeredExercise, answerResult.correct_answer).text}. ${heartsLabel ?? ''}`.trim()

  useEffect(() => {
    if (!open || !canContinue || isCompleting) return
    const timer = window.setTimeout(() => {
      continueRef.current?.focus()
    }, 40)
    return () => window.clearTimeout(timer)
  }, [open, canContinue, isCompleting, answeredExercise.id])

  useEffect(() => {
    if (!open || !canContinue) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Enter') return
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'TEXTAREA' ||
          target.tagName === 'INPUT' ||
          target.isContentEditable)
      ) {
        return
      }
      event.preventDefault()
      onContinue()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, canContinue, onContinue])

  return (
    <div className="fixed inset-x-0 bottom-0 z-[var(--lq-z-feedback)]">
      <FeedbackSurface
        open={open}
        variant={isCorrect ? 'correct' : 'incorrect'}
        message={message}
        announcement={announcement}
        heartsLabel={heartsLabel}
        solution={
          isCorrect ? undefined : (
            <SolutionBody
              exercise={answeredExercise}
              correctAnswer={answerResult.correct_answer}
            />
          )
        }
      >
        <div className="sticky bottom-0 mx-auto mt-4 max-w-lq-narrow space-y-2 bg-inherit px-0 pb-1 pt-1">
          {mutationError ? (
            <p className="text-lq-sm font-bold text-lq-text-error" role="alert">
              {mutationError}
            </p>
          ) : null}
          <Button3D
            ref={continueRef}
            variant={isCorrect ? 'success' : 'primary'}
            className="w-full"
            onClick={onContinue}
            disabled={!canContinue || isCompleting}
            loading={isCompleting}
            aria-keyshortcuts="Enter"
          >
            {isCompleting
              ? 'Finishing…'
              : answerResult.can_complete
                ? 'Finish lesson'
                : 'Continue'}
          </Button3D>
        </div>
      </FeedbackSurface>
    </div>
  )
}
