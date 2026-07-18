/**
 * Course path and skill detail contracts.
 */

import type { LearnerSummary, SkillStatus } from './common'

export interface CourseInfo {
  id: number
  title: string
  language_code: string
  from_language_code: string
  icon: string
}

export interface SkillSummary {
  id: number
  title: string
  description: string
  icon: string
  order_index: number
  status: SkillStatus
  crowns: number
  max_level: number
  active_attempt_id: number | null
}

export interface UnitSummary {
  id: number
  title: string
  description: string
  order_index: number
  color_theme: string
  skills: SkillSummary[]
}

export interface CourseResponse {
  learner: LearnerSummary
  course: CourseInfo
  units: UnitSummary[]
}

export interface PrerequisiteInfo {
  id: number
  title: string
  satisfied: boolean
}

export interface SkillDetail {
  id: number
  title: string
  description: string
  icon: string
  status: SkillStatus
  crowns: number
  max_level: number
  prerequisite: PrerequisiteInfo | null
}

export interface LessonInfo {
  id: number
  exercise_pool_size: number
  attempt_exercise_count: number
  base_xp: number
}

export interface ActiveAttemptInfo {
  id: number
  current_index: number
  total_exercises: number
  started_at: string
}

export interface SkillDetailResponse {
  skill: SkillDetail
  lesson: LessonInfo
  active_attempt: ActiveAttemptInfo | null
  can_start: boolean
  blocked_reason: string | null
  learner: LearnerSummary
}
