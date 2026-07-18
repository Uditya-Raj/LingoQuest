'use client'

import type { SkillStatus } from '@/lib/contracts/common'
import { cn } from '@/lib/utils'

interface PathConnectorProps {
  fromStatus: SkillStatus
  toStatus: SkillStatus
}

/**
 * Vertical connector between skill nodes. Sits behind nodes.
 */
export function PathConnector({ fromStatus, toStatus }: PathConnectorProps) {
  const complete =
    fromStatus === 'completed' &&
    (toStatus === 'completed' ||
      toStatus === 'in_progress' ||
      toStatus === 'available')
  const locked = toStatus === 'locked'

  return (
    <div
      className="relative z-0 flex h-10 w-full justify-center sm:h-12"
      aria-hidden="true"
    >
      <div
        className={cn(
          'w-1.5 rounded-lq-full',
          complete && 'bg-lq-success',
          !complete && !locked && 'bg-lq-primary/40',
          locked && 'bg-lq-locked-border',
        )}
      />
    </div>
  )
}
