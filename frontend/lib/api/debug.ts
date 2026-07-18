/**
 * Development-only debug clock wrappers.
 * Keep separate from normal learner API calls. Routes are absent when disabled.
 */

import { apiGet, apiPost } from '@/lib/api/client'
import type {
  DebugClockAdvanceRequest,
  DebugClockAdvanceResponse,
  DebugClockResetResponse,
  DebugClockStatusResponse,
} from '@/lib/contracts/debug'

export function getDebugClock(
  signal?: AbortSignal,
): Promise<DebugClockStatusResponse> {
  return apiGet<DebugClockStatusResponse>('/debug/clock', { signal })
}

export function advanceDebugClock(
  payload: DebugClockAdvanceRequest,
  signal?: AbortSignal,
): Promise<DebugClockAdvanceResponse> {
  return apiPost<DebugClockAdvanceResponse>('/debug/clock/advance', payload, {
    signal,
  })
}

export function resetDebugClock(
  signal?: AbortSignal,
): Promise<DebugClockResetResponse> {
  return apiPost<DebugClockResetResponse>('/debug/clock/reset', undefined, {
    signal,
  })
}
