'use client'

import { useState } from 'react'

import { HeroCopy } from '@/components/welcome/hero-copy'
import { HeroIllustration } from '@/components/welcome/hero-illustration'
import {
  LanguageBar,
  type WelcomeCourseId,
} from '@/components/welcome/language-bar'
import { WelcomeNav } from '@/components/welcome/welcome-nav'
import { cn } from '@/lib/utils'

const COURSE_LABELS: Record<WelcomeCourseId, string> = {
  english: 'English',
  spanish: 'Spanish',
  french: 'French',
  german: 'German',
  italian: 'Italian',
  portuguese: 'Portuguese',
  math: 'Math',
  chess: 'Chess',
}

/**
 * Polished onboarding welcome screen before the learner dashboard.
 * No auth — both CTAs continue as the seeded learner at `/`.
 */
export function WelcomePage() {
  const [course, setCourse] = useState<WelcomeCourseId>('spanish')

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-lq-bg-page text-lq-text-primary dark:bg-[#0b1418]">
      {/* Soft ambient glow — brighter layered glow in dark only */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-[75vh]',
          'bg-[radial-gradient(ellipse_at_50%_20%,rgba(88,204,2,0.08),transparent_55%)]',
          'dark:bg-[radial-gradient(ellipse_at_42%_18%,rgba(88,204,2,0.16),transparent_52%),radial-gradient(ellipse_at_72%_35%,rgba(28,176,246,0.10),transparent_48%)]',
        )}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[radial-gradient(circle_at_50%_100%,rgba(31,53,64,0.55),transparent_45%)]"
      />

      <WelcomeNav />

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-7.5rem)] w-full max-w-[1100px] flex-col px-5 pb-28 pt-6 sm:px-8 sm:pb-32 lg:px-12 lg:pt-4">
        <div className="flex flex-1 flex-col items-center justify-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12 xl:gap-16">
          <div className="order-1 w-full max-w-[480px] shrink-0 lg:order-1">
            <HeroIllustration />
          </div>

          <div className="order-2 w-full lg:order-2 lg:flex lg:justify-end">
            <HeroCopy courseLabel={COURSE_LABELS[course]} />
          </div>
        </div>
      </main>

      <LanguageBar selected={course} onSelect={setCourse} />
    </div>
  )
}
