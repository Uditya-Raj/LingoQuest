'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Button3DVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'timed' | 'ghost'
export type Button3DSize = 'sm' | 'md' | 'lg'

interface Button3DProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Button3DVariant
  size?: Button3DSize
  loading?: boolean
  children: ReactNode
}

const variantStyles: Record<Button3DVariant, string> = {
  primary: [
    'bg-lq-primary text-lq-text-inverse',
    'border-b-[length:var(--lq-depth-md)] border-b-lq-primary-depth',
    'hover:bg-lq-primary-hover',
    'shadow-lq-md hover:shadow-lq-lg',
  ].join(' '),
  secondary: [
    'bg-lq-secondary text-lq-text-inverse',
    'border-b-[length:var(--lq-depth-md)] border-b-lq-secondary-depth',
    'hover:bg-lq-secondary-hover',
    'shadow-lq-md hover:shadow-lq-lg',
  ].join(' '),
  success: [
    'bg-lq-success text-lq-text-inverse',
    'border-b-[length:var(--lq-depth-md)] border-b-lq-success-depth',
    'hover:bg-lq-success-hover',
    'shadow-lq-md hover:shadow-lq-lg',
  ].join(' '),
  danger: [
    'bg-lq-error text-lq-text-inverse',
    'border-b-[length:var(--lq-depth-md)] border-b-lq-error-depth',
    'hover:bg-lq-error-hover',
    'shadow-lq-md hover:shadow-lq-lg',
  ].join(' '),
  timed: [
    'bg-lq-timed text-lq-text-inverse',
    'border-b-[length:var(--lq-depth-md)] border-b-lq-secondary-depth',
    'hover:bg-lq-secondary-hover',
    'shadow-lq-md hover:shadow-lq-lg',
  ].join(' '),
  ghost: [
    'bg-transparent text-lq-text-primary',
    'border-b-0',
    'hover:bg-lq-bg-sunken',
    'shadow-none hover:shadow-none',
  ].join(' '),
}

const sizeStyles: Record<Button3DSize, string> = {
  sm: 'h-9 px-3 text-lq-sm font-semibold rounded-lq-sm',
  md: 'h-12 px-5 text-lq-base font-bold rounded-lq',
  lg: 'h-14 px-8 text-lq-lg font-extrabold rounded-lq',
}

export const Button3D = forwardRef<HTMLButtonElement, Button3DProps>(
  function Button3D(
    { variant = 'primary', size = 'md', loading = false, disabled, className, children, ...props },
    ref,
  ) {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          'relative inline-flex items-center justify-center gap-2',
          'select-none whitespace-nowrap',
          'transition-all duration-[var(--lq-duration-press)] ease-[var(--lq-ease-out)]',
          'translate-y-0',
          'active:translate-y-[var(--lq-depth-md)] active:border-b-0 active:shadow-lq-sm',
          'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-2',
          variantStyles[variant],
          sizeStyles[size],
          isDisabled && 'opacity-[var(--lq-disabled-opacity)] pointer-events-none border-b-0 shadow-none translate-y-0',
          className,
        )}
        {...props}
      >
        {loading && (
          <Loader2
            className="h-4 w-4 animate-spin"
            aria-hidden="true"
          />
        )}
        <span className={cn(loading && 'opacity-0', 'inline-flex items-center gap-2')}>
          {children}
        </span>
        {loading && (
          <span className="sr-only">Loading</span>
        )}
      </button>
    )
  },
)
