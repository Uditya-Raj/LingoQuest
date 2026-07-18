'use client'

import { forwardRef, type SVGAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ProgressRingProps extends SVGAttributes<SVGSVGElement> {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  label: string
}

export const ProgressRing = forwardRef<SVGSVGElement, ProgressRingProps>(
  function ProgressRing(
    { value, max, size = 64, strokeWidth = 4, label, className, ...props },
    ref,
  ) {
    const clampedValue = Math.max(0, Math.min(value, max))
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const progress = max > 0 ? clampedValue / max : 0
    const strokeDashoffset = circumference * (1 - progress)

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className={cn('shrink-0', className)}
        {...props}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--lq-bg-sunken)"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--lq-crown-color)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke-dashoffset] duration-[var(--lq-duration-progress)] ease-[var(--lq-ease-out)]"
        />
      </svg>
    )
  },
)
