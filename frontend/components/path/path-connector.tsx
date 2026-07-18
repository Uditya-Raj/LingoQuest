'use client'

import type { SkillStatus } from '@/lib/contracts/common'
import type { PathOffset } from '@/lib/path/current-skill'
import { pathOffsetForIndex } from '@/lib/path/current-skill'

interface PathConnectorProps {
  fromStatus: SkillStatus
  toStatus: SkillStatus
  fromIndex: number
  toIndex: number
}

/** Map path offsets to SVG x% aligned with SkillNode translate classes. */
function offsetToX(offset: PathOffset): number {
  switch (offset) {
    case 'far-left': return 30
    case 'left': return 40
    case 'center': return 50
    case 'right': return 60
    case 'far-right': return 70
  }
}

export function PathConnector({ fromStatus, toStatus, fromIndex, toIndex }: PathConnectorProps) {
  const complete =
    fromStatus === 'completed' &&
    (toStatus === 'completed' ||
      toStatus === 'in_progress' ||
      toStatus === 'available')
  const locked = toStatus === 'locked'

  const fromOffset = pathOffsetForIndex(fromIndex)
  const toOffset = pathOffsetForIndex(toIndex)
  const x1 = offsetToX(fromOffset)
  const x2 = offsetToX(toOffset)

  const strokeColor = complete
    ? 'var(--lq-success)'
    : locked
      ? 'var(--lq-locked-border)'
      : 'var(--lq-primary)'

  const strokeOpacity = complete ? 1 : locked ? 0.4 : 0.3
  const strokeDash = locked ? '6 4' : 'none'

  const h = 56
  const midY = h / 2
  const cpX1 = x1 + (x2 - x1) * 0.15
  const cpX2 = x2 - (x2 - x1) * 0.15

  return (
    <div
      className="relative z-0 -my-2 flex h-14 w-full justify-center sm:h-16"
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 100 ${h}`}
        className="h-full w-full max-w-md"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d={`M ${x1} 0 C ${cpX1} ${midY}, ${cpX2} ${midY}, ${x2} ${h}`}
          stroke={strokeColor}
          strokeWidth="3"
          strokeOpacity={strokeOpacity}
          strokeDasharray={strokeDash}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  )
}
