/**
 * Pure lesson session reducer — no side effects.
 */

import type { FailureReason } from '@/lib/contracts/common'
import type { PublicExercise } from '@/lib/contracts/exercises'
import type {
  AnswerResponse,
  LessonAttemptResponse,
  TerminalSummary,
} from '@/lib/contracts/lesson'

import type {
  CompletedData,
  LessonSessionContext,
  LessonSessionEvent,
  LessonSessionState,
  RetrievedCompletedPayload,
} from './session-types'

const DEV = process.env.NODE_ENV !== 'production'

function warnInvalidTransition(
  state: LessonSessionState['status'],
  event: LessonSessionEvent['type'],
): void {
  if (DEV) {
    console.warn(`[lesson-session] Ignored ${event} in ${state}`)
  }
}

export function getExerciseAtIndex(
  attempt: LessonAttemptResponse,
  index: number,
): PublicExercise | null {
  if (index < 0 || index >= attempt.exercises.length) {
    return null
  }
  return attempt.exercises[index] ?? null
}

export function buildSessionContext(
  attempt: LessonAttemptResponse,
): LessonSessionContext | null {
  const currentExercise = getExerciseAtIndex(attempt, attempt.current_index)
  if (currentExercise === null) {
    return null
  }

  return {
    attemptId: attempt.attempt_id,
    attempt,
    currentExercise,
    displayHearts: attempt.hearts,
    maxHearts: attempt.max_hearts,
  }
}

function failureReasonFromAttempt(
  attempt: LessonAttemptResponse,
): FailureReason {
  const summary = attempt.terminal_summary
  if (summary?.outcome === 'failed' && summary.failure_reason) {
    return summary.failure_reason
  }
  return 'out_of_hearts'
}

function completedDataFromAttempt(
  attempt: LessonAttemptResponse,
): CompletedData | null {
  const summary = attempt.terminal_summary
  if (attempt.status !== 'completed' || summary?.outcome !== 'completed') {
    return null
  }
  const retrieved: RetrievedCompletedPayload = {
    source: 'retrieved',
    summary: summary as Extract<TerminalSummary, { outcome: 'completed' }>,
  }
  return retrieved
}

function applyAnswerToAttempt(
  attempt: LessonAttemptResponse,
  result: AnswerResponse,
): LessonAttemptResponse {
  return {
    ...attempt,
    status: result.lesson_status,
    current_index: result.current_index,
    hearts: result.hearts_remaining,
    max_hearts: result.max_hearts,
    next_heart_at: result.next_heart_at,
    mistakes_count: result.mistakes_count,
  }
}

function contextFromFeedback(
  state: Extract<LessonSessionState, { status: 'feedback' }>,
): LessonSessionContext | null {
  const updatedAttempt = applyAnswerToAttempt(state.attempt, state.answerResult)
  return buildSessionContext(updatedAttempt)
}

export function createInitialLessonSessionState(
  attemptId: number,
): LessonSessionState {
  return { status: 'loading', attemptId }
}

