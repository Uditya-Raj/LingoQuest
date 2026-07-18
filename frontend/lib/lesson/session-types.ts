/**
 * Lesson session state machine types — discriminated unions only.
 * No fetch, router, or wall-clock logic belongs here.
 */

import type { FailureReason } from '@/lib/contracts/common'
import type { PublicExercise } from '@/lib/contracts/exercises'
import type {
  AnswerResponse,
  AnswerSubmitPayload,
  CompletionResponse,
  LessonAttemptResponse,
  TerminalSummary,
} from '@/lib/contracts/lesson'

export interface SessionError {
  status: number
  code: string
  message: string
}

export interface CompletedPayload {
  source: 'fresh'
  completion: CompletionResponse
}

export interface RetrievedCompletedPayload {
  source: 'retrieved'
  summary: Extract<TerminalSummary, { outcome: 'completed' }>
}

export type CompletedData = CompletedPayload | RetrievedCompletedPayload

export interface LessonSessionContext {
  attemptId: number
  attempt: LessonAttemptResponse
  currentExercise: PublicExercise
  displayHearts: number
  maxHearts: number
}

export type LessonSessionState =
  | { status: 'loading'; attemptId: number }
  | ({ status: 'ready' } & LessonSessionContext)
  | ({
      status: 'submitting'
      pendingAnswer: AnswerSubmitPayload
    } & LessonSessionContext)
  | ({
      status: 'feedback'
      answerResult: AnswerResponse
      answeredExercise: PublicExercise
    } & Omit<LessonSessionContext, 'currentExercise'>)
  | ({
      status: 'completing'
      resumeFeedback: {
        answerResult: AnswerResponse
        answeredExercise: PublicExercise
      }
    } & Omit<LessonSessionContext, 'currentExercise'>)
  | ({
      status: 'completed'
      completed: CompletedData
    } & Omit<LessonSessionContext, 'currentExercise'>)
  | ({
      status: 'failed'
      failureReason: FailureReason
    } & Omit<LessonSessionContext, 'currentExercise'>)
  | {
      status: 'error'
      attemptId: number
      error: SessionError
      recoverable: boolean
    }

export type LessonSessionEvent =
  | { type: 'LOAD'; attemptId: number }
  | { type: 'LOAD_SUCCESS'; attempt: LessonAttemptResponse }
  | { type: 'LOAD_FAILURE'; attemptId: number; error: SessionError; recoverable: boolean }
  | { type: 'SUBMIT_ANSWER'; payload: AnswerSubmitPayload }
  | { type: 'ANSWER_SUCCESS'; result: AnswerResponse }
  | {
      type: 'ANSWER_FAILURE'
      error: SessionError
    }
  | {
      type: 'TIME_EXPIRED'
      /** Optional refreshed attempt after backend adjudication. */
      attempt?: LessonAttemptResponse
    }
  | { type: 'CONTINUE' }
  | { type: 'BEGIN_COMPLETION' }
  | { type: 'COMPLETION_SUCCESS'; completion: CompletionResponse }
  | { type: 'COMPLETION_FAILURE'; error: SessionError }
  | { type: 'RETRY_READ' }
  | { type: 'DISMISS_ERROR' }
