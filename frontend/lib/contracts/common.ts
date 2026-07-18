/**
 * Shared API contracts matching /docs/03_API_SPEC.md and backend schemas.
 * Timestamps are ISO 8601 strings in JSON responses.
 */

/** Standard backend error detail object. */
export interface ApiErrorDetail {
  code: string
  message: string
  details?: Record<string, unknown> | null
}

/** Standard error envelope for handled 4xx/5xx responses. */
export interface ApiErrorEnvelope {
  error: ApiErrorDetail
}

/**
 * Shared learner summary for the persistent top bar.
 * `next_heart_at` is null when hearts are full.
 */
export interface LearnerSummary {
  id: number
  display_name: string
  hearts: number
  max_hearts: number
  next_heart_at: string | null
  total_xp: number
  today_xp: number
  daily_goal_xp: number
  daily_goal_progress: number
  current_streak: number
  gems: number
}

export type SkillStatus =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'completed'

export type AttemptStatus = 'in_progress' | 'completed' | 'failed'

export type AttemptMode = 'standard' | 'timed'

export type FailureReason = 'out_of_hearts' | 'time_expired'
