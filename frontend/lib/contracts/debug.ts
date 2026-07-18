/**
 * Development-only logical clock contracts (present in OpenAPI when enabled).
 */

export interface DebugClockStatusResponse {
  real_now: string
  logical_now: string
  offset_days: number
}

export interface DebugClockAdvanceRequest {
  days: number
}

export interface DebugClockAdvanceResponse {
  logical_now: string
  logical_date: string
  offset_days: number
}

export interface DebugClockResetResponse {
  logical_now: string
  logical_date: string
  offset_days: number
}
