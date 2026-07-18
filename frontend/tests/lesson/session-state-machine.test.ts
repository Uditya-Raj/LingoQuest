import { describe, expect, it } from 'vitest'

import {
  createInitialLessonSessionState,
  lessonSessionReducer,
  selectCanContinue,
  selectCanSubmit,
  selectDisplayHearts,
  selectProgressValues,
} from '@/lib/lesson/session-state-machine'
import type { LessonSessionEvent } from '@/lib/lesson/session-types'
import {
  mockAnswerResponse,
  mockCompletedAttempt,
  mockCompletionResponse,
  mockFailedAttempt,
  mockFinalAnswerResponse,
  mockLessonAttempt,
} from '@/tests/fixtures/phase10a'

function reduceEvents(
  attemptId: number,
  events: LessonSessionEvent[],
) {
  return events.reduce(
    lessonSessionReducer,
    createInitialLessonSessionState(attemptId),
  )
}

describe('lessonSessionReducer', () => {
  it('transitions loading → ready on load success', () => {
    const attempt = mockLessonAttempt()
    const state = reduceEvents(9001, [
      { type: 'LOAD', attemptId: 9001 },
      { type: 'LOAD_SUCCESS', attempt },
    ])

    expect(state.status).toBe('ready')
    if (state.status === 'ready') {
      expect(state.currentExercise.id).toBe(501)
      expect(state.displayHearts).toBe(4)
    }
  })

  it('transitions loading → error on load failure', () => {
    const state = reduceEvents(42, [
      { type: 'LOAD', attemptId: 42 },
      {
        type: 'LOAD_FAILURE',
        attemptId: 42,
        recoverable: true,
        error: { status: 404, code: 'ATTEMPT_NOT_FOUND', message: 'Not found' },
      },
    ])

    expect(state.status).toBe('error')
    if (state.status === 'error') {
      expect(state.recoverable).toBe(true)
    }
  })

  it('transitions ready → submitting → feedback', () => {
    const attempt = mockLessonAttempt()
    const answer = mockAnswerResponse()
    const payload = {
      exercise_id: 501,
      position: 0,
      answer: { option_id: 'a' } as const,
    }

    const state = reduceEvents(9001, [
      { type: 'LOAD', attemptId: 9001 },
      { type: 'LOAD_SUCCESS', attempt },
      { type: 'SUBMIT_ANSWER', payload },
      { type: 'ANSWER_SUCCESS', result: answer },
    ])

    expect(state.status).toBe('feedback')
    if (state.status === 'feedback') {
      expect(state.answerResult.is_correct).toBe(true)
      expect(state.displayHearts).toBe(4)
    }
  })

  it('transitions submitting → failed when lesson_status is failed', () => {
    const attempt = mockLessonAttempt()
    const state = reduceEvents(9001, [
      { type: 'LOAD', attemptId: 9001 },
      { type: 'LOAD_SUCCESS', attempt },
      {
        type: 'SUBMIT_ANSWER',
        payload: { exercise_id: 501, position: 0, answer: { option_id: 'b' } },
      },
      {
        type: 'ANSWER_SUCCESS',
        result: mockAnswerResponse({
          is_correct: false,
          hearts_remaining: 0,
          lesson_status: 'failed',
        }),
      },
    ])

    expect(state.status).toBe('failed')
    if (state.status === 'failed') {
      expect(state.failureReason).toBe('out_of_hearts')
      expect(state.displayHearts).toBe(0)
    }
  })

  it('returns to ready after answer failure', () => {
    const attempt = mockLessonAttempt()
    const state = reduceEvents(9001, [
      { type: 'LOAD', attemptId: 9001 },
      { type: 'LOAD_SUCCESS', attempt },
      {
        type: 'SUBMIT_ANSWER',
        payload: { exercise_id: 501, position: 0, answer: { option_id: 'a' } },
      },
      {
        type: 'ANSWER_FAILURE',
        error: { status: 409, code: 'CONFLICT', message: 'Rejected' },
      },
    ])

    expect(state.status).toBe('ready')
  })

  it('advances feedback → ready with updated index', () => {
    const attempt = mockLessonAttempt()
    const state = reduceEvents(9001, [
      { type: 'LOAD', attemptId: 9001 },
      { type: 'LOAD_SUCCESS', attempt },
      {
        type: 'SUBMIT_ANSWER',
        payload: { exercise_id: 501, position: 0, answer: { option_id: 'a' } },
      },
      { type: 'ANSWER_SUCCESS', result: mockAnswerResponse() },
      { type: 'CONTINUE' },
    ])

    expect(state.status).toBe('ready')
    if (state.status === 'ready') {
      expect(state.attempt.current_index).toBe(1)
      expect(state.currentExercise.id).toBe(502)
      expect(state).not.toHaveProperty('answerResult')
    }
  })

  it('moves final feedback → completing on continue', () => {
    const attempt = mockLessonAttempt({ current_index: 1 })
    const state = reduceEvents(9001, [
      { type: 'LOAD', attemptId: 9001 },
      { type: 'LOAD_SUCCESS', attempt },
      {
        type: 'SUBMIT_ANSWER',
        payload: { exercise_id: 502, position: 1, answer: { text: 'días' } },
      },
      { type: 'ANSWER_SUCCESS', result: mockFinalAnswerResponse() },
      { type: 'CONTINUE' },
    ])

    expect(state.status).toBe('completing')
  })

  it('transitions completing → completed', () => {
    const attempt = mockLessonAttempt({ current_index: 1 })
    const completion = mockCompletionResponse()
    const state = reduceEvents(9001, [
      { type: 'LOAD', attemptId: 9001 },
      { type: 'LOAD_SUCCESS', attempt },
      {
        type: 'SUBMIT_ANSWER',
        payload: { exercise_id: 502, position: 1, answer: { text: 'días' } },
      },
      { type: 'ANSWER_SUCCESS', result: mockFinalAnswerResponse() },
      { type: 'CONTINUE' },
      { type: 'COMPLETION_SUCCESS', completion },
    ])

    expect(state.status).toBe('completed')
    if (state.status === 'completed') {
      expect(state.completed.source).toBe('fresh')
      if (state.completed.source === 'fresh') {
        expect(state.completed.completion.xp.earned).toBe(15)
      }
    }
  })

  it('returns to feedback after completion failure', () => {
    const attempt = mockLessonAttempt({ current_index: 1 })
    const finalAnswer = mockFinalAnswerResponse()
    const state = reduceEvents(9001, [
      { type: 'LOAD', attemptId: 9001 },
      { type: 'LOAD_SUCCESS', attempt },
      {
        type: 'SUBMIT_ANSWER',
        payload: { exercise_id: 502, position: 1, answer: { text: 'días' } },
      },
      { type: 'ANSWER_SUCCESS', result: finalAnswer },
      { type: 'CONTINUE' },
      {
        type: 'COMPLETION_FAILURE',
        error: { status: 409, code: 'ALREADY_COMPLETED', message: 'Done' },
      },
    ])

    expect(state.status).toBe('feedback')
    if (state.status === 'feedback') {
      expect(state.answerResult.can_complete).toBe(true)
    }
  })

  it('ignores duplicate submit while submitting', () => {
    const attempt = mockLessonAttempt()
    let state = reduceEvents(9001, [
      { type: 'LOAD', attemptId: 9001 },
      { type: 'LOAD_SUCCESS', attempt },
      {
        type: 'SUBMIT_ANSWER',
        payload: { exercise_id: 501, position: 0, answer: { option_id: 'a' } },
      },
    ])
    expect(state.status).toBe('submitting')

    state = lessonSessionReducer(state, {
      type: 'SUBMIT_ANSWER',
      payload: { exercise_id: 501, position: 0, answer: { option_id: 'b' } },
    })
    expect(state.status).toBe('submitting')
  })

  it('ignores duplicate continue in ready state', () => {
    const attempt = mockLessonAttempt()
    let state = reduceEvents(9001, [
      { type: 'LOAD', attemptId: 9001 },
      { type: 'LOAD_SUCCESS', attempt },
    ])
    state = lessonSessionReducer(state, { type: 'CONTINUE' })
    expect(state.status).toBe('ready')
  })

  it('prevents completion from failed state', () => {
    const attempt = mockFailedAttempt()
    const state = reduceEvents(9001, [
      { type: 'LOAD', attemptId: 9001 },
      { type: 'LOAD_SUCCESS', attempt },
      { type: 'BEGIN_COMPLETION' },
    ])
    expect(state.status).toBe('failed')
  })

  it('loads terminal completed attempts into completed state', () => {
    const attempt = mockCompletedAttempt()
    const state = reduceEvents(9001, [
      { type: 'LOAD', attemptId: 9001 },
      { type: 'LOAD_SUCCESS', attempt },
    ])
    expect(state.status).toBe('completed')
  })

  it('loads terminal failed attempts into failed state', () => {
    const attempt = mockFailedAttempt()
    const state = reduceEvents(9001, [
      { type: 'LOAD', attemptId: 9001 },
      { type: 'LOAD_SUCCESS', attempt },
    ])
    expect(state.status).toBe('failed')
  })

  it('clears answer feedback when advancing', () => {
    const attempt = mockLessonAttempt()
    const state = reduceEvents(9001, [
      { type: 'LOAD', attemptId: 9001 },
      { type: 'LOAD_SUCCESS', attempt },
      {
        type: 'SUBMIT_ANSWER',
        payload: { exercise_id: 501, position: 0, answer: { option_id: 'a' } },
      },
      { type: 'ANSWER_SUCCESS', result: mockAnswerResponse() },
      { type: 'CONTINUE' },
    ])

    expect(state.status).toBe('ready')
    expect(state).not.toHaveProperty('answerResult')
  })

  it('exposes derived selectors', () => {
    const attempt = mockLessonAttempt()
    const ready = reduceEvents(9001, [
      { type: 'LOAD', attemptId: 9001 },
      { type: 'LOAD_SUCCESS', attempt },
    ])

    expect(selectCanSubmit(ready)).toBe(true)
    expect(selectCanContinue(ready)).toBe(false)
    expect(selectProgressValues(ready)).toEqual({ current: 1, total: 2 })
    expect(selectDisplayHearts(ready)).toEqual({ hearts: 4, maxHearts: 5 })
  })
})
