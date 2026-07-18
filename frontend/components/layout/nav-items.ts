import {
  BookOpen,
  type LucideIcon,
  Settings,
  Trophy,
  UserRound,
} from 'lucide-react'

export interface LearnerNavItem {
  href: string
  label: string
  icon: LucideIcon
}

/** Four primary learner destinations from the UX blueprint. */
export const LEARNER_NAV_ITEMS: readonly LearnerNavItem[] = [
  { href: '/', label: 'Learn', icon: BookOpen },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: UserRound },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/' || pathname.startsWith('/skill/')
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
