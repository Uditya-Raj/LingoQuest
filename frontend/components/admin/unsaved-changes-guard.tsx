'use client'

import { Button3D } from '@/components/ui/button-3d'
import { Modal } from '@/components/ui/modal'

interface UnsavedChangesGuardProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

/**
 * Accessible confirmation before discarding an admin draft.
 */
export function UnsavedChangesGuard({
  open,
  onCancel,
  onConfirm,
}: UnsavedChangesGuardProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      labelledBy="unsaved-changes-title"
      describedBy="unsaved-changes-desc"
    >
      <div className="space-y-4 p-2">
        <h2 id="unsaved-changes-title" className="text-lq-lg font-extrabold">
          Discard unsaved changes?
        </h2>
        <p id="unsaved-changes-desc" className="text-lq-sm text-lq-text-secondary">
          Your draft has not been saved. Leaving this editor will discard those
          changes.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button3D type="button" variant="secondary" onClick={onCancel}>
            Keep editing
          </Button3D>
          <Button3D type="button" variant="danger" onClick={onConfirm}>
            Discard changes
          </Button3D>
        </div>
      </div>
    </Modal>
  )
}
