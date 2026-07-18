'use client'

/**
 * Lesson session controller — orchestrates API calls around the pure reducer.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'

import {
  createInitialLessonSessionState,
  lessonSessionReducer,
  selectCanContinue,
  selectCanSubmit,
  selectDisplayHearts,
  selectIsTerminal,
  selectProgressValues,
} from '@/lib/lesson/session-state-machine'
import type { LessonSessionState, SessionError } from '@/lib/lesson/session-types'
import {
  ApiError,
  completeLesson,
  getAttempt,
  submitAnswer,
} from '@/lib/api'
import type { AnswerSubmitPayload } from '@/lib/contracts/lesson'
import { useSessionStore } from '@/stores/session-store'

export interface UseLessonSessionOptions {
  attemptId: number
  enabled?: boolean
}

export interface UseLessonSessionResult {
  state: LessonSessionState
  progress: { current: number; total: number } | null
  hearts: { hearts: number; maxHearts: number } | null
  canSubmit: boolean
  canContinue: boolean
  isTerminal: boolean
  isSubmitting: boolean
  isCompleting: boolean
  mutationError: SessionError | null
  reload: () => void
  submitCurrentAnswer: (payload: AnswerSubmitPayload) => void
  continueLesson: () => void
  dismissMutationError: () => void
  retryRead: () => void
}

function toSessionError(err: ApiError): SessionError {
  return {
    status: err.status,
    code: err.code,
    message: err.message,
  }
}

export function useLessonSession({
  attemptId,
  enabled = true,
}: UseLessonSessionOptions): UseLessonSessionResult {
  const [state, dispatch] = useReducer(
    lessonSessionReducer,
    attemptId,
    createInitialLessonSessionState,
  )
  const [reloadToken, setReloadToken] = useState(0)
  const [mutationError, setMutationError] = useState<SessionError | null>(null)

  const setAttempt = useSessionStore((s) => s.setAttempt)
  const applyAnswerHearts = useSessionStore((s) => s.applyAnswerHearts)
  const setCompletion = useSessionStore((s) => s.setCompletion)

  const mountedRef = useRef(true)
  const readGenerationRef = useRef(0)
  const answerGenerationRef = useRef(0)
  const completionGenerationRef = useRef(0)
  const answerInFlightRef = useRef(false)
  const completionInFlightRef = useRef(false)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    if (state.status === 'ready' || state.status === 'feedback' || state.status === 'failed') {
      answerInFlightRef.current = false
    }
    if (state.status === 'completed' || state.status === 'feedback' || state.status === 'failed') {
      completionInFlightRef.current = false
    }
  }, [state.status])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const loadAttempt = useCallback(() => {
    if (!enabled) return

    const generation = readGenerationRef.current + 1
    readGenerationRef.current = generation
    const controller = new AbortController()

    dispatch({ type: 'LOAD', attemptId })

    void getAttempt(attemptId, controller.signal)
      .then((attempt) => {
        if (!mountedRef.current || controller.signal.aborted) return
        if (generation !== readGenerationRef.current) return
        setAttempt(attempt)
        dispatch({ type: 'LOAD_SUCCESS', attempt })
      })
      .catch((err: unknown) => {
        if (!mountedRef.current || controller.signal.aborted) return
        if (generation !== readGenerationRef.current) return

        if (err instanceof ApiError) {
          dispatch({
            type: 'LOAD_FAILURE',
            attemptId,
            recoverable: err.status !== 404,
            error: toSessionError(err),
          })
          return
        }

        dispatch({
          type: 'LOAD_FAILURE',
          attemptId,
          recoverable: true,
          error: {
            status: 0,
            code: 'NETWORK_ERROR',
            message: 'Unable to retrieve this lesson attempt.',
          },
        })
      })

    return () => controller.abort()
  }, [attemptId, enabled, setAttempt])

  useEffect(() => {
    const abort = loadAttempt()
    return abort
  }, [loadAttempt, reloadToken])

  const runCompletion = useCallback(() => {
    if (completionInFlightRef.current) return
    completionInFlightRef.current = true

    const generation = completionGenerationRef.current + 1
    completionGenerationRef.current = generation
    setMutationError(null)

    const controller = new AbortController()
    void completeLesson(attemptId, controller.signal)
      .then((completion) => {
        if (!mountedRef.current || controller.signal.aborted) return
        if (generation !== completionGenerationRef.current) return
        setCompletion(completion)
        dispatch({ type: 'COMPLETION_SUCCESS', completion })
      })
      .catch((err: unknown) => {
        if (!mountedRef.current || controller.signal.aborted) return
        if (generation !== completionGenerationRef.current) return

        if (err instanceof ApiError) {
          setMutationError(toSessionError(err))
        } else {
          setMutationError({
            status: 0,
            code: 'NETWORK_ERROR',
            message: 'Unable to complete this lesson.',
          })
        }
        dispatch({
          type: 'COMPLETION_FAILURE',
          error:
            err instanceof ApiError
              ? toSessionError(err)
              : {
                  status: 0,
                  code: 'NETWORK_ERROR',
                  message: 'Unable to complete this lesson.',
                },
        })
      })
  }, [attemptId, setCompletion])

  const submitCurrentAnswer = useCallback(
    (payload: AnswerSubmitPayload) => {
      if (answerInFlightRef.current || !selectCanSubmit(stateRef.current)) return

      answerInFlightRef.current = true
      const generation = answerGenerationRef.current + 1
      answerGenerationRef.current = generation
      setMutationError(null)
      dispatch({ type: 'SUBMIT_ANSWER', payload })

      const controller = new AbortController()
      void submitAnswer(attemptId, payload, controller.signal)
        .then((result) => {
          if (!mountedRef.current || controller.signal.aborted) return
          if (generation !== answerGenerationRef.current) return

          applyAnswerHearts({
            hearts_remaining: result.hearts_remaining,
            max_hearts: result.max_hearts,
            next_heart_at: result.next_heart_at,
          })
          dispatch({ type: 'ANSWER_SUCCESS', result })
        })
        .catch((err: unknown) => {
          if (!mountedRef.current || controller.signal.aborted) return
          if (generation !== answerGenerationRef.current) return

          if (err instanceof ApiError) {
            setMutationError(toSessionError(err))
          } else {
            setMutationError({
              status: 0,
              code: 'NETWORK_ERROR',
              message: 'Unable to submit your answer.',
            })
          }
          dispatch({
            type: 'ANSWER_FAILURE',
            error:
              err instanceof ApiError
                ? toSessionError(err)
                : {
                    status: 0,
                    code: 'NETWORK_ERROR',
                    message: 'Unable to submit your answer.',
                  },
          })
        })
    },
    [applyAnswerHearts, attemptId],
  )

  const continueLesson = useCallback(() => {
    if (!selectCanContinue(stateRef.current)) return

    const current = stateRef.current
    if (current.status === 'feedback' && current.answerResult.can_complete) {
      if (completionInFlightRef.current) return
      dispatch({ type: 'CONTINUE' })
      runCompletion()
      return
    }

    dispatch({ type: 'CONTINUE' })
  }, [runCompletion])

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1)
  }, [])

  const retryRead = useCallback(() => {
    dispatch({ type: 'RETRY_READ' })
    setReloadToken((token) => token + 1)
  }, [])

  const dismissMutationError = useCallback(() => {
    setMutationError(null)
  }, [])

  const progress = useMemo(() => selectProgressValues(state), [state])
  const hearts = useMemo(() => selectDisplayHearts(state), [state])
  const canSubmit = selectCanSubmit(state)
  const canContinue = selectCanContinue(state)
  const isTerminal = selectIsTerminal(state)

  return {
    state,
    progress,
    hearts,
    canSubmit,
    canContinue,
    isTerminal,
    isSubmitting: state.status === 'submitting',
    isCompleting: state.status === 'completing',
    mutationError,
    reload,
    submitCurrentAnswer,
    continueLesson,
    dismissMutationError,
    retryRead,
  }
}
