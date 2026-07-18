/**
 * Hearts status and refill contracts.
 */

export interface HeartsStatusResponse {
  hearts: number
  max_hearts: number
  next_heart_at: string | null
  seconds_until_next: number | null
  regen_interval_minutes: number
}

export interface HeartsRefillRequest {
  confirm_spend: boolean
}

export interface HeartsRefillResponse {
  hearts: number
  max_hearts: number
  gems: number
  gems_spent: number
  next_heart_at: string | null
}
