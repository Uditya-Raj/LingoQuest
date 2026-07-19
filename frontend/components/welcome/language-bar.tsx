'use client'

import { Calculator, ChessKnight } from 'lucide-react'

import { cn } from '@/lib/utils'

export type WelcomeCourseId =
  | 'english'
  | 'spanish'
  | 'french'
  | 'german'
  | 'italian'
  | 'portuguese'
  | 'math'
  | 'chess'

interface CourseChip {
  id: WelcomeCourseId
  label: string
  available: boolean
  flag?: string
  Icon?: typeof Calculator
}

const COURSES: CourseChip[] = [
  { id: 'english', label: 'English', available: false, flag: '🇺🇸' },
  { id: 'spanish', label: 'Spanish', available: true, flag: '🇪🇸' },
  { id: 'french', label: 'French', available: false, flag: '🇫🇷' },
  { id: 'german', label: 'German', available: false, flag: '🇩🇪' },
  { id: 'italian', label: 'Italian', available: false, flag: '🇮🇹' },
  { id: 'portuguese', label: 'Portuguese', available: false, flag: '🇧🇷' },
  { id: 'math', label: 'Math', available: false, Icon: Calculator },
  { id: 'chess', label: 'Chess', available: false, Icon: ChessKnight },
]

interface LanguageBarProps {
  selected: WelcomeCourseId
  onSelect: (id: WelcomeCourseId) => void
}

/**
 * Fixed bottom course carousel. Only Spanish is available in the demo seed.
 */
export function LanguageBar({ selected, onSelect }: LanguageBarProps) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-30',
        'border-t border-lq-border-default/80 bg-lq-bg-surface/95 backdrop-blur-sm',
        'dark:border-white/5 dark:bg-[#101c22]/95',
        'pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3',
      )}
    >
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        <ul
          className={cn(
            'flex gap-2.5 overflow-x-auto pb-1',
            '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
          aria-label="Courses"
        >
          {COURSES.map((course) => {
            const active = selected === course.id
            const Icon = course.Icon
            return (
              <li key={course.id} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={active}
                  aria-disabled={!course.available || undefined}
                  title={
                    course.available
                      ? course.label
                      : `${course.label} — Coming soon`
                  }
                  onClick={() => {
                    if (!course.available) return
                    onSelect(course.id)
                  }}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-2 rounded-full px-3.5',
                    'text-[11px] font-extrabold uppercase tracking-[0.06em]',
                    'border transition-colors duration-150',
                    'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-2',
                    active
                      ? 'border-lq-success bg-lq-success text-lq-text-inverse shadow-[0_3px_0_0_var(--lq-success-depth)] dark:text-[#0b1418]'
                      : course.available
                        ? 'border-lq-border-strong bg-lq-bg-surface text-lq-text-primary hover:bg-lq-bg-sunken dark:bg-[#1a2c34] dark:border-[#3a5c6b]'
                        : 'cursor-not-allowed border-lq-border-default bg-lq-bg-surface text-lq-text-disabled opacity-80 dark:bg-[#152228] dark:border-[#2a3f48]',
                  )}
                >
                  {course.flag ? (
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-lq-bg-page text-sm leading-none shadow-sm dark:bg-[#0b1418]"
                      aria-hidden="true"
                    >
                      {course.flag}
                    </span>
                  ) : Icon ? (
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full',
                        course.id === 'math' ? 'bg-[#ff85c0]' : 'bg-[#5b8def]',
                        'text-white shadow-sm',
                      )}
                      aria-hidden="true"
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </span>
                  ) : null}
                  {course.label}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
