import type { CourseResponse, SkillDetailResponse } from '@/lib/contracts/course'
import type { LearnerSummary } from '@/lib/contracts/common'
import type { LessonAttemptResponse } from '@/lib/contracts/lesson'

export const mockLearner: LearnerSummary = {
  id: 3,
  display_name: 'Maya',
  hearts: 4,
  max_hearts: 5,
  next_heart_at: '2026-07-18T12:00:00Z',
  total_xp: 340,
  today_xp: 10,
  daily_goal_xp: 20,
  daily_goal_progress: 0.5,
  current_streak: 6,
  gems: 100,
}

export const mockCourse: CourseResponse = {
  learner: mockLearner,
  course: {
    id: 1,
    title: 'Spanish',
    language_code: 'es',
    from_language_code: 'en',
    icon: 'spanish-course',
  },
  units: [
    {
      id: 1,
      title: 'First Steps',
      description: 'Introduce yourself and use essential Spanish words.',
      order_index: 0,
      color_theme: 'meadow',
      skills: [
        {
          id: 1,
          title: 'Greetings',
          description: 'Say hello, goodbye, and use polite expressions.',
          icon: 'wave',
          order_index: 0,
          status: 'completed',
          crowns: 5,
          max_level: 5,
          active_attempt_id: null,
        },
        {
          id: 2,
          title: 'Basics',
          description: 'Core building blocks.',
          icon: 'spark',
          order_index: 1,
          status: 'completed',
          crowns: 5,
          max_level: 5,
          active_attempt_id: null,
        },
      ],
    },
    {
      id: 2,
      title: 'Everyday Life',
      description: 'Talk about food and family.',
      order_index: 1,
      color_theme: 'ocean',
      skills: [
        {
          id: 3,
          title: 'Food',
          description: 'Recognize common food and drink words.',
          icon: 'apple',
          order_index: 0,
          status: 'in_progress',
          crowns: 2,
          max_level: 5,
          active_attempt_id: null,
        },
        {
          id: 4,
          title: 'Family',
          description: 'Describe close family members.',
          icon: 'home-heart',
          order_index: 1,
          status: 'available',
          crowns: 0,
          max_level: 5,
          active_attempt_id: null,
        },
      ],
    },
    {
      id: 3,
      title: 'Conversations',
      description: 'Ask and answer questions.',
      order_index: 2,
      color_theme: 'violet',
      skills: [
        {
          id: 5,
          title: 'Questions',
          description: 'Form basic questions.',
          icon: 'question-bubble',
          order_index: 0,
          status: 'locked',
          crowns: 0,
          max_level: 5,
          active_attempt_id: null,
        },
      ],
    },
  ],
}

export function mockSkillDetail(
  overrides: Partial<SkillDetailResponse> = {},
): SkillDetailResponse {
  return {
    skill: {
      id: 3,
      title: 'Food',
      description: 'Recognize common food and drink words.',
      icon: 'apple',
      status: 'in_progress',
      crowns: 2,
      max_level: 5,
      prerequisite: { id: 2, title: 'Basics', satisfied: true },
    },
    lesson: {
      id: 3,
      exercise_pool_size: 12,
      attempt_exercise_count: 10,
      base_xp: 10,
    },
    active_attempt: null,
    can_start: true,
    blocked_reason: null,
    learner: mockLearner,
    ...overrides,
  }
}

export function mockAttempt(
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
    total_exercises: 10,
    hearts: 4,
    max_hearts: 5,
    next_heart_at: null,
    mistakes_count: 0,
    exercises: [
      {
        id: 101,
        position: 0,
        type: 'multiple_choice',
        prompt: 'Hola',
        audio_url: null,
        tts_text: 'hola',
        tts_lang: 'es-ES',
        metadata: null,
        options: [
          { id: 'a', text: 'Hello' },
          { id: 'b', text: 'Goodbye' },
        ],
      },
    ],
    terminal_summary: null,
    ...overrides,
  }
}