export function lessonSessionReducer(
  state: LessonSessionState,
  event: LessonSessionEvent,
): LessonSessionState {
  switch (event.type) {
    case 'LOAD':
      return { status: 'loading', attemptId: event.attemptId }

    case 'LOAD_SUCCESS': {
      const { attempt } = event

      if (attempt.status === 'completed') {
        const completed = completedDataFromAttempt(attempt)
        const base = buildSessionContext({
          ...attempt,
          current_index: Math.max(0, attempt.total_exercises - 1),
        })
        if (completed === null || base === null) {
          return {
            status: 'error',
            attemptId: attempt.attempt_id,
            error: {
              status: 0,
              code: 'MALFORMED_ATTEMPT',
              message: 'Completed attempt is missing summary data.',
            },
            recoverable: true,
          }
        }
        const { currentExercise: _ignored, ...rest } = base
        return { status: 'completed', completed, ...rest }
      }

      if (attempt.status === 'failed') {
        const base = buildSessionContext(attempt) ?? {
          attemptId: attempt.attempt_id,
          attempt,
          currentExercise: attempt.exercises[0]!,
          displayHearts: attempt.hearts,
          maxHearts: attempt.max_hearts,
        }
        const { currentExercise: _ignored, ...rest } = base
        return {
          status: 'failed',
          failureReason: failureReasonFromAttempt(attempt),
          ...rest,
        }
      }

      const context = buildSessionContext(attempt)
      if (context === null) {
        return {
          status: 'error',
          attemptId: attempt.attempt_id,
          error: {
            status: 0,
            code: 'MALFORMED_ATTEMPT',
            message: 'Lesson attempt has no exercise at the current index.',
          },
          recoverable: true,
        }
      }
      return { status: 'ready', ...context }
    }

    case 'LOAD_FAILURE':
      return {
        status: 'error',
        attemptId: event.attemptId,
        error: event.error,
        recoverable: event.recoverable,
      }

    case 'SUBMIT_ANSWER': {
      if (state.status !== 'ready') {
        warnInvalidTransition(state.status, event.type)
        return state
      }
      return {
        ...state,
        status: 'submitting',
        pendingAnswer: event.payload,
      }
    }

    case 'ANSWER_SUCCESS': {
      if (state.status !== 'submitting') {
        warnInvalidTransition(state.status, event.type)
        return state
      }

      const {
        pendingAnswer: _pending,
        currentExercise,
        status: _submitting,
        ...rest
      } = state
      const updatedAttempt = applyAnswerToAttempt(state.attempt, event.result)

      if (event.result.lesson_status === 'failed') {
        return {
          ...rest,
          status: 'failed',
          attempt: updatedAttempt,
          failureReason: 'out_of_hearts',
          displayHearts: event.result.hearts_remaining,
          maxHearts: event.result.max_hearts,
          attemptId: updatedAttempt.attempt_id,
        }
      }

      return {
        ...rest,
        status: 'feedback',
        attempt: updatedAttempt,
        answerResult: event.result,
        answeredExercise: currentExercise,
        displayHearts: event.result.hearts_remaining,
        maxHearts: event.result.max_hearts,
      }
    }

    case 'ANSWER_FAILURE': {
      if (state.status !== 'submitting') {
        warnInvalidTransition(state.status, event.type)
        return state
      }
      const { pendingAnswer: _pending, status: _submitting, ...readyState } = state
      return { ...readyState, status: 'ready' }
    }

    case 'CONTINUE': {
      if (state.status !== 'feedback') {
        warnInvalidTransition(state.status, event.type)
        return state
      }

      if (state.answerResult.lesson_status === 'failed') {
        warnInvalidTransition(state.status, event.type)
        return state
      }

      if (state.answerResult.can_complete) {
        const {
          answerResult,
          answeredExercise,
          status: _feedback,
          ...rest
        } = state
        return {
          ...rest,
          status: 'completing',
          resumeFeedback: { answerResult, answeredExercise },
        }
      }

      const nextContext = contextFromFeedback(state)
      if (nextContext === null) {
        return {
          status: 'error',
          attemptId: state.attemptId,
          error: {
            status: 0,
            code: 'MALFORMED_ATTEMPT',
            message: 'Unable to advance to the next exercise.',
          },
          recoverable: false,
        }
      }
      return { status: 'ready', ...nextContext }
    }

    case 'BEGIN_COMPLETION': {
      if (state.status !== 'feedback') {
        warnInvalidTransition(state.status, event.type)
        return state
      }
      if (!state.answerResult.can_complete) {
        warnInvalidTransition(state.status, event.type)
        return state
      }
      const {
        answerResult,
        answeredExercise,
        status: _feedback,
        ...rest
      } = state
      return {
        ...rest,
        status: 'completing',
        resumeFeedback: { answerResult, answeredExercise },
      }
    }

    case 'COMPLETION_SUCCESS': {
      if (state.status !== 'completing') {
        warnInvalidTransition(state.status, event.type)
        return state
      }
      const {
        resumeFeedback: _resume,
        status: _completing,
        ...rest
      } = state as Extract<LessonSessionState, { status: 'completing' }>
      return {
        ...rest,
        status: 'completed',
        completed: { source: 'fresh', completion: event.completion },
        attempt: {
          ...state.attempt,
          status: 'completed',
        },
      }
    }

    case 'COMPLETION_FAILURE': {
      if (state.status !== 'completing') {
        warnInvalidTransition(state.status, event.type)
        return state
      }
      const {
        resumeFeedback,
        status: _completing,
        ...rest
      } = state
      return {
        ...rest,
        status: 'feedback',
        answerResult: resumeFeedback.answerResult,
        answeredExercise: resumeFeedback.answeredExercise,
      }
    }

    case 'RETRY_READ':
      if (state.status !== 'error' || !state.recoverable) {
        warnInvalidTransition(state.status, event.type)
        return state
      }
      return { status: 'loading', attemptId: state.attemptId }

    case 'DISMISS_ERROR':
      if (state.status !== 'error') {
        warnInvalidTransition(state.status, event.type)
        return state
      }
      return state

    default:
      return state
  }
}

export function selectCanSubmit(state: LessonSessionState): boolean {
  return state.status === 'ready'
}

export function selectCanContinue(state: LessonSessionState): boolean {
  return state.status === 'feedback'
}

export function selectIsTerminal(state: LessonSessionState): boolean {
  return (
    state.status === 'completed' ||
    state.status === 'failed' ||
    (state.status === 'error' && !state.recoverable)
  )
}

export function selectProgressValues(state: LessonSessionState): {
  current: number
  total: number
} | null {
  switch (state.status) {
    case 'ready':
    case 'submitting':
      return {
        current: state.attempt.current_index + 1,
        total: state.attempt.total_exercises,
      }
    case 'feedback':
      return {
        current: Math.min(
          state.answerResult.current_index + 1,
          state.attempt.total_exercises,
        ),
        total: state.attempt.total_exercises,
      }
    case 'completing':
    case 'completed':
    case 'failed':
      return {
        current: state.attempt.total_exercises,
        total: state.attempt.total_exercises,
      }
    default:
      return null
  }
}

export function selectDisplayHearts(state: LessonSessionState): {
  hearts: number
  maxHearts: number
} | null {
  switch (state.status) {
    case 'ready':
    case 'submitting':
      return { hearts: state.displayHearts, maxHearts: state.maxHearts }
    case 'feedback':
    case 'completing':
    case 'completed':
    case 'failed':
      return { hearts: state.displayHearts, maxHearts: state.maxHearts }
    default:
      return null
  }
}
