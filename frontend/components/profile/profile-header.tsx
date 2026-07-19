'use client'

import Link from 'next/link'
import { Settings } from 'lucide-react'

import { QuestMascot } from '@/components/ui/quest-mascot'
import { SurfaceCard } from '@/components/ui/surface-card'
import type { ProfileUserInfo } from '@/lib/contracts/user'
import { formatProfileDate } from '@/lib/profile/format-date'
import { cn } from '@/lib/utils'

interface ProfileHeaderProps {
  user: ProfileUserInfo
  className?: string
}

function initialFromName(displayName: string): string {
  const trimmed = displayName.trim()
  if (!trimmed) return '?'
  return trimmed.charAt(0).toLocaleUpperCase()
}

/**
 * Learner identity header with Quest fox flourish and original medallion.
 */
export function ProfileHeader({ user, className }: ProfileHeaderProps) {
  const joinedLabel = formatProfileDate(user.joined_at)
  const initial = initialFromName(user.display_name)
  const courseTitle = user.active_course?.title

  return (
    <SurfaceCard
      variant="elevated"
      className={cn('relative overflow-hidden p-5 sm:p-6', className)}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-8 h-36 w-36 rounded-full bg-lq-primary/10"
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={cn(
              'relative flex h-20 w-20 shrink-0 items-center justify-center',
              'rounded-lq-full',
              'border-2 border-lq-primary',
              'border-b-[length:var(--lq-depth-md)] border-b-lq-primary-depth',
              'bg-lq-primary/15',
              'shadow-lq-md',
              'text-lq-3xl font-extrabold text-lq-primary',
            )}
            aria-hidden="true"
          >
            <span className="tabular-nums">{initial}</span>
            <span className="absolute -bottom-1 -right-1">
              <QuestMascot variant="encouraging" size={36} decorative />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h1
              className="break-words text-lq-2xl font-extrabold text-lq-text-primary sm:text-lq-3xl"
              title={user.display_name}
            >
              {user.display_name}
            </h1>
            <p
              className="mt-0.5 break-all text-lq-sm font-semibold text-lq-text-secondary"
              title={`@${user.username}`}
            >
              @{user.username}
            </p>
            <p className="mt-2 text-lq-sm text-lq-text-secondary">
              <span className="font-bold text-lq-text-primary">Joined</span>{' '}
              <time dateTime={user.joined_at}>{joinedLabel}</time>
            </p>
            {courseTitle ? (
              <p className="mt-1 truncate text-lq-sm text-lq-text-secondary">
                Learning {courseTitle}
              </p>
            ) : null}
          </div>
        </div>

        <Link
          href="/settings"
          className={cn(
            'inline-flex min-h-11 items-center justify-center gap-2 self-start',
            'rounded-lq px-4 py-2',
            'border-2 border-lq-border-default bg-lq-bg-surface',
            'border-b-[length:var(--lq-depth-sm)] border-b-lq-border-strong',
            'text-lq-sm font-bold text-lq-text-primary',
            'shadow-lq-sm',
            'hover:translate-y-[-1px] hover:shadow-lq-md',
            'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-2',
            'sm:ml-auto',
          )}
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          Edit settings
        </Link>
      </div>
    </SurfaceCard>
  )
}
