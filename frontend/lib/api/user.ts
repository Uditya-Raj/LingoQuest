/**
 * Hearts, profile, leaderboard, and achievements endpoint wrappers.
 */

import { apiGet, apiPatch, apiPost } from '@/lib/api/client'
import type {
  HeartsRefillRequest,
  HeartsRefillResponse,
  HeartsStatusResponse,
} from '@/lib/contracts/hearts'
import type { AchievementsListResponse } from '@/lib/contracts/achievements'
import type { LeaderboardResponse } from '@/lib/contracts/leaderboard'
import type {
  ProfileResponse,
  UserPatchRequest,
  UserPatchResponse,
} from '@/lib/contracts/user'

export function getHeartsStatus(
  signal?: AbortSignal,
): Promise<HeartsStatusResponse> {
  return apiGet<HeartsStatusResponse>('/hearts/status', { signal })
}

export function refillHearts(
  payload: HeartsRefillRequest = { confirm_spend: true },
  signal?: AbortSignal,
): Promise<HeartsRefillResponse> {
  return apiPost<HeartsRefillResponse>('/hearts/refill', payload, { signal })
}

export function getCurrentUser(
  signal?: AbortSignal,
): Promise<ProfileResponse> {
  return apiGet<ProfileResponse>('/user/me', { signal })
}

export function updateCurrentUser(
  payload: UserPatchRequest,
  signal?: AbortSignal,
): Promise<UserPatchResponse> {
  return apiPatch<UserPatchResponse>('/user/me', payload, { signal })
}

export function getLeaderboard(
  limit?: number,
  signal?: AbortSignal,
): Promise<LeaderboardResponse> {
  const query =
    limit === undefined ? '' : `?limit=${encodeURIComponent(String(limit))}`
  return apiGet<LeaderboardResponse>(`/leaderboard${query}`, { signal })
}

export function getAchievements(
  signal?: AbortSignal,
): Promise<AchievementsListResponse> {
  return apiGet<AchievementsListResponse>('/achievements', { signal })
}
