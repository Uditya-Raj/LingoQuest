'use client'

import { forwardRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FeedbackVariant = 'correct' | 'incorrect'

interface FeedbackSurfaceProps {
  open: boolean
  variant: FeedbackVariant
  message: string
  solution?: string
  className?: string
  children?: ReactNode
}

export const FeedbackSurface = forwardRef<HTMLDivElement, FeedbackSurfaceProps>(
  function FeedbackSurface(
    { open, variant, message, solution, className, children },
    ref,
  ) {
    const isCorrect = variant === 'correct'

    return (
      <AnimatePresence>
        {open && (
          <motion.div
            ref={ref}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 25, mass: 1 }}
            role="status"
            aria-live="assertive"
            className={cn(
              'w-full px-4 py-4',
              isCorrect
                ? 'bg-lq-success-bg border-t-2 border-t-lq-success'
                : 'bg-lq-error-bg border-t-2 border-t-lq-error',
              className,
            )}
            style={{ zIndex: 'var(--lq-z-feedback)' }}
          >
            <div className="mx-auto max-w-lq-narrow flex items-start gap-3">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lq-full',
                  isCorrect ? 'bg-lq-success text-white' : 'bg-lq-error text-white',
                )}
                aria-hidden="true"
              >
                {isCorrect ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-lq-lg font-bold',
                    isCorrect ? 'text-lq-text-success' : 'text-lq-text-error',
                  )}
                >
                  {message}
                </p>
                {solution && (
                  <p className="text-lq-base mt-1">{solution}</p>
                )}
              </div>
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    )
  },
)
