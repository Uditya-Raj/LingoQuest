'use client'

import {
  Flame,
  Gem,
  Heart,
  Medal,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-react'

import { AchievementGrid } from '@/components/profile/achievement-grid'
import { DailyGoalCard } from '@/components/profile/daily-goal-card'
import { ProfileHeader } from '@/components/profile/profile-header'
import { ProfileStatCard } from '@/components/profile/profile-stat-card'
import type { AchievementListItem } from '@/lib/contracts/achievements'
import type { ProfileResponse } from '@/lib/contracts/user'
import { cn } from '@/lib/utils'

interface ProfileViewProps {
  profile: ProfileResponse
  achievements: AchievementListItem[]
  className?: string
}

/**
 * Full learner profile composition from backend profile + achievements.
 */
export function ProfileView({
  profile,
  achievements,
  className,
}: ProfileViewProps) {
  const { user, stats } = profile

  return (
    <div className={cn('mx-auto w-full max-w-lq-standard space-y-6', className)}>
      <ProfileHeader user={user} />

      <section aria-labelledby="profile-stats-heading">
        <h2 id="profile-stats-heading" className="sr-only">
          Profile statistics
        </h2>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ProfileStatCard
            label="Total XP"
            value={stats.total_xp}
            icon={<Star />}
          />
          <ProfileStatCard
            label="Current streak"
            value={stats.current_streak}
            icon={<Flame />}
            hint="days"
          />
          <ProfileStatCard
            label="Longest streak"
            value={stats.longest_streak}
            icon={<Trophy />}
            hint="days"
          />
          <ProfileStatCard
            label="Hearts"
            value={`${stats.hearts}/${stats.max_hearts}`}
            icon={<Heart />}
          />
          <ProfileStatCard
            label="Gems"
            value={stats.gems}
            icon={<Gem />}
          />
          <ProfileStatCard
            label="Skills completed"
            value={stats.skills_completed}
            icon={<Medal />}
          />
          <ProfileStatCard
            label="Lessons completed"
            value={stats.lessons_completed}
            icon={<Sparkles />}
          />
          <ProfileStatCard
            label="Perfect lessons"
            value={stats.perfect_lessons}
            icon={<Trophy />}
          />
          <ProfileStatCard
            label="Today’s XP"
            value={stats.today_xp}
            icon={<Star />}
          />
        </dl>
      </section>

      <DailyGoalCard stats={stats} />

      <AchievementGrid achievements={achievements} />
    </div>
  )
}
