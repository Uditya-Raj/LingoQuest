'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Award, Crown, Flame, Sparkles, Star } from 'lucide-react'

import { CelebrationBurst } from '@/components/lesson/celebration-burst'
import { Button3D } from '@/components/ui/button-3d'
import { QuestMascot } from '@/components/ui/quest-mascot'
import { StatusBadge } from '@/components/ui/status-badge'
import { useToast } from '@/components/ui/toast'
import type { CompletionResponse } from '@/lib/contracts/lesson'
import type { CompletedData } from '@/lib/lesson/session-types'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/session-store'

interface LessonCompletedSurfaceProps {
  skillTitle: string
  completed: CompletedData
}

function ResultStat({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-lq-lg border-2 border-lq-border-default bg-lq-bg-sunken/40 px-3 py-2.5 text-left">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lq-full bg-lq-bg-surface text-lq-text-primary shadow-lq-sm"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-lq-xs font-bold uppercase tracking-wide text-lq-text-secondary">
          {label}
        </p>
        <p className="truncate text-lq-base font-extrabold">{value}</p>
      </div>
    </div>
  )
}

export function LessonCompletedSurface({
  skillTitle,
  completed,
}: LessonCompletedSurfaceProps) {
  const router = useRouter()
  const { addToast } = useToast()
  const reducedMotion = useReducedMotion()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const headingId = useId()
  const toastsFiredRef = useRef(false)

  const isFresh = completed.source === 'fresh'
  const completion: CompletionResponse | null = isFresh
    ? completed.completion
    : null

  const xpEarned = isFresh
    ? completed.completion.xp.earned
    : completed.summary.xp_earned
  const perfect = isFresh
    ? completed.completion.xp.perfect
    : completed.summary.perfect

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!isFresh || !completion || toastsFiredRef.current) return
    toastsFiredRef.current = true

    if (completion.streak.extended_today) {
      addToast({
        variant: 'streak',
        title: `${completion.streak.current} days strong!`,
        description: 'Keep the streak alive!',
        priority: 'low',
        duration: 3200,
        icon: <Flame className="text-lq-streak" />,
      })
    }

    for (const achievement of completion.achievements_unlocked) {
      addToast({
        variant: 'achievement',
        title: achievement.title,
        description: achievement.description,
        priority: 'normal',
        duration: 4200,
        icon: <Award className="text-lq-crown" />,
      })
    }
  }, [addToast, completion, isFresh])

  const handleReturnToPath = () => {
    useSessionStore.setState({ completion: null, attempt: null })
    router.push('/')
  }

  return (
    <main className="relative mx-auto flex min-h-[100dvh] max-w-lq-narrow flex-col px-4 py-6 sm:px-6 sm:py-8">
      <CelebrationBurst active />
      <div
        className={cn(
          'relative mt-auto mb-auto max-h-[min(100dvh-2rem,52rem)] space-y-5 overflow-y-auto',
          'rounded-lq-xl border-2 border-lq-border-default',
          'border-b-[length:var(--lq-depth-xl)] border-b-lq-border-strong',
          'bg-lq-bg-surface p-6 text-center shadow-lq-xl',
        )}
      >
        <div
          className={cn(
            'mx-auto',
            !reducedMotion && 'motion-safe:animate-[lq-heart-loss_500ms_ease-out]',
          )}
        >
          <QuestMascot variant="celebrating" size={88} decorative />
        </div>

        <div>
          <StatusBadge variant="success">Quest accomplished</StatusBadge>
          <h1
            ref={headingRef}
            id={headingId}
            tabIndex={-1}
            className="mt-3 text-lq-2xl font-extrabold outline-none sm:text-lq-3xl"
          >
            Lesson complete!
          </h1>
          <p className="mt-1 text-lq-sm font-bold text-lq-text-secondary">
            {skillTitle}
          </p>
        </div>

        <div
          className={cn(
            'mx-auto flex h-28 w-28 flex-col items-center justify-center rounded-lq-full',
            'border-b-[length:var(--lq-depth-md)] border-b-lq-warning-depth',
            'bg-lq-xp-bg text-lq-text-primary shadow-lq-lg',
            !reducedMotion && 'motion-safe:animate-[lq-heart-loss_560ms_ease-out]',
          )}
          aria-label={`${xpEarned} XP earned`}
        >
          <Sparkles className="h-5 w-5 text-lq-xp" aria-hidden="true" />
          <p className="text-lq-3xl font-extrabold leading-none">{xpEarned}</p>
          <p className="text-lq-xs font-extrabold uppercase tracking-wide">XP</p>
        </div>

        {perfect ? (
          <div className="inline-flex items-center gap-2 rounded-lq-full bg-lq-success-bg px-3 py-1.5 text-lq-sm font-extrabold text-lq-text-success">
            <Star className="h-4 w-4" aria-hidden="true" />
            Perfect lesson
          </div>
        ) : null}

        {completion ? (
          <div className="grid gap-2 sm:grid-cols-2" aria-live="polite">
            <ResultStat
              label="Crown progress"
              value={`${completion.skill.new_crowns} / ${completion.skill.max_level}`}
              icon={<Crown className="h-4 w-4 text-lq-crown" />}
            />
            <ResultStat
              label="Streak"
              value={
                completion.streak.extended_today
                  ? `${completion.streak.current} days · extended`
                  : `${completion.streak.current} days`
              }
              icon={<Flame className="h-4 w-4 text-lq-streak" />}
            />
            <ResultStat
              label="Total XP"
              value={String(completion.user_totals.total_xp)}
              icon={<Sparkles className="h-4 w-4 text-lq-xp" />}
            />
            <ResultStat
              label="Hearts · Gems"
              value={`${completion.user_totals.hearts} · ${completion.user_totals.gems}`}
              icon={<Award className="h-4 w-4 text-lq-primary" />}
            />
          </div>
        ) : (
          <p className="text-lq-sm text-lq-text-secondary">
            You earned {xpEarned} XP
            {perfect ? ' with a perfect bonus' : ''}.
          </p>
        )}

        {completion && completion.achievements_unlocked.length > 0 ? (
          <div className="max-h-40 space-y-2 overflow-y-auto text-left">
            <p className="text-lq-xs font-extrabold uppercase tracking-wide text-lq-text-secondary">
              Achievements unlocked
            </p>
            {completion.achievements_unlocked.map((achievement) => (
              <div
                key={achievement.key}
                className="rounded-lq-lg border-2 border-lq-crown bg-lq-crown-bg px-3 py-2"
              >
                <p className="text-lq-sm font-extrabold">{achievement.title}</p>
                <p className="text-lq-xs text-lq-text-secondary">
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="space-y-2 pt-1">
          <Button3D className="w-full" onClick={handleReturnToPath}>
            Return to learning path
          </Button3D>
          <Button3D
            variant="ghost"
            className="w-full"
            onClick={() => {
              useSessionStore.setState({ completion: null, attempt: null })
              router.push('/profile')
            }}
          >
            View profile
          </Button3D>
        </div>
      </div>
    </main>
  )
}
