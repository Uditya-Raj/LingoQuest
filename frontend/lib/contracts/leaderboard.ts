/**
 * Leaderboard contracts.
 */

export interface LeaderboardEntry {
  rank: number
  user_id: number
  display_name: string
  total_xp: number
  current_streak: number
  is_current_user: boolean
}

export interface LeaderboardResponse {
  ranking_basis: string
  entries: LeaderboardEntry[]
  current_user: LeaderboardEntry
}
