'use client'

import { useRef } from 'react'
import { X } from 'lucide-react'

import { IconButton3D } from '@/components/ui/icon-button-3d'
import { Modal } from '@/components/ui/modal'
import { Button3D } from '@/components/ui/button-3d'

interface LessonExitControlProps {
  skillTitle: string
  confirmOpen: boolean
  onRequestExit: () => void
  onConfirmExit: () => void
  onCancelExit: () => void
}

export function LessonExitControl({
  skillTitle,
  confirmOpen,
  onRequestExit,
  onConfirmExit,
  onCancelExit,
}: LessonExitControlProps) {
  const exitButtonRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <IconButton3D
        ref={exitButtonRef}
        aria-label={`Exit ${skillTitle} lesson`}
        onClick={onRequestExit}
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </IconButton3D>

      <Modal
        open={confirmOpen}
        onClose={onCancelExit}
        labelledBy="lesson-exit-title"
        describedBy="lesson-exit-description"
        size="sm"
      >
        <h2 id="lesson-exit-title" className="text-lq-xl font-extrabold">
          Leave lesson?
        </h2>
        <p
          id="lesson-exit-description"
          className="mt-2 text-lq-sm text-lq-text-secondary"
        >
          Your progress is saved on the server. You can resume this lesson from
          the learning path later.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button3D variant="ghost" onClick={onCancelExit}>
            Keep learning
          </Button3D>
          <Button3D variant="secondary" onClick={onConfirmExit}>
            Exit to path
          </Button3D>
        </div>
      </Modal>
    </>
  )
}
