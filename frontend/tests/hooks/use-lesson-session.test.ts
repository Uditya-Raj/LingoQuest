import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

import { useLessonSession } from '@/hooks/use-lesson-session'
import { ApiError } from '@/lib/api/client'
import {
  mockAnswerResponse,
  mockCompletionResponse,
  mockFinalAnswerResponse,
  mockLessonAttempt,
  mockTimedAttempt,
  exerciseMc,
} from '@/tests/fixtures/phase10a'
import { useSessionStore } from '@/stores/session-store'

const getAttemptMock = vi.fn()
const submitAnswerMock = vi.fn()
const completeLessonMock = vi.fn()
const startLessonMock = vi.fn()

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    getAttempt: (...args: unknown[]) => getAttemptMock(...args),
    submitAnswer: (...args: unknown[]) => submitAnswerMock(...args),
    completeLesson: (...args: unknown[]) => completeLessonMock(...args),
    startLesson: (...args: unknown[]) => startLessonMock(...args),
  }
})

describe('useLessonSession', () => {
  beforeEach(() => {
    getAttemptMock.mockReset()
    submitAnswerMock.mockReset()
    completeLessonMock.mockReset()
    startLessonMock.mockReset()
    useSessionStore.getState().reset()
  })

  it('retrieves attempt on route load without calling start', async () => {
    const attempt = mockLessonAttempt({ current_index: 1 })
    getAttemptMock.mockResolvedValue(attempt)

    const { result } = renderHook(() => useLessonSession({ attemptId: 9001 }))

    await waitFor(() => {
      expect(result.current.state.status).toBe('ready')
    })

    expect(getAttemptMock).toHaveBeenCalledWith(9001, expect.any(AbortSignal))
    expect(startLessonMock).not.toHaveBeenCalled()
    if (result.current.state.status === 'ready') {
      expect(result.current.state.attempt.current_index).toBe(1)
    }
  })

  it('preserves backend exercise order and index on refresh', async () => {
    getAttemptMock.mockResolvedValue(
      mockLessonAttempt({
        current_index: 1,
        exercises: [exerciseMc, { ...exerciseMc, id: 502, position: 1 }],
      }),
    )

    const { result } = renderHook(() => useLessonSession({ attemptId: 9001 }))
    await waitFor(() => expect(result.current.state.status).toBe('ready'))

    if (result.current.state.status === 'ready') {
      expect(result.current.state.currentExercise.id).toBe(502)
      expect(result.current.progress).toEqual({ current: 2, total: 2 })
    }
  })

  it('aborts stale read responses', async () => {
    let resolveFirst: (value: unknown) => void = () => {}
    getAttemptMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve
          }),
      )
      .mockResolvedValueOnce(mockLessonAttempt({ attempt_id: 2 }))

    const { result, rerender } = renderHook(
      ({ id }) => useLessonSession({ attemptId: id }),
      { initialProps: { id: 1 } },
    )

    rerender({ id: 2 })
    await act(async () => {
      resolveFirst(mockLessonAttempt({ attempt_id: 1, skill_title: 'Stale' }))
    })

    await waitFor(() => {
      expect(result.current.state.status).toBe('ready')
    })

    if (result.current.state.status === 'ready') {
      expect(result.current.state.attempt.attempt_id).toBe(2)
    }
  })

  it('forwards typed answer payloads and applies backend hearts', async () => {
    getAttemptMock.mockResolvedValue(mockLessonAttempt())
    submitAnswerMock.mockResolvedValue(
      mockAnswerResponse({ hearts_remaining: 3, is_correct: false }),
    )

    const { result } = renderHook(() => useLessonSession({ attemptId: 9001 }))
    await waitFor(() => expect(result.current.state.status).toBe('ready'))

    const payload = {
      exercise_id: exerciseMc.id,
      position: 0,
      answer: { option_id: 'b' } as const,
    }

    await act(async () => {
      result.current.submitCurrentAnswer(payload)
    })

    await waitFor(() => expect(result.current.state.status).toBe('feedback'))
    expect(submitAnswerMock).toHaveBeenCalledWith(9001, payload, expect.any(AbortSignal))
    expect(result.current.hearts).toEqual({ hearts: 3, maxHearts: 5 })
  })

  it('prevents duplicate answer submissions while pending', async () => {
    getAttemptMock.mockResolvedValue(mockLessonAttempt())
    let resolveAnswer: (value: unknown) => void = () => {}
    submitAnswerMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAnswer = resolve
        }),
    )

    const { result } = renderHook(() => useLessonSession({ attemptId: 9001 }))
    await waitFor(() => expect(result.current.state.status).toBe('ready'))

    const payload = {
      exercise_id: exerciseMc.id,
      position: 0,
      answer: { option_id: 'a' } as const,
    }

    act(() => {
      result.current.submitCurrentAnswer(payload)
      result.current.submitCurrentAnswer(payload)
    })

    expect(submitAnswerMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveAnswer(mockAnswerResponse())
    })
  })

  it('transitions to failed without completion when hearts reach zero', async () => {
    getAttemptMock.mockResolvedValue(mockLessonAttempt())
    submitAnswerMock.mockResolvedValue(
      mockAnswerResponse({
        is_correct: false,
        hearts_remaining: 0,
        lesson_status: 'failed',
      }),
    )

    const { result } = renderHook(() => useLessonSession({ attemptId: 9001 }))
    await waitFor(() => expect(result.current.state.status).toBe('ready'))

    await act(async () => {
      result.current.submitCurrentAnswer({
        exercise_id: exerciseMc.id,
        position: 0,
        answer: { option_id: 'b' },
      })
    })

    await waitFor(() => expect(result.current.state.status).toBe('failed'))
    expect(completeLessonMock).not.toHaveBeenCalled()
  })

  it('completes once after final continue', async () => {
    const attempt = mockLessonAttempt({ current_index: 1 })
    getAttemptMock.mockResolvedValue(attempt)
    submitAnswerMock.mockResolvedValue(mockFinalAnswerResponse())
    completeLessonMock.mockResolvedValue(mockCompletionResponse())

    const { result } = renderHook(() => useLessonSession({ attemptId: 9001 }))
    await waitFor(() => expect(result.current.state.status).toBe('ready'))

    await act(async () => {
      result.current.submitCurrentAnswer({
        exercise_id: 502,
        position: 1,
        answer: { text: 'días' },
      })
    })
    await waitFor(() => expect(result.current.state.status).toBe('feedback'))

    await act(async () => {
      result.current.continueLesson()
      result.current.continueLesson()
    })

    await waitFor(() => expect(result.current.state.status).toBe('completed'))
    expect(completeLessonMock).toHaveBeenCalledTimes(1)
    if (result.current.state.status === 'completed' && result.current.state.completed.source === 'fresh') {
      expect(result.current.state.completed.completion.xp.earned).toBe(15)
    }
  })

  it('does not auto-retry mutation failures', async () => {
    getAttemptMock.mockResolvedValue(mockLessonAttempt())
    submitAnswerMock.mockRejectedValue(
      new ApiError(409, 'OUT_OF_ORDER', 'Wrong exercise order'),
    )

    const { result } = renderHook(() => useLessonSession({ attemptId: 9001 }))
    await waitFor(() => expect(result.current.state.status).toBe('ready'))

    await act(async () => {
      result.current.submitCurrentAnswer({
        exercise_id: exerciseMc.id,
        position: 0,
        answer: { option_id: 'a' },
      })
    })

    await waitFor(() => expect(result.current.state.status).toBe('ready'))
    expect(submitAnswerMock).toHaveBeenCalledTimes(1)
    expect(result.current.mutationError?.code).toBe('OUT_OF_ORDER')
  })

  it('recognizes timed attempts without local expiry failure', async () => {
    getAttemptMock.mockResolvedValue(
      mockTimedAttempt({ remaining_seconds: 45, expires_at: '2026-07-19T13:00:00Z' }),
    )

    const { result } = renderHook(() => useLessonSession({ attemptId: 9100 }))
    await waitFor(() => expect(result.current.state.status).toBe('ready'))

    if (result.current.state.status === 'ready') {
      expect(result.current.state.attempt.mode).toBe('timed')
      expect(result.current.state.attempt.remaining_seconds).toBe(45)
    }
    expect(result.current.state.status).not.toBe('failed')
  })

  it('does not update state after unmount', async () => {
    let resolveAttempt: (value: unknown) => void = () => {}
    getAttemptMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAttempt = resolve
        }),
    )

    const { unmount } = renderHook(() => useLessonSession({ attemptId: 9001 }))
    unmount()

    await act(async () => {
      resolveAttempt(mockLessonAttempt())
    })

    expect(useSessionStore.getState().attempt).toBeNull()
  })

  it('handles not-found attempts as non-recoverable error', async () => {
    getAttemptMock.mockRejectedValue(
      new ApiError(404, 'ATTEMPT_NOT_FOUND', 'Attempt not found'),
    )

    const { result } = renderHook(() => useLessonSession({ attemptId: 999 }))
    await waitFor(() => expect(result.current.state.status).toBe('error'))

    if (result.current.state.status === 'error') {
      expect(result.current.state.recoverable).toBe(false)
    }
  })
})

