/**
 * Content-administration contracts.
 * Admin exercise types may include correct_answer (never on learner routes).
 */

import type {
  CorrectAnswer,
  ExerciseOptionItem,
  ExerciseType,
  MatchPairsOptions,
} from './exercises'

export type AdminExerciseOptions =
  | ExerciseOptionItem[]
  | MatchPairsOptions
  | null

export interface AdminExerciseRepresentation {
  id: number
  lesson_id: number
  order_index: number
  type: ExerciseType
  prompt: string
  audio_url: string | null
  tts_text: string | null
  tts_lang: string | null
  options: AdminExerciseOptions
  correct_answer: CorrectAnswer
  metadata: Record<string, unknown> | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AdminLessonNode {
  id: number
  order_index: number
  xp_reward: number
  exercises: AdminExerciseRepresentation[]
}

export interface AdminSkillNode {
  id: number
  title: string
  lessons: AdminLessonNode[]
}

export interface AdminUnitNode {
  id: number
  title: string
  skills: AdminSkillNode[]
}

export interface AdminCourseNode {
  id: number
  title: string
  units: AdminUnitNode[]
}

export interface AdminContentTreeResponse {
  courses: AdminCourseNode[]
}

export interface AdminExerciseCreateRequest {
  lesson_id: number
  order_index: number
  type: ExerciseType
  prompt: string
  audio_url?: string | null
  tts_text?: string | null
  tts_lang?: string | null
  options?: AdminExerciseOptions
  correct_answer: CorrectAnswer
  metadata?: Record<string, unknown> | null
  is_active?: boolean
}

export interface AdminExercisePatchRequest {
  lesson_id?: number
  order_index?: number
  type?: ExerciseType
  prompt?: string
  audio_url?: string | null
  tts_text?: string | null
  tts_lang?: string | null
  options?: AdminExerciseOptions
  correct_answer?: CorrectAnswer
  metadata?: Record<string, unknown> | null
  is_active?: boolean
}
