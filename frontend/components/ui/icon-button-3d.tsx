'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type IconButton3DSize = 'sm' | 'md' | 'lg'

interface IconButton3DProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: IconButton3DSize
  loading?: boolean
  active?: boolean
  children: ReactNode
  'aria-label': string
}

const sizeStyles: Record<IconButton3DSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
}

const iconSizes: Record<IconButton3DSize, string> = {
  sm: '[&>svg]:h-4 [&>svg]:w-4',
  md: '[&>svg]:h-5 [&>svg]:w-5',
  lg: '[&>svg]:h-6 [&>svg]:w-6',
}

export const IconButton3D = forwardRef<HTMLButtonElement, IconButton3DProps>(
  function IconButton3D(
    { size = 'md', loading = false, active = false, disabled, className, children, ...props },
    ref,
  ) {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          'relative inline-flex items-center justify-center',
          'rounded-lq-full select-none',
          'bg-lq-bg-surface text-lq-text-primary',
          'border-2 border-lq-border-default',
          'border-b-[length:var(--lq-depth-sm)] border-b-lq-border-strong',
          'shadow-lq-sm',
          'transition-all duration-[var(--lq-duration-press)] ease-[var(--lq-ease-out)]',
          'translate-y-0',
          'hover:translate-y-[-1px] hover:shadow-lq-md',
          'active:translate-y-[var(--lq-depth-sm)] active:border-b-2 active:shadow-none',
          'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-2',
          active && 'bg-lq-selected-bg border-lq-selected-border',
          isDisabled && 'opacity-[var(--lq-disabled-opacity)] pointer-events-none',
          iconSizes[size],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="sr-only">Loading</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  },
)
