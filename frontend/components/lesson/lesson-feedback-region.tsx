'use client'

import { Button3D } from '@/components/ui/button-3d'
import { FeedbackSurface } from '@/components/ui/feedback-surface'
import { formatCorrectSolution } from '@/lib/lesson/format-solution'
import type { PublicExercise } from '@/lib/contracts/exercises'
import type { AnswerResponse } from '@/lib/contracts/lesson'

interface LessonFeedbackRegionProps {
  open: boolean
  answerResult: AnswerResponse
  answeredExercise: PublicExercise
  canContinue: boolean
  isCompleting: boolean
  onContinue: () => void
}

export function LessonFeedbackRegion({
  open,
  answerResult,
  answeredExercise,
  canContinue,
  isCompleting,
  onContinue,
}: LessonFeedbackRegionProps) {
  const solution = formatCorrectSolution(
    answeredExercise,
    answerResult.correct_answer,
  )

  return (
    <div className="fixed inset-x-0 bottom-0 z-[var(--lq-z-feedback)]">
      <FeedbackSurface
        open={open}
        variant={answerResult.is_correct ? 'correct' : 'incorrect'}
        message={answerResult.is_correct ? 'Correct!' : 'Incorrect'}
        solution={
          answerResult.is_correct ? undefined : `Correct answer: ${solution}`
        }
      >
        <div className="mx-auto mt-4 max-w-lq-narrow px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button3D
            variant={answerResult.is_correct ? 'success' : 'primary'}
            className="w-full"
            onClick={onContinue}
            disabled={!canContinue || isCompleting}
            loading={isCompleting}
            aria-keyshortcuts="Enter"
          >
            {answerResult.can_complete ? 'Complete lesson' : 'Continue'}
          </Button3D>
        </div>
      </FeedbackSurface>
    </div>
  )
}
