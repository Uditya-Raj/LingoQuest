'use client'

import { forwardRef, type SVGAttributes } from 'react'
import { cn } from '@/lib/utils'

export type MascotVariant = 'neutral' | 'encouraging' | 'celebrating' | 'concerned'

interface QuestMascotProps extends Omit<SVGAttributes<SVGSVGElement>, 'children'> {
  variant?: MascotVariant
  size?: number
  label?: string
  decorative?: boolean
}

/**
 * Quest — the LingoQuest explorer fox mascot.
 * Original SVG, warm orange body, cream markings, teal bandana.
 */
export const QuestMascot = forwardRef<SVGSVGElement, QuestMascotProps>(
  function QuestMascot(
    { variant = 'neutral', size = 64, label, decorative = true, className, ...props },
    ref,
  ) {
    const eyeVariant = getEyeProps(variant)
    const mouthVariant = getMouthPath(variant)
    const tailRotation = variant === 'celebrating' ? -25 : variant === 'encouraging' ? -10 : 0
    const bodyBounce = variant === 'celebrating' ? -3 : 0

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role={decorative ? 'presentation' : 'img'}
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : (label ?? `Quest fox, ${variant}`)}
        className={cn('shrink-0', className)}
        {...props}
      >
        <g transform={`translate(0, ${bodyBounce})`}>
          {/* Tail */}
          <g transform={`rotate(${tailRotation}, 22, 55)`}>
            <ellipse cx="18" cy="52" rx="10" ry="6" fill="#E88A2D" transform="rotate(-30, 18, 52)" />
            <ellipse cx="14" cy="50" rx="5" ry="3" fill="#FCEBD0" transform="rotate(-30, 14, 50)" />
          </g>

          {/* Body */}
          <ellipse cx="40" cy="54" rx="16" ry="14" fill="#F0972B" />
          {/* Belly */}
          <ellipse cx="40" cy="57" rx="10" ry="9" fill="#FCEBD0" />

          {/* Head */}
          <circle cx="40" cy="32" r="16" fill="#F0972B" />
          {/* Face patch */}
          <ellipse cx="40" cy="36" rx="11" ry="10" fill="#FCEBD0" />

          {/* Left ear */}
          <polygon points="28,22 24,8 34,18" fill="#F0972B" />
          <polygon points="29,20 26,12 33,18" fill="#FFD4A8" />
          {/* Right ear */}
          <polygon points="52,22 56,8 46,18" fill="#F0972B" />
          <polygon points="51,20 54,12 47,18" fill="#FFD4A8" />

          {/* Eyes */}
          <circle cx={35} cy={eyeVariant.y} r={eyeVariant.r} fill="#3C3C3C" />
          <circle cx={45} cy={eyeVariant.y} r={eyeVariant.r} fill="#3C3C3C" />
          {/* Eye shine */}
          <circle cx={36.5} cy={eyeVariant.y - 1} r={1} fill="#FFFFFF" />
          <circle cx={46.5} cy={eyeVariant.y - 1} r={1} fill="#FFFFFF" />

          {/* Eyebrows */}
          {variant === 'concerned' && (
            <>
              <line x1="31" y1="26" x2="37" y2="24" stroke="#3C3C3C" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="43" y1="24" x2="49" y2="26" stroke="#3C3C3C" strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}
          {(variant === 'encouraging' || variant === 'celebrating') && (
            <>
              <line x1="32" y1="25" x2="37" y2="26" stroke="#3C3C3C" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="43" y1="26" x2="48" y2="25" stroke="#3C3C3C" strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}

          {/* Nose */}
          <ellipse cx="40" cy="36" rx="3" ry="2" fill="#3C3C3C" />

          {/* Mouth */}
          <path d={mouthVariant} stroke="#3C3C3C" strokeWidth="1.5" strokeLinecap="round" fill="none" />

          {/* Bandana */}
          <path
            d="M 26 40 Q 33 44, 40 43 Q 47 44, 54 40"
            stroke="#2BB5A0"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="40" cy="43" r="2.5" fill="#2BB5A0" />
          {/* Bandana knot tails */}
          <path d="M 37 45 L 34 52" stroke="#2BB5A0" strokeWidth="2" strokeLinecap="round" />
          <path d="M 43 45 L 46 52" stroke="#2BB5A0" strokeWidth="2" strokeLinecap="round" />

          {/* Arms */}
          <ellipse cx="26" cy="52" rx="4" ry="6" fill="#F0972B" transform="rotate(15, 26, 52)" />
          <ellipse cx="54" cy="52" rx="4" ry="6" fill="#F0972B" transform="rotate(-15, 54, 52)" />

          {/* Feet */}
          <ellipse cx="34" cy="67" rx="5" ry="3" fill="#F0972B" />
          <ellipse cx="46" cy="67" rx="5" ry="3" fill="#F0972B" />

          {/* Celebrating stars */}
          {variant === 'celebrating' && (
            <>
              <polygon points="12,14 13,10 14,14 18,14 15,16 16,20 12,18 8,20 9,16 6,14" fill="#FFC800" opacity="0.8" />
              <polygon points="62,10 63,7 64,10 67,10 65,12 66,15 62,13 58,15 59,12 56,10" fill="#FFC800" opacity="0.6" />
            </>
          )}
        </g>
      </svg>
    )
  },
)

function getEyeProps(variant: MascotVariant): { y: number; r: number } {
  switch (variant) {
    case 'celebrating':
      return { y: 29, r: 3 }
    case 'concerned':
      return { y: 30, r: 2.5 }
    case 'encouraging':
      return { y: 29, r: 3 }
    default:
      return { y: 30, r: 2.5 }
  }
}

function getMouthPath(variant: MascotVariant): string {
  switch (variant) {
    case 'celebrating':
      return 'M 36 39 Q 40 44, 44 39'
    case 'encouraging':
      return 'M 36 39 Q 40 43, 44 39'
    case 'concerned':
      return 'M 36 40 Q 40 38, 44 40'
    default:
      return 'M 37 39 Q 40 42, 43 39'
  }
}
