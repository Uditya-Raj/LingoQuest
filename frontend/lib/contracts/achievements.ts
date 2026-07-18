/**
 * Achievements list contracts.
 */

export interface AchievementListItem {
  id: number
  key: string
  title: string
  description: string
  icon: string
  criteria_type: string
  criteria_value: number
  current_value: number
  earned: boolean
  earned_at: string | null
}

export interface AchievementsListResponse {
  achievements: AchievementListItem[]
}
