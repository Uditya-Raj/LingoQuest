/**
 * User profile and settings contracts.
 */

export interface ProfileActiveCourse {
  id: number
  title: string
  icon: string
}

export interface ProfileUserInfo {
  id: number
  username: string
  display_name: string
  email: string | null
  joined_at: string
  active_course: ProfileActiveCourse | null
}

export interface ProfileStats {
  total_xp: number
  today_xp: number
  daily_goal_xp: number
  daily_goal_progress: number
  current_streak: number
  longest_streak: number
  hearts: number
  max_hearts: number
  gems: number
  skills_completed: number
  lessons_completed: number
  perfect_lessons: number
}

export interface ProfileAchievement {
  id: number
  key: string
  title: string
  description: string
  icon: string
  earned: boolean
  earned_at: string | null
}

export interface ProfileResponse {
  user: ProfileUserInfo
  stats: ProfileStats
  achievements: ProfileAchievement[]
}

export interface UserPatchRequest {
  display_name?: string
  daily_goal_xp?: number
}

export interface UserPatchResponse {
  display_name: string
  daily_goal_xp: number
  today_xp: number
  daily_goal_progress: number
}
