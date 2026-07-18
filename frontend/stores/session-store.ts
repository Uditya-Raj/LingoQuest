/**
 * Server-authoritative session cache.
 * Applies values returned by the backend; never computes XP, hearts, crowns, or locks.
 * Not persisted to localStorage.
 */

import { create } from 'zustand'

import type { ApiError } from '@/lib/api/client'
import type { LearnerSummary } from '@/lib/contracts/common'
import type {
  HeartsRefillResponse,
  HeartsStatusResponse,
} from '@/lib/contracts/hearts'
import type {
  CompletionResponse,
  LessonAttemptResponse,
} from '@/lib/contracts/lesson'
import type { ProfileResponse } from '@/lib/contracts/user'

export type SessionRequestStatus = 'idle' | 'loading' | 'error'

export interface SessionState {
  profile: ProfileResponse | null
  learner: LearnerSummary | null
  hearts: HeartsStatusResponse | null
  attempt: LessonAttemptResponse | null
  completion: CompletionResponse | null
  status: SessionRequestStatus
  error: Pick<ApiError, 'status' | 'code' | 'message'> | null

  setProfile: (profile: ProfileResponse) => void
  setLearner: (learner: LearnerSummary) => void
  setHearts: (hearts: HeartsStatusResponse) => void
  setAttempt: (attempt: LessonAttemptResponse) => void
  applyAnswerHearts: (payload: {
    hearts_remaining: number
    max_hearts: number
    next_heart_at: string | null
  }) => void
  applyRefill: (payload: HeartsRefillResponse) => void
  setCompletion: (completion: CompletionResponse) => void
  setLoading: () => void
  setError: (error: Pick<ApiError, 'status' | 'code' | 'message'>) => void
  clearError: () => void
  reset: () => void
}

const initialState = {
  profile: null as ProfileResponse | null,
  learner: null as LearnerSummary | null,
  hearts: null as HeartsStatusResponse | null,
  attempt: null as LessonAttemptResponse | null,
  completion: null as CompletionResponse | null,
  status: 'idle' as SessionRequestStatus,
  error: null as SessionState['error'],
}

/**
 * In-memory cache of the latest backend-authoritative learner session values.
 * Wrong-answer and completion updates must use backend response fields only.
 */
export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,

  setProfile: (profile) =>
    set({
      profile,
      status: 'idle',
      error: null,
    }),

  setLearner: (learner) =>
    set({
      learner,
      status: 'idle',
      error: null,
    }),

  setHearts: (hearts) =>
    set({
      hearts,
      status: 'idle',
      error: null,
    }),

  setAttempt: (attempt) =>
    set({
      attempt,
      // Attempt payload includes authoritative hearts — mirror them when present.
      hearts: {
        hearts: attempt.hearts,
        max_hearts: attempt.max_hearts,
        next_heart_at: attempt.next_heart_at,
        seconds_until_next: null,
        regen_interval_minutes:
          // Preserve prior regen interval if known; otherwise default from API.
          useSessionStore.getState().hearts?.regen_interval_minutes ?? 15,
      },
      status: 'idle',
      error: null,
    }),

  /**
   * Apply hearts fields from an answer response exactly — no local decrement.
   */
  applyAnswerHearts: (payload) =>
    set((state) => ({
      hearts: {
        hearts: payload.hearts_remaining,
        max_hearts: payload.max_hearts,
        next_heart_at: payload.next_heart_at,
        seconds_until_next: state.hearts?.seconds_until_next ?? null,
        regen_interval_minutes: state.hearts?.regen_interval_minutes ?? 15,
      },
      attempt:
        state.attempt === null
          ? null
          : {
              ...state.attempt,
              hearts: payload.hearts_remaining,
              max_hearts: payload.max_hearts,
              next_heart_at: payload.next_heart_at,
            },
      status: 'idle',
      error: null,
    })),

  /**
   * Apply hearts/gems from a refill response exactly — no optimistic arithmetic.
   */
  applyRefill: (payload) =>
    set((state) => ({
      hearts: {
        hearts: payload.hearts,
        max_hearts: payload.max_hearts,
        next_heart_at: payload.next_heart_at,
        seconds_until_next: null,
        regen_interval_minutes: state.hearts?.regen_interval_minutes ?? 15,
      },
      learner:
        state.learner === null
          ? null
          : {
              ...state.learner,
              hearts: payload.hearts,
              max_hearts: payload.max_hearts,
              next_heart_at: payload.next_heart_at,
              gems: payload.gems,
            },
      status: 'idle',
      error: null,
    })),

  setCompletion: (completion) =>
    set((state) => ({
      completion,
      // Apply user_totals from the completion response — do not increment locally.
      learner:
        state.learner === null
          ? null
          : {
              ...state.learner,
              total_xp: completion.user_totals.total_xp,
              hearts: completion.user_totals.hearts,
              max_hearts: completion.user_totals.max_hearts,
              gems: completion.user_totals.gems,
              today_xp: completion.daily_goal.today_xp,
              daily_goal_xp: completion.daily_goal.goal_xp,
              daily_goal_progress: completion.daily_goal.progress,
              current_streak: completion.streak.current,
            },
      hearts: {
        hearts: completion.user_totals.hearts,
        max_hearts: completion.user_totals.max_hearts,
        next_heart_at: state.hearts?.next_heart_at ?? null,
        seconds_until_next: state.hearts?.seconds_until_next ?? null,
        regen_interval_minutes: state.hearts?.regen_interval_minutes ?? 15,
      },
      status: 'idle',
      error: null,
    })),

  setLoading: () => set({ status: 'loading', error: null }),

  setError: (error) => set({ status: 'error', error }),

  clearError: () => set({ error: null, status: 'idle' }),

  reset: () => set({ ...initialState }),
}))
