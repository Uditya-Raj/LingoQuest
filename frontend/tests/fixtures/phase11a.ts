import type { AchievementsListResponse } from '@/lib/contracts/achievements'
import type { LeaderboardResponse } from '@/lib/contracts/leaderboard'
import type { ProfileResponse } from '@/lib/contracts/user'

export const mockProfile: ProfileResponse = {
  user: {
    id: 3,
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

export const mockLongNameProfile: ProfileResponse = {
  ...mockProfile,
  user: {
    ...mockProfile.user,
    display_name: 'Maya Extremely-Long-Explorer-Name-For-Wrapping',
    username: 'maya_demo_with_a_very_long_username_value',
  },
  stats: {
    ...mockProfile.stats,
    total_xp: 1_234_567,
    current_streak: 999,
  },
}

export const mockAchievements: AchievementsListResponse = {
  achievements: [
    {
      id: 1,
      key: 'first_steps',
      title: 'First Steps',
      description: 'Complete your first skill.',
      icon: 'footprints',
      criteria_type: 'skills_completed',
      criteria_value: 1,
      current_value: 2,
      earned: true,
      earned_at: '2026-06-01T08:20:00Z',
    },
    {
      id: 5,
      key: 'xp_500',
      title: 'XP Trailblazer',
      description: 'Earn 500 total XP.',
      icon: 'xp-crown',
      criteria_type: 'total_xp',
      criteria_value: 500,
      current_value: 340,
      earned: false,
      earned_at: null,
    },
    {
      id: 99,
      key: 'mystery_badge',
      title: 'Mystery Badge',
      description: 'Unknown icon fallback check.',
      icon: 'totally-unknown-icon-key',
      criteria_type: 'total_xp',
      criteria_value: 9999,
      current_value: 0,
      earned: false,
      earned_at: null,
    },
  ],
}

export const mockLeaderboard: LeaderboardResponse = {
  ranking_basis: 'total_xp',
  entries: [
    {
      rank: 1,
      user_id: 1,
      display_name: 'Leo',
      total_xp: 520,
      current_streak: 8,
      is_current_user: false,
    },
    {
      rank: 2,
      user_id: 2,
      display_name: 'Asha',
      total_xp: 410,
      current_streak: 4,
      is_current_user: false,
    },
    {
      rank: 3,
      user_id: 3,
      display_name: 'Maya',
      total_xp: 340,
      current_streak: 6,
      is_current_user: true,
    },
    {
      rank: 4,
      user_id: 4,
      display_name: 'Noah',
      total_xp: 290,
      current_streak: 2,
      is_current_user: false,
    },
  ],
  current_user: {
    rank: 3,
    user_id: 3,
    display_name: 'Maya',
    total_xp: 340,
    current_streak: 6,
    is_current_user: true,
  },
}

export const mockLeaderboardOutsideTop: LeaderboardResponse = {
  ranking_basis: 'total_xp',
  entries: [
    {
      rank: 1,
      user_id: 1,
      display_name: 'Leo',
      total_xp: 520,
      current_streak: 8,
      is_current_user: false,
    },
    {
      rank: 2,
      user_id: 2,
      display_name: 'Asha',
      total_xp: 410,
      current_streak: 4,
      is_current_user: false,
    },
  ],
  current_user: {
    rank: 12,
    user_id: 3,
    display_name: 'Maya',
    total_xp: 40,
    current_streak: 1,
    is_current_user: true,
  },
}

export const mockLeaderboardFew: LeaderboardResponse = {
  ranking_basis: 'total_xp',
  entries: [
    {
      rank: 1,
      user_id: 3,
      display_name: 'Maya',
      total_xp: 340,
      current_streak: 6,
      is_current_user: true,
    },
    {
      rank: 2,
      user_id: 1,
      display_name: 'Leo',
      total_xp: 200,
      current_streak: 2,
      is_current_user: false,
    },
  ],
  current_user: {
    rank: 1,
    user_id: 3,
    display_name: 'Maya',
    total_xp: 340,
    current_streak: 6,
    is_current_user: true,
  },
}
