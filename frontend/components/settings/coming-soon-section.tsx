'use client'

import { Globe2, Mic, Sparkles, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { SurfaceCard } from '@/components/ui/surface-card'
import { cn } from '@/lib/utils'

interface ComingSoonItem {
  id: string
  title: string
  description: string
  icon: LucideIcon
}

const COMING_SOON_ITEMS: readonly ComingSoonItem[] = [
  {
    id: 'pronunciation',
    title: 'Pronunciation practice',
    description:
      'Real speech recognition and pronunciation scoring are not available in this demo.',
    icon: Mic,
  },
  {
    id: 'subscription',
    title: 'Super & in-app purchases',
    description:
      'Subscriptions and gem purchases are Coming Soon. Gems already on your profile stay informational.',
    icon: Sparkles,
  },
  {
    id: 'friends',
    title: 'Friends & social',
    description:
      'Friend lists and social feeds are Coming Soon. The seeded leaderboard remains available.',
    icon: Users,
  },
  {
    id: 'languages',
    title: 'More languages',
    description:
      'Additional language courses are Coming Soon. Your Spanish trail stays ready to explore.',
    icon: Globe2,
  },
] as const

/**
 * Honest, non-interactive Coming Soon placeholders for deferred features.
 */
export function ComingSoonSection({ className }: { className?: string }) {
  return (
    <section
      className={cn('space-y-3', className)}
      aria-labelledby="coming-soon-heading"
    >
      <div>
        <h2 id="coming-soon-heading" className="text-lq-lg font-extrabold">
          Coming Soon
        </h2>
        <p className="mt-1 text-lq-sm text-lq-text-secondary">
          These features are planned for later. They are not available and do not
          call the LingoQuest API.
        </p>
      </div>
      <ul className="space-y-3" aria-label="Coming Soon features">
        {COMING_SOON_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.id}>
              <SurfaceCard
                className="bg-lq-bg-sunken/50 p-4 opacity-90"
                aria-disabled="true"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lq bg-lq-bg-surface text-lq-text-secondary"
                    aria-hidden="true"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-lq-text-primary">
                      {item.title}{' '}
                      <span className="text-lq-xs font-bold uppercase tracking-wide text-lq-text-secondary">
                        (Coming Soon)
                      </span>
                    </p>
                    <p className="mt-1 text-lq-sm text-lq-text-secondary">
                      {item.description}
                    </p>
                  </div>
                </div>
              </SurfaceCard>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
