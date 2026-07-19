'use client'

import {
  Award,
  Flame,
  Footprints,
  Gem,
  Shield,
  Sparkles,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, LucideIcon> = {
  footprints: Footprints,
  'small-flame': Flame,
  'calendar-star': Award,
  'xp-spark': Sparkles,
  'xp-crown': Trophy,
  'target-star': Target,
  gem: Gem,
}

interface AchievementIconProps {
  iconKey: string
  className?: string
  earned?: boolean
}

/**
 * Maps backend achievement icon keys to original Lucide icons.
 * Unknown keys fall back to a shield medallion — never external avatars.
 */
export function AchievementIcon({
  iconKey,
  className,
  earned = true,
}: AchievementIconProps) {
  const Icon = ICON_MAP[iconKey] ?? Shield
  return (
    <Icon
      className={cn(
        'h-6 w-6',
        earned ? 'text-lq-crown' : 'text-lq-text-secondary',
        className,
      )}
      aria-hidden="true"
    />
  )
}