describe('useLessonSession journey', () => {
  beforeEach(() => {
    getAttemptMock.mockReset()
    submitAnswerMock.mockReset()
    completeLessonMock.mockReset()
    useSessionStore.getState().reset()
  })

  it('runs retrieve → answer → continue → complete flow', async () => {
    getAttemptMock.mockResolvedValue(mockLessonAttempt({ current_index: 0 }))
    submitAnswerMock.mockResolvedValue(mockFinalAnswerResponse({ current_index: 2 }))
    completeLessonMock.mockResolvedValue(mockCompletionResponse())

    const { result } = renderHook(() => useLessonSession({ attemptId: 9001 }))
    await waitFor(() => expect(result.current.state.status).toBe('ready'))

    await act(async () => {
      result.current.submitCurrentAnswer({
        exercise_id: exerciseMc.id,
        position: 0,
        answer: { option_id: 'a' },
      })
    })
    await waitFor(() => expect(result.current.state.status).toBe('feedback'))

    await act(async () => {
      result.current.continueLesson()
    })
    await waitFor(() => expect(result.current.state.status).toBe('completed'))

    expect(getAttemptMock).toHaveBeenCalledTimes(1)
    expect(submitAnswerMock).toHaveBeenCalledTimes(1)
    expect(completeLessonMock).toHaveBeenCalledTimes(1)
  })
})
