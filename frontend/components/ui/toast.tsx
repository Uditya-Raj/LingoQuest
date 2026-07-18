'use client'

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─── Types ─── */

export type ToastVariant = 'default' | 'success' | 'error' | 'xp' | 'streak' | 'achievement'
export type ToastPriority = 'low' | 'normal' | 'high'

interface ToastData {
  id: string
  variant: ToastVariant
  title: string
  description?: string
  icon?: ReactNode
  priority: ToastPriority
  duration: number
}

interface ToastContextValue {
  addToast: (toast: Omit<ToastData, 'id'>) => string
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

/* ─── Individual Toast ─── */

const variantStyles: Record<ToastVariant, string> = {
  default: 'bg-lq-bg-surface border-lq-border-default',
  success: 'bg-lq-success-bg border-lq-success',
  error: 'bg-lq-error-bg border-lq-error',
  xp: 'bg-lq-xp-bg border-lq-xp',
  streak: 'bg-lq-streak-bg border-lq-streak',
  achievement: 'bg-lq-crown-bg border-lq-crown',
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastData
  onDismiss: (id: string) => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'pointer-events-auto',
        'w-80 max-w-[calc(100vw-2rem)]',
        'rounded-lq-lg',
        'border-2',
        'border-b-[length:var(--lq-depth-sm)] border-b-lq-border-strong',
        'shadow-lq-lg',
        'p-3 pr-10',
        variantStyles[toast.variant],
      )}
    >
      <div className="flex items-start gap-2.5">
        {toast.icon && (
          <span className="shrink-0 mt-0.5 [&>svg]:h-5 [&>svg]:w-5" aria-hidden="true">
            {toast.icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-lq-sm font-bold">{toast.title}</p>
          {toast.description && (
            <p className="text-lq-xs text-lq-text-secondary mt-0.5">{toast.description}</p>
          )}
        </div>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className={cn(
          'absolute top-2 right-2',
          'h-6 w-6 flex items-center justify-center',
          'rounded-lq-full text-lq-text-secondary',
          'hover:bg-lq-bg-sunken',
          'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-1',
        )}
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
}

/* ─── Provider ─── */

const MAX_VISIBLE = 2

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])
  const counterRef = useRef(0)
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (toast: Omit<ToastData, 'id'>) => {
      const id = `toast-${++counterRef.current}`
      const full: ToastData = { ...toast, id }

      setToasts((prev) => {
        const sorted = [...prev, full].sort((a, b) => {
          const prio = { high: 0, normal: 1, low: 2 }
          return prio[a.priority] - prio[b.priority]
        })
        return sorted
      })

      if (toast.duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id)
        }, toast.duration)
        timersRef.current.set(id, timer)
      }

      return id
    },
    [dismissToast],
  )

  const visibleToasts = toasts.slice(0, MAX_VISIBLE)

  return (
    <ToastContext.Provider value={{ addToast, dismissToast }}>
      {children}
      <div
        aria-label="Notifications"
        className={cn(
          'fixed top-4 right-4 flex flex-col gap-2',
          'pointer-events-none',
          'max-sm:left-4 max-sm:right-4 max-sm:items-center',
        )}
        style={{ zIndex: 'var(--lq-z-toast)' }}
      >
        <AnimatePresence mode="popLayout">
          {visibleToasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
