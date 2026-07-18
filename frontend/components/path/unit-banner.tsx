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

const THEME_STYLES: Record<string, { gradient: string; depth: string }> = {
  meadow: {
    gradient: 'from-[#58cc02] via-[#4db802] to-[#3f8c01]',
    depth: 'border-b-[#2d6601]',
  },
  ocean: {
    gradient: 'from-[#1cb0f6] via-[#1a9fe0] to-[#1682b8]',
    depth: 'border-b-[#0d5f8a]',
  },
  violet: {
    gradient: 'from-[#ce82ff] via-[#c06ef0] to-[#a14edc]',
    depth: 'border-b-[#7b3daa]',
  },
}

function themeStyles(colorTheme: string): { gradient: string; depth: string } {
  return THEME_STYLES[colorTheme] ?? {
    gradient: 'from-lq-primary to-lq-primary-depth',
    depth: 'border-b-lq-primary-depth',
  }
}

export function UnitBanner({
  title,
  description,
  colorTheme,
  unitIndex,
  showMascot = false,
  titleId,
}: UnitBannerProps) {
  const theme = themeStyles(colorTheme)

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lq-xl',
        'border-b-[length:var(--lq-depth-lg)]',
        'bg-gradient-to-br text-white shadow-lq-lg',
        'px-5 py-5 sm:px-6 sm:py-6',
        theme.gradient,
        theme.depth,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.12),transparent_60%)]" />
      <div className={cn('relative', showMascot && 'pr-16 sm:pr-20')}>
        <p className="text-lq-xs font-extrabold uppercase tracking-[0.15em] text-white/70">
          Unit {unitIndex}
        </p>
        <h2
          id={titleId}
          className="mt-1.5 text-lq-xl font-extrabold leading-tight sm:text-lq-2xl"
        >
          {title}
        </h2>
        <p className="mt-1 max-w-[40ch] text-lq-sm leading-snug text-white/85">
          {description}
        </p>
      </div>
      {showMascot ? (
        <div className="pointer-events-none absolute -bottom-2 right-1 sm:-bottom-1 sm:right-3">
          <QuestMascot variant="encouraging" size={68} decorative className="drop-shadow-md" />
        </div>
      ) : null}
    </div>
  )
}
