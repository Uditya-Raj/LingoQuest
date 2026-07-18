'use client'

import { forwardRef, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FeedbackVariant = 'correct' | 'incorrect'

interface FeedbackSurfaceProps {
  open: boolean
  variant: FeedbackVariant
  message: string
  /** Accessible announcement; defaults to message. */
  announcement?: string
  solution?: ReactNode
  heartsLabel?: string
  className?: string
  children?: ReactNode
}

export const FeedbackSurface = forwardRef<HTMLDivElement, FeedbackSurfaceProps>(
  function FeedbackSurface(
    {
      open,
      variant,
      message,
      announcement,
      solution,
      heartsLabel,
      className,
      children,
    },
    ref,
  ) {
    const isCorrect = variant === 'correct'
    const reduceMotion = useReducedMotion()

    return (
      <AnimatePresence>
        {open && (
          <motion.div
            ref={ref}
            initial={reduceMotion ? { opacity: 0 } : { y: '100%' }}
            animate={
              reduceMotion
                ? { opacity: 1 }
                : isCorrect
                  ? { y: 0, scale: [1, 1.01, 1] }
                  : { y: 0 }
            }
            exit={reduceMotion ? { opacity: 0 } : { y: '100%' }}
            transition={
              reduceMotion
                ? { duration: 0.15 }
                : { type: 'spring', stiffness: 350, damping: 26, mass: 1 }
            }
            role="status"
            aria-live="assertive"
            aria-atomic="true"
            className={cn(
              'w-full border-t-[3px] px-4 pt-4',
              'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
              'shadow-[0_-8px_24px_rgba(15,23,42,0.12)]',
              'max-h-[min(48vh,22rem)] overflow-y-auto',
              isCorrect
                ? 'border-t-lq-success bg-lq-success-bg'
                : 'border-t-lq-error bg-lq-error-bg',
              className,
            )}
            style={{ zIndex: 'var(--lq-z-feedback)' }}
          >
            <div className="mx-auto flex max-w-lq-narrow items-start gap-3">
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lq-full',
                  'border-b-[length:var(--lq-depth-sm)]',
                  isCorrect
                    ? 'border-b-lq-success-depth bg-lq-success text-white'
                    : 'border-b-lq-error-depth bg-lq-error text-white',
                )}
                aria-hidden="true"
              >
                {isCorrect ? (
                  <Check className="h-5 w-5" strokeWidth={3} />
                ) : (
                  <X className="h-5 w-5" strokeWidth={3} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="sr-only">{announcement ?? message}</p>
                <p
                  className={cn(
                    'text-lq-lg font-extrabold',
                    isCorrect ? 'text-lq-text-success' : 'text-lq-text-error',
                  )}
                  aria-hidden="true"
                >
                  {message}
                </p>
                {solution ? (
                  <div className="mt-1 text-lq-base text-lq-text-primary">
                    {solution}
                  </div>
                ) : null}
                {heartsLabel ? (
                  <p className="mt-2 text-lq-xs font-bold text-lq-text-secondary">
                    {heartsLabel}
                  </p>
                ) : null}
              </div>
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    )
  },
)
