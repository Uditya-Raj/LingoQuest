'use client'

import { useCallback, useMemo, useState } from 'react'

import {
  AdminAccessDenied,
  ContentManagerError,
  ContentManagerSkeleton,
} from '@/components/admin/admin-states'
import { ContentTree } from '@/components/admin/content-tree'
import { ExerciseEditor } from '@/components/admin/exercise-editor'
import { UnsavedChangesGuard } from '@/components/admin/unsaved-changes-guard'
import { Button3D } from '@/components/ui/button-3d'
import { SurfaceCard } from '@/components/ui/surface-card'
import { useContentManager } from '@/hooks/use-content-manager'
import type { AdminSelection } from '@/lib/admin/exercise-form-state'
import { EXERCISE_TYPE_LABELS } from '@/lib/admin/exercise-form-state'
import type { AdminExerciseRepresentation } from '@/lib/contracts/admin'
import { cn } from '@/lib/utils'

type MobilePane = 'tree' | 'editor'

/**
 * Functional content manager backed by GET/POST/PATCH admin exercise APIs.
 */
export function ContentManager({ className }: { className?: string }) {
  const manager = useContentManager()
  const [dirty, setDirty] = useState(false)
  const [pendingSelection, setPendingSelection] =
    useState<AdminSelection | null>(null)
  const [mobilePane, setMobilePane] = useState<MobilePane>('tree')
  const [baselineOverride, setBaselineOverride] =
    useState<AdminExerciseRepresentation | null>(null)

  const selectedExercise = useMemo(() => {
    if (manager.selection.kind !== 'exercise' || !manager.tree) return null
    if (
      baselineOverride &&
      baselineOverride.id === manager.selection.exerciseId
    ) {
      return baselineOverride
    }
    return manager.findExercise(manager.selection.exerciseId)
  }, [manager, baselineOverride])

  const requestSelection = useCallback(
    (next: AdminSelection) => {
      if (dirty) {
        setPendingSelection(next)
        return
      }
      setBaselineOverride(null)
      manager.setSelection(next)
      if (
        next.kind === 'exercise' ||
        next.kind === 'create' ||
        next.kind === 'lesson'
      ) {
        setMobilePane('editor')
      }
    },
    [dirty, manager],
  )

  const confirmDiscard = () => {
    if (!pendingSelection) return
    setDirty(false)
    setBaselineOverride(null)
    manager.setSelection(pendingSelection)
    setPendingSelection(null)
    if (
      pendingSelection.kind === 'exercise' ||
      pendingSelection.kind === 'create' ||
      pendingSelection.kind === 'lesson'
    ) {
      setMobilePane('editor')
    } else {
      setMobilePane('tree')
    }
  }

  const contextLabel = useMemo(() => {
    const sel = manager.selection
    if (!manager.tree) return ''
    for (const course of manager.tree.courses) {
      if (sel.kind === 'course' && sel.courseId === course.id) {
        return `Course · ${course.title}`
      }
      for (const unit of course.units) {
        if (sel.kind === 'unit' && sel.unitId === unit.id) {
          return `${course.title} · ${unit.title}`
        }
        for (const skill of unit.skills) {
          if (sel.kind === 'skill' && sel.skillId === skill.id) {
            return `${unit.title} · ${skill.title}`
          }
          for (const lesson of skill.lessons) {
            if (
              (sel.kind === 'lesson' ||
                sel.kind === 'create' ||
                sel.kind === 'exercise') &&
              sel.lessonId === lesson.id
            ) {
              return `${skill.title} · Lesson ${lesson.id} (${lesson.xp_reward} XP)`
            }
          }
        }
      }
    }
    return 'Content administration'
  }, [manager.selection, manager.tree])

  const onSaved = (exercise: AdminExerciseRepresentation) => {
    manager.applyExercise(exercise)
    setBaselineOverride(exercise)
    setDirty(false)

    let courseId = 0
    let unitId = 0
    let skillId = 0
    if (
      manager.selection.kind === 'create' ||
      manager.selection.kind === 'lesson' ||
      manager.selection.kind === 'exercise'
    ) {
      courseId = manager.selection.courseId
      unitId = manager.selection.unitId
      skillId = manager.selection.skillId
    } else if (manager.tree) {
      for (const course of manager.tree.courses) {
        for (const unit of course.units) {
          for (const skill of unit.skills) {
            if (skill.lessons.some((l) => l.id === exercise.lesson_id)) {
              courseId = course.id
              unitId = unit.id
              skillId = skill.id
            }
          }
        }
      }
    }

    manager.setSelection({
      kind: 'exercise',
      courseId,
      unitId,
      skillId,
      lessonId: exercise.lesson_id,
      exerciseId: exercise.id,
    })
    setMobilePane('editor')
  }

  if (manager.status === 'loading') {
    return <ContentManagerSkeleton className={className} />
  }

  if (manager.status === 'forbidden') {
    return (
      <AdminAccessDenied
        message={manager.error?.message}
        className={className}
      />
    )
  }

  if (manager.status === 'error' || !manager.tree) {
    return (
      <ContentManagerError
        message={manager.error?.message ?? 'Could not load content tree.'}
        onRetry={manager.reload}
        className={className}
      />
    )
  }

  const editorMode =
    manager.selection.kind === 'create'
      ? 'create'
      : manager.selection.kind === 'exercise'
        ? 'edit'
        : null

  const createLessonId =
    manager.selection.kind === 'create' ? manager.selection.lessonId : null

  return (
    <div className={cn('mx-auto w-full max-w-lq-wide space-y-4', className)}>
      <header className="space-y-1">
        <h1 className="text-lq-2xl font-extrabold sm:text-lq-3xl">
          Content manager
        </h1>
        <p className="text-lq-sm text-lq-text-secondary">
          Browse the course hierarchy and create or edit exercises through the
          LingoQuest administration API. Correct answers stay on this admin
          surface only.
        </p>
      </header>

      <div className="flex gap-2 lg:hidden">
        <Button3D
          type="button"
          size="sm"
          variant={mobilePane === 'tree' ? 'primary' : 'secondary'}
          onClick={() => setMobilePane('tree')}
        >
          Content tree
        </Button3D>
        <Button3D
          type="button"
          size="sm"
          variant={mobilePane === 'editor' ? 'primary' : 'secondary'}
          onClick={() => setMobilePane('editor')}
          disabled={editorMode === null && manager.selection.kind !== 'lesson'}
        >
          Editor
        </Button3D>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div
          className={cn(
            mobilePane === 'tree' ? 'block' : 'hidden',
            'lg:block',
          )}
        >
          <ContentTree
            tree={manager.tree}
            selection={manager.selection}
            onSelect={requestSelection}
          />
        </div>

        <div
          className={cn(
            mobilePane === 'editor' ? 'block' : 'hidden',
            'lg:block',
            'min-w-0',
          )}
        >
          {manager.selection.kind === 'lesson' ? (
            <SurfaceCard className="space-y-4 p-5">
              <h2 className="text-lq-lg font-extrabold">Lesson exercises</h2>
              <p className="text-lq-sm text-lq-text-secondary">{contextLabel}</p>
              <ul className="space-y-2" aria-label="Exercises in lesson">
                {(
                  manager.findLesson(manager.selection.lessonId)?.exercises ?? []
                ).map((exercise) => (
                  <li key={exercise.id}>
                    <button
                      type="button"
                      className="flex min-h-11 w-full items-center justify-between rounded-lq border border-lq-border-default px-3 text-left text-lq-sm hover:bg-lq-bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lq-focus"
                      onClick={() => {
                        if (manager.selection.kind !== 'lesson') return
                        requestSelection({
                          kind: 'exercise',
                          courseId: manager.selection.courseId,
                          unitId: manager.selection.unitId,
                          skillId: manager.selection.skillId,
                          lessonId: manager.selection.lessonId,
                          exerciseId: exercise.id,
                        })
                      }}
                    >
                      <span>
                        #{exercise.id} · {EXERCISE_TYPE_LABELS[exercise.type]}
                      </span>
                      <span className="text-lq-xs text-lq-text-secondary">
                        order {exercise.order_index}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <Button3D
                type="button"
                onClick={() => {
                  if (manager.selection.kind !== 'lesson') return
                  requestSelection({
                    kind: 'create',
                    courseId: manager.selection.courseId,
                    unitId: manager.selection.unitId,
                    skillId: manager.selection.skillId,
                    lessonId: manager.selection.lessonId,
                  })
                }}
              >
                Create exercise
              </Button3D>
            </SurfaceCard>
          ) : null}

          {editorMode === 'edit' && selectedExercise ? (
            <ExerciseEditor
              key={`edit-${selectedExercise.id}-${selectedExercise.updated_at}`}
              mode="edit"
              lessonId={selectedExercise.lesson_id}
              orderIndex={selectedExercise.order_index}
              baseline={selectedExercise}
              contextLabel={contextLabel}
              onSaved={onSaved}
              onDirtyChange={setDirty}
            />
          ) : null}

          {editorMode === 'create' && createLessonId !== null ? (
            <ExerciseEditor
              key={`create-${createLessonId}`}
              mode="create"
              lessonId={createLessonId}
              orderIndex={manager.nextOrderIndex(createLessonId)}
              baseline={null}
              contextLabel={contextLabel}
              onSaved={onSaved}
              onDirtyChange={setDirty}
              onCancelCreate={() => {
                if (manager.selection.kind !== 'create') return
                requestSelection({
                  kind: 'lesson',
                  courseId: manager.selection.courseId,
                  unitId: manager.selection.unitId,
                  skillId: manager.selection.skillId,
                  lessonId: createLessonId,
                })
              }}
            />
          ) : null}

          {editorMode === null && manager.selection.kind !== 'lesson' ? (
            <SurfaceCard className="space-y-2 p-5">
              <h2 className="text-lq-lg font-extrabold">Select a lesson</h2>
              <p className="text-lq-sm text-lq-text-secondary">
                Choose a lesson in the tree to view exercises or create a new
                one. Course, unit, and skill nodes are browse-only — the API
                only creates and patches exercises.
              </p>
              {manager.selection.kind !== 'none' ? (
                <p className="text-lq-sm font-bold">{contextLabel}</p>
              ) : null}
            </SurfaceCard>
          ) : null}
        </div>
      </div>

      <UnsavedChangesGuard
        open={pendingSelection !== null}
        onCancel={() => setPendingSelection(null)}
        onConfirm={confirmDiscard}
      />
    </div>
  )
}
