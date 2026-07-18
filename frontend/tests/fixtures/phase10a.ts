/**
 * Phase 10A lesson session fixtures for reducer and controller tests.
 */

import type { PublicExercise } from '@/lib/contracts/exercises'
import type {
  AnswerResponse,
  CompletionResponse,
  LessonAttemptResponse,
} from '@/lib/contracts/lesson'

export const exerciseMc: PublicExercise = {
  id: 501,
  position: 0,
  type: 'multiple_choice',
  prompt: 'Select hello',
  audio_url: null,
  tts_text: 'hola',
  tts_lang: 'es-ES',
  metadata: null,
  options: [
    { id: 'a', text: 'Hello' },
    { id: 'b', text: 'Goodbye' },
  ],
}

export const exerciseMc2: PublicExercise = {
  id: 502,
  position: 1,
  type: 'fill_blank',
  prompt: 'Buenos ___',
  audio_url: null,
  tts_text: null,
  tts_lang: null,
  metadata: null,
  options: null,
}

export function mockLessonAttempt(
  overrides: Partial<LessonAttemptResponse> = {},
): LessonAttemptResponse {
  return {
    attempt_id: 9001,
    skill_id: 3,
    lesson_id: 3,
    skill_title: 'Food',
    status: 'in_progress',
    mode: 'standard',
    expires_at: null,
    remaining_seconds: null,
    resumed: false,
    started_at: '2026-07-18T10:00:00Z',
    completed_at: null,
    current_index: 0,
    total_exercises: 2,
    hearts: 4,
    max_hearts: 5,
    next_heart_at: null,
    mistakes_count: 0,
    exercises: [exerciseMc, exerciseMc2],
    terminal_summary: null,
    ...overrides,
  }
}

export function mockAnswerResponse(
  overrides: Partial<AnswerResponse> = {},
): AnswerResponse {
  return {
    attempt_id: 9001,
    exercise_id: exerciseMc.id,
    position: 0,
    is_correct: true,
    correct_answer: { option_id: 'a' },
    current_index: 1,
    total_exercises: 2,
    mistakes_count: 0,
    hearts_remaining: 4,
    max_hearts: 5,
    next_heart_at: null,
    lesson_status: 'in_progress',
    can_complete: false,
    ...overrides,
  }
}

export function mockFinalAnswerResponse(
  overrides: Partial<AnswerResponse> = {},
): AnswerResponse {
  return mockAnswerResponse({
    exercise_id: exerciseMc2.id,
    position: 1,
    current_index: 2,
    can_complete: true,
    ...overrides,
  })
}

export function mockCompletionResponse(
  overrides: Partial<CompletionResponse> = {},
): CompletionResponse {
  return {
    attempt_id: 9001,
    skill: {
      id: 3,
      title: 'Food',
      new_crowns: 3,
      max_level: 5,
      status: 'in_progress',
    },
    xp: {
      base: 10,
      perfect_bonus: 5,
      earned: 15,
      perfect: true,
    },
    streak: {
      current: 7,
      longest: 11,
      extended_today: true,
      activity_date: '2026-07-19',
    },
    daily_goal: {
      today_xp: 25,
      goal_xp: 20,
      progress: 1,
      reached: true,
    },
    unlocked_skill_ids: [],
    achievements_unlocked: [],
    user_totals: {
      total_xp: 355,
      hearts: 4,
      max_hearts: 5,
      gems: 100,
    },
    completed_at: '2026-07-19T12:00:00Z',
    ...overrides,
  }
}

export function mockTimedAttempt(
  overrides: Partial<LessonAttemptResponse> = {},
): LessonAttemptResponse {
  return mockLessonAttempt({
    attempt_id: 9100,
    mode: 'timed',
    expires_at: '2026-07-19T13:00:00Z',
    remaining_seconds: 90,
    ...overrides,
  })
}

export function mockFailedAttempt(
  overrides: Partial<LessonAttemptResponse> = {},
): LessonAttemptResponse {
  return mockLessonAttempt({
    status: 'failed',
    hearts: 0,
    current_index: 1,
    terminal_summary: {
      outcome: 'failed',
      xp_earned: 0,
      perfect: false,
      failure_reason: 'out_of_hearts',
      completed_at: '2026-07-19T11:00:00Z',
    },
    ...overrides,
  })
}

export function mockCompletedAttempt(
  overrides: Partial<LessonAttemptResponse> = {},
): LessonAttemptResponse {
  return mockLessonAttempt({
    status: 'completed',
    current_index: 2,
    completed_at: '2026-07-19T11:30:00Z',
    terminal_summary: {
      outcome: 'completed',
      xp_earned: 15,
      perfect: true,
      completed_at: '2026-07-19T11:30:00Z',
    },
    ...overrides,
  })
}
