'use client'

import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton(
    { variant = 'rectangular', width, height, className, style, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(
          'animate-pulse bg-lq-bg-sunken',
          variant === 'circular' && 'rounded-lq-full',
          variant === 'text' && 'rounded-lq-sm h-4',
          variant === 'rectangular' && 'rounded-lq',
          className,
        )}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          ...style,
        }}
        {...props}
      />
    )
  },
)
