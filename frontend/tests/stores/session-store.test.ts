import { beforeEach, describe, expect, it } from 'vitest'

import { useSessionStore } from '@/stores/session-store'
import type { HeartsStatusResponse } from '@/lib/contracts/hearts'
import type {
  CompletionResponse,
  LessonAttemptResponse,
} from '@/lib/contracts/lesson'
import type { ProfileResponse } from '@/lib/contracts/user'
import type { LearnerSummary } from '@/lib/contracts/common'

const learner: LearnerSummary = {
  id: 1,
  display_name: 'Maya',
  hearts: 4,
  max_hearts: 5,
  next_heart_at: '2026-07-18T10:45:00Z',
  total_xp: 340,
  today_xp: 10,
  daily_goal_xp: 20,
  daily_goal_progress: 0.5,
  current_streak: 6,
  gems: 100,
}

const hearts: HeartsStatusResponse = {
  hearts: 4,
  max_hearts: 5,
  next_heart_at: '2026-07-18T10:45:00Z',
  seconds_until_next: 420,
  regen_interval_minutes: 15,
}

const profile: ProfileResponse = {
  user: {
    id: 1,
    username: 'maya_demo',
    display_name: 'Maya',
    email: 'maya@example.test',
    joined_at: '2026-06-01T08:00:00Z',
    active_course: { id: 1, title: 'Spanish', icon: 'spanish-course' },
  },
  stats: {
    total_xp: 340,
    today_xp: 10,
    daily_goal_xp: 20,
    daily_goal_progress: 0.5,
    current_streak: 6,
    longest_streak: 11,
    hearts: 4,
    max_hearts: 5,
    gems: 100,
    skills_completed: 2,
    lessons_completed: 24,
    perfect_lessons: 6,
  },
  achievements: [],
}

const attempt: LessonAttemptResponse = {
  attempt_id: 42,
  skill_id: 3,
  lesson_id: 3,
  skill_title: 'Food',
  status: 'in_progress',
  mode: 'standard',
  expires_at: null,
  remaining_seconds: null,
  resumed: false,
  started_at: '2026-07-18T10:20:00Z',
  completed_at: null,
  current_index: 0,
  total_exercises: 10,
  hearts: 4,
  max_hearts: 5,
  next_heart_at: '2026-07-18T10:45:00Z',
  mistakes_count: 0,
  exercises: [],
  terminal_summary: null,
}

const completion: CompletionResponse = {
  attempt_id: 42,
  skill: {
    id: 3,
    title: 'Food',
    new_crowns: 1,
    max_level: 5,
    status: 'in_progress',
  },
  xp: {
    base: 10,
    perfect_bonus: 5,
    earned: 15,
    perfect: true,
  },
  streak: {
    current: 7,
    longest: 11,
    extended_today: true,
    activity_date: '2026-07-19',
  },
  daily_goal: {
    today_xp: 25,
    goal_xp: 20,
    progress: 1.0,
    reached: true,
  },
  unlocked_skill_ids: [4],
  achievements_unlocked: [],
  user_totals: {
    total_xp: 355,
    hearts: 4,
    max_hearts: 5,
    gems: 100,
  },
  completed_at: '2026-07-19T10:30:00Z',
}

describe('session store', () => {
  beforeEach(() => {
    useSessionStore.getState().reset()
  })

  it('applies backend profile and hearts values exactly', () => {
    useSessionStore.getState().setProfile(profile)
    useSessionStore.getState().setHearts(hearts)
    useSessionStore.getState().setLearner(learner)

    const state = useSessionStore.getState()
    expect(state.profile).toEqual(profile)
    expect(state.hearts).toEqual(hearts)
    expect(state.learner).toEqual(learner)
  })

  it('does not locally decrement hearts on wrong answers', () => {
    useSessionStore.getState().setHearts(hearts)
    useSessionStore.getState().setAttempt(attempt)

    // Backend said hearts_remaining is 3 — store must apply that value, not hearts-1.
    useSessionStore.getState().applyAnswerHearts({
      hearts_remaining: 3,
      max_hearts: 5,
      next_heart_at: '2026-07-18T10:45:00Z',
    })

    expect(useSessionStore.getState().hearts?.hearts).toBe(3)
    expect(useSessionStore.getState().attempt?.hearts).toBe(3)
  })

  it('does not locally increment XP on completion', () => {
    useSessionStore.getState().setLearner(learner)
    useSessionStore.getState().setCompletion(completion)

    const state = useSessionStore.getState()
    // Must equal backend user_totals.total_xp (355), not 340 + 15 computed locally.
    expect(state.learner?.total_xp).toBe(355)
    expect(state.completion?.xp.earned).toBe(15)
    expect(state.learner?.current_streak).toBe(7)
  })

  it('applies refill hearts and gems from the backend response exactly', () => {
    useSessionStore.getState().setLearner({ ...learner, hearts: 0, gems: 40 })
    useSessionStore.getState().applyRefill({
      hearts: 5,
      max_hearts: 5,
      gems: 20,
      gems_spent: 20,
      next_heart_at: null,
    })

    expect(useSessionStore.getState().hearts?.hearts).toBe(5)
    expect(useSessionStore.getState().learner?.gems).toBe(20)
  })

  it('resets to the initial empty state', () => {
    useSessionStore.getState().setProfile(profile)
    useSessionStore.getState().setHearts(hearts)
    useSessionStore.getState().setAttempt(attempt)
    useSessionStore.getState().setCompletion(completion)
    useSessionStore.getState().reset()

    const state = useSessionStore.getState()
    expect(state.profile).toBeNull()
    expect(state.hearts).toBeNull()
    expect(state.attempt).toBeNull()
    expect(state.completion).toBeNull()
    expect(state.learner).toBeNull()
    expect(state.status).toBe('idle')
    expect(state.error).toBeNull()
  })
})
