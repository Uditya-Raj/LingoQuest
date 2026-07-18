/**
 * Lesson attempt, answer, and completion contracts.
 */

import type {
  AttemptMode,
  AttemptStatus,
  FailureReason,
  SkillStatus,
} from './common'
import type { CorrectAnswer, PublicExercise, SubmittedAnswer } from './exercises'

export interface TerminalSummaryCompleted {
  outcome: 'completed'
  xp_earned: number
  perfect: boolean
  failure_reason?: null
  completed_at: string
}

export interface TerminalSummaryFailed {
  outcome: 'failed'
  xp_earned: number
  perfect: boolean
  failure_reason: FailureReason
  completed_at: string
}

export type TerminalSummary = TerminalSummaryCompleted | TerminalSummaryFailed

/** Shared public attempt response for start and retrieve. */
export interface LessonAttemptResponse {
  attempt_id: number
  skill_id: number
  lesson_id: number
  skill_title: string
  status: AttemptStatus
  mode: AttemptMode
  expires_at: string | null
  remaining_seconds: number | null
  resumed: boolean
  started_at: string
  completed_at: string | null
  current_index: number
  total_exercises: number
  hearts: number
  max_hearts: number
  next_heart_at: string | null
  mistakes_count: number
  exercises: PublicExercise[]
  terminal_summary: TerminalSummary | null
}

export interface AnswerSubmitPayload {
  exercise_id: number
  position: number
  answer: SubmittedAnswer
}

export interface AnswerResponse {
  attempt_id: number
  exercise_id: number
  position: number
  is_correct: boolean
  correct_answer: CorrectAnswer
  current_index: number
  total_exercises: number
  mistakes_count: number
  hearts_remaining: number
  max_hearts: number
  next_heart_at: string | null
  lesson_status: AttemptStatus
  can_complete: boolean
}

export interface CompletionSkillSummary {
  id: number
  title: string
  new_crowns: number
  max_level: number
  status: SkillStatus
}

export interface CompletionXpSummary {
  base: number
  perfect_bonus: number
  earned: number
  perfect: boolean
}

export interface CompletionStreakSummary {
  current: number
  longest: number
  extended_today: boolean
  activity_date: string
}

export interface CompletionDailyGoalSummary {
  today_xp: number
  goal_xp: number
  progress: number
  reached: boolean
}

export interface CompletionAchievementSummary {
  key: string
  title: string
  description: string
  icon: string
}

export interface CompletionUserTotals {
  total_xp: number
  hearts: number
  max_hearts: number
  gems: number
}

export interface CompletionResponse {
  attempt_id: number
  skill: CompletionSkillSummary
  xp: CompletionXpSummary
  streak: CompletionStreakSummary
  daily_goal: CompletionDailyGoalSummary
  unlocked_skill_ids: number[]
  achievements_unlocked: CompletionAchievementSummary[]
  user_totals: CompletionUserTotals
  completed_at: string
}
