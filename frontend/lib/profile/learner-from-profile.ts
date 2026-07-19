/**
 * Map GET /user/me into the shared learner summary shape.
 * Values are copied from the response — never recomputed.
 */

import type { LearnerSummary } from '@/lib/contracts/common'
import type { ProfileResponse } from '@/lib/contracts/user'

export function learnerSummaryFromProfile(
  profile: ProfileResponse,
  previous: LearnerSummary | null = null,
): LearnerSummary {
  return {
    id: profile.user.id,
    display_name: profile.user.display_name,
    hearts: profile.stats.hearts,
    max_hearts: profile.stats.max_hearts,
    next_heart_at: previous?.next_heart_at ?? null,
    total_xp: profile.stats.total_xp,
    today_xp: profile.stats.today_xp,
    daily_goal_xp: profile.stats.daily_goal_xp,
    daily_goal_progress: profile.stats.daily_goal_progress,
    current_streak: profile.stats.current_streak,
    gems: profile.stats.gems,
  }
}
