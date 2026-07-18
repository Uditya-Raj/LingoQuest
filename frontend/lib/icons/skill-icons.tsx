/**
 * Centralized typed mapping from seeded skill icon keys to Lucide components.
 * Unknown keys fall back to a safe decorative icon without crashing.
 */

import {
  Apple,
  CircleHelp,
  Compass,
  Hand,
  HeartHandshake,
  type LucideIcon,
  MessageCircleQuestion,
  Sparkles,
  Waves,
} from 'lucide-react'

export const SKILL_ICON_KEYS = [
  'wave',
  'spark',
  'apple',
  'home-heart',
  'question-bubble',
  'spanish-course',
] as const

export type SkillIconKey = (typeof SKILL_ICON_KEYS)[number]

const SKILL_ICON_MAP: Record<SkillIconKey, LucideIcon> = {
  wave: Hand,
  spark: Sparkles,
  apple: Apple,
  'home-heart': HeartHandshake,
  'question-bubble': MessageCircleQuestion,
  'spanish-course': Compass,
}

const FALLBACK_ICON: LucideIcon = CircleHelp

export function resolveSkillIcon(iconKey: string): LucideIcon {
  if (Object.prototype.hasOwnProperty.call(SKILL_ICON_MAP, iconKey)) {
    return SKILL_ICON_MAP[iconKey as SkillIconKey]
  }
  return FALLBACK_ICON
}

interface SkillIconProps {
  iconKey: string
  size?: number
  className?: string
  /** Decorative icons are hidden from assistive tech. */
  decorative?: boolean
  label?: string
}

export function SkillIcon({
  iconKey,
  size = 28,
  className,
  decorative = true,
  label,
}: SkillIconProps) {
  const Icon = resolveSkillIcon(iconKey)
  return (
    <Icon
      size={size}
      className={className}
      aria-hidden={decorative || undefined}
      role={decorative ? 'presentation' : 'img'}
      aria-label={decorative ? undefined : (label ?? iconKey)}
    />
  )
}
