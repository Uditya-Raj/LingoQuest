'use client'

import Link from 'next/link'

import { cn } from '@/lib/utils'

interface HeroCopyProps {
  courseLabel: string
}

/**
 * Welcome hero headline + primary CTA into the learner path.
 * Account sign-in is deferred (button visible, not linked).
 */
export function HeroCopy({ courseLabel }: HeroCopyProps) {
  return (
    <div className="mx-auto flex w-full max-w-[28rem] flex-col items-stretch text-center lg:mx-0 lg:max-w-[32rem] lg:items-start lg:text-left">
      <h1
        className={cn(
          'text-[2rem] font-extrabold leading-[1.15] tracking-tight text-lq-text-primary',
          'sm:text-[2.35rem] lg:text-[2.75rem] xl:text-[3.1rem]',
        )}
      >
        The fun, fast, and rewarding way to learn {courseLabel}!
      </h1>

      <div className="mt-8 flex w-full flex-col gap-3 sm:mt-10">
        <Link
          href="/learn"
          className={cn(
            'inline-flex min-h-[52px] w-full items-center justify-center',
            'rounded-2xl px-6 text-[15px] font-extrabold uppercase tracking-[0.04em]',
            'bg-lq-success text-lq-text-inverse',
            'border-b-[4px] border-b-lq-success-depth',
            'shadow-[0_2px_0_rgba(0,0,0,0.04)]',
            'transition-[transform,border-width,box-shadow] duration-100',
            'hover:bg-lq-success-hover',
            'active:translate-y-[4px] active:border-b-0',
            'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-2',
            'dark:text-[#0b1418] dark:shadow-[0_8px_24px_rgba(88,204,2,0.25)]',
          )}
        >
          Get Started
        </Link>

        <button
          type="button"
          disabled
          title="Account sign-in is not available in this demo"
          className={cn(
            'inline-flex min-h-[52px] w-full items-center justify-center',
            'rounded-2xl px-6 text-[15px] font-extrabold uppercase tracking-[0.04em]',
            'bg-lq-bg-surface text-lq-secondary',
            'border-2 border-lq-border-strong border-b-[4px]',
            'cursor-not-allowed opacity-60',
            'dark:bg-[#1a2c34] dark:text-[#7ddfd4] dark:border-[#3a5c6b] dark:opacity-70',
          )}
        >
          I already have an account
        </button>
      </div>

      <p className="mt-5 text-lq-sm leading-relaxed text-lq-text-secondary sm:mt-6">
        Free forever. No ads. Just a streak of tiny wins, guided by Quest.
      </p>
    </div>
  )
}
