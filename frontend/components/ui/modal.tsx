'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose?: () => void
  dismissible?: boolean
  size?: 'sm' | 'md' | 'lg'
  labelledBy?: string
  describedBy?: string
  className?: string
  children: ReactNode
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  function Modal(
    {
      open,
      onClose,
      dismissible = true,
      size = 'md',
      labelledBy,
      describedBy,
      className,
      children,
    },
    ref,
  ) {
    const dialogRef = useRef<HTMLDivElement>(null)
    const previousFocusRef = useRef<HTMLElement | null>(null)

    const handleClose = useCallback(() => {
      if (dismissible && onClose) {
        onClose()
      }
    }, [dismissible, onClose])

    useEffect(() => {
      if (!open) return

      previousFocusRef.current = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'

      const timer = setTimeout(() => {
        const dialog = dialogRef.current
        if (!dialog) return

        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length > 0) {
          focusable[0].focus()
        } else {
          dialog.focus()
        }
      }, 50)

      return () => {
        clearTimeout(timer)
        document.body.style.overflow = ''
        previousFocusRef.current?.focus()
      }
    }, [open])

    useEffect(() => {
      if (!open) return

      function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape' && dismissible) {
          e.stopPropagation()
          handleClose()
          return
        }

        if (e.key !== 'Tab') return

        const dialog = dialogRef.current
        if (!dialog) return

        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }

      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }, [open, dismissible, handleClose])

    const sizeStyles: Record<string, string> = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
    }

    return (
      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 'var(--lq-z-modal)' }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-[var(--lq-bg-overlay)]"
              onClick={dismissible ? handleClose : undefined}
              aria-hidden="true"
            />

            {/* Dialog */}
            <motion.div
              ref={(node) => {
                (dialogRef as React.MutableRefObject<HTMLDivElement | null>).current = node
                if (typeof ref === 'function') ref(node)
                else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={labelledBy}
              aria-describedby={describedBy}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25, mass: 1 }}
              className={cn(
                'relative w-full',
                'bg-lq-bg-surface rounded-lq-xl',
                'border-2 border-lq-border-default',
                'border-b-[length:var(--lq-depth-xl)] border-b-lq-border-strong',
                'shadow-lq-xl',
                'p-6',
                'max-h-[90vh] overflow-y-auto',
                sizeStyles[size],
                className,
              )}
            >
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    )
  },
)
