/**
 * Phase 10B exercise fixtures — all five public types, no correct_answer.
 */

import type { CorrectAnswer, PublicExercise } from '@/lib/contracts/exercises'
import type {
  AnswerResponse,
  CompletionResponse,
  LessonAttemptResponse,
} from '@/lib/contracts/lesson'

export const exerciseMultipleChoice: PublicExercise = {
  id: 601,
  position: 0,
  type: 'multiple_choice',
  prompt: '¿Cómo se dice “hello”?',
  audio_url: null,
  tts_text: 'hola',
  tts_lang: 'es-ES',
  metadata: null,
  options: [
    { id: 'opt_a', text: 'Hola' },
    { id: 'opt_b', text: 'Adiós' },
    { id: 'opt_c', text: 'Gracias' },
  ],
}

export const exerciseWordBank: PublicExercise = {
  id: 602,
  position: 1,
  type: 'translate_word_bank',
  prompt: 'Translate: I eat bread',
  audio_url: null,
  tts_text: null,
  tts_lang: null,
  metadata: null,
  options: [
    { id: 'w1', text: 'Yo' },
    { id: 'w2', text: 'como' },
    { id: 'w3', text: 'pan' },
    { id: 'w4', text: 'agua' },
    { id: 'w5', text: 'como' },
  ],
}

export const exerciseMatchPairs: PublicExercise = {
  id: 603,
  position: 2,
  type: 'match_pairs',
  prompt: 'Match the pairs',
  audio_url: null,
  tts_text: null,
  tts_lang: null,
  metadata: null,
  options: {
    left: [
      { id: 'l1', text: 'el pan' },
      { id: 'l2', text: 'la leche' },
    ],
    right: [
      { id: 'r1', text: 'bread' },
      { id: 'r2', text: 'milk' },
    ],
  },
}

export const exerciseFillBlank: PublicExercise = {
  id: 604,
  position: 3,
  type: 'fill_blank',
  prompt: 'Buenos ___',
  audio_url: null,
  tts_text: null,
  tts_lang: null,
  metadata: null,
  options: null,
}

export const exerciseTypeAnswer: PublicExercise = {
  id: 605,
  position: 4,
  type: 'type_answer',
  prompt: 'Type “thank you” in English',
  audio_url: null,
  tts_text: null,
  tts_lang: null,
  metadata: null,
  options: null,
}

export const allFiveExercises: PublicExercise[] = [
  exerciseMultipleChoice,
  exerciseWordBank,
  exerciseMatchPairs,
  exerciseFillBlank,
  exerciseTypeAnswer,
]

export function mockFiveTypeAttempt(
  overrides: Partial<LessonAttemptResponse> = {},
): LessonAttemptResponse {
  return {
    attempt_id: 9200,
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
    total_exercises: 5,
    hearts: 5,
    max_hearts: 5,
    next_heart_at: null,
    mistakes_count: 0,
    exercises: allFiveExercises,
    terminal_summary: null,
    ...overrides,
  }
}

export function mockAnswerForExercise(
  exercise: PublicExercise,
  overrides: Partial<AnswerResponse> = {},
): AnswerResponse {
  const nextIndex = exercise.position + 1
  const canComplete = nextIndex >= allFiveExercises.length

  const correctByType: Record<PublicExercise['type'], CorrectAnswer> = {
    multiple_choice: { option_id: 'opt_a' },
    translate_word_bank: { ordered_ids: ['w1', 'w2', 'w3'] },
    match_pairs: {
      pairs: [
        { left_id: 'l1', right_id: 'r1' },
        { left_id: 'l2', right_id: 'r2' },
      ],
    },
    fill_blank: { text: 'días' },
    type_answer: { accepted: ['Thank you', 'thanks'] },
  }

  return {
    attempt_id: 9200,
    exercise_id: exercise.id,
    position: exercise.position,
    is_correct: true,
    correct_answer: correctByType[exercise.type],
    current_index: nextIndex,
    total_exercises: 5,
    mistakes_count: 0,
    hearts_remaining: 5,
    max_hearts: 5,
    next_heart_at: null,
    lesson_status: canComplete ? 'in_progress' : 'in_progress',
    can_complete: canComplete,
    ...overrides,
  }
}

export function mockJourneyCompletion(): CompletionResponse {
  return {
    attempt_id: 9200,
    skill: {
      id: 3,
      title: 'Food',
      new_crowns: 1,
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
      hearts: 5,
      max_hearts: 5,
      gems: 100,
    },
    completed_at: '2026-07-19T12:00:00Z',
  }
}
