'use client'

import { QuestMascot } from '@/components/ui/quest-mascot'
import { cn } from '@/lib/utils'

interface UnitBannerProps {
  title: string
  description: string
  colorTheme: string
  unitIndex: number
  showMascot?: boolean
  titleId?: string
}

const THEME_STYLES: Record<string, string> = {
  meadow: 'from-[#58cc02] to-[#3f8c01]',
  ocean: 'from-[#1cb0f6] to-[#1682b8]',
  violet: 'from-[#ce82ff] to-[#a14edc]',
}

function themeClass(colorTheme: string): string {
  return THEME_STYLES[colorTheme] ?? 'from-lq-primary to-lq-primary-depth'
}

export function UnitBanner({
  title,
  description,
  colorTheme,
  unitIndex,
  showMascot = false,
  titleId,
}: UnitBannerProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lq-lg',
        'border-b-[length:var(--lq-depth-lg)] border-black/15',
        'bg-gradient-to-br text-lq-text-inverse shadow-lq-md',
        'px-4 py-4 sm:px-5 sm:py-5',
        themeClass(colorTheme),
      )}
    >
      <p className="text-lq-xs font-extrabold uppercase tracking-wider text-white/80">
        Unit {unitIndex}
      </p>
      <h2
        id={titleId}
        className="mt-1 text-lq-xl font-extrabold sm:text-lq-2xl"
      >
        {title}
      </h2>
      <p className="mt-1 max-w-prose text-lq-sm text-white/90">{description}</p>
      {showMascot ? (
        <div className="pointer-events-none absolute -right-1 -top-1 sm:right-2 sm:top-2">
          <QuestMascot variant="encouraging" size={56} decorative />
        </div>
      ) : null}
    </div>
  )
}
