'use client'

/**
 * Loads GET /admin/content/tree and owns selection for the content manager.
 * Authorization is determined by the admin endpoint response (403 = denied).
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError, getContentTree } from '@/lib/api'
import type {
  AdminContentTreeResponse,
  AdminExerciseRepresentation,
  AdminLessonNode,
} from '@/lib/contracts/admin'
import type { AdminSelection } from '@/lib/admin/exercise-form-state'

export type ContentManagerStatus =
  | 'loading'
  | 'ready'
  | 'forbidden'
  | 'error'

export interface UseContentManagerResult {
  tree: AdminContentTreeResponse | null
  status: ContentManagerStatus
  error: Pick<ApiError, 'status' | 'code' | 'message'> | null
  selection: AdminSelection
  setSelection: (next: AdminSelection) => void
  reload: () => void
  applyExercise: (exercise: AdminExerciseRepresentation) => void
  findExercise: (exerciseId: number) => AdminExerciseRepresentation | null
  findLesson: (lessonId: number) => AdminLessonNode | null
  nextOrderIndex: (lessonId: number) => number
}

function toErrorPayload(
  err: unknown,
): Pick<ApiError, 'status' | 'code' | 'message'> {
  if (err instanceof ApiError) {
    return { status: err.status, code: err.code, message: err.message }
  }
  return {
    status: 0,
    code: 'NETWORK_ERROR',
    message: 'Unable to reach the LingoQuest API.',
  }
}

function walkFindExercise(
  tree: AdminContentTreeResponse,
  exerciseId: number,
): AdminExerciseRepresentation | null {
  for (const course of tree.courses) {
    for (const unit of course.units) {
      for (const skill of unit.skills) {
        for (const lesson of skill.lessons) {
          for (const exercise of lesson.exercises) {
            if (exercise.id === exerciseId) return exercise
          }
        }
      }
    }
  }
  return null
}

function walkFindLesson(
  tree: AdminContentTreeResponse,
  lessonId: number,
): AdminLessonNode | null {
  for (const course of tree.courses) {
    for (const unit of course.units) {
      for (const skill of unit.skills) {
        for (const lesson of skill.lessons) {
          if (lesson.id === lessonId) return lesson
        }
      }
    }
  }
  return null
}

export function useContentManager(): UseContentManagerResult {
  const [tree, setTree] = useState<AdminContentTreeResponse | null>(null)
  const [status, setStatus] = useState<ContentManagerStatus>('loading')
  const [error, setError] = useState<UseContentManagerResult['error']>(null)
  const [selection, setSelection] = useState<AdminSelection>({ kind: 'none' })
  const [reloadToken, setReloadToken] = useState(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    setError(null)

    void getContentTree(controller.signal)
      .then((data) => {
        if (!mountedRef.current || controller.signal.aborted) return
        setTree(data)
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (!mountedRef.current || controller.signal.aborted) return
        const payload = toErrorPayload(err)
        setError(payload)
        if (payload.status === 403 || payload.code === 'CONTENT_ADMIN_REQUIRED') {
          setStatus('forbidden')
          setTree(null)
          return
        }
        setStatus('error')
      })

    return () => controller.abort()
  }, [reloadToken])

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1)
  }, [])

  const findExercise = useCallback(
    (exerciseId: number) => {
      if (!tree) return null
      return walkFindExercise(tree, exerciseId)
    },
    [tree],
  )

  const findLesson = useCallback(
    (lessonId: number) => {
      if (!tree) return null
      return walkFindLesson(tree, lessonId)
    },
    [tree],
  )

  const nextOrderIndex = useCallback(
    (lessonId: number) => {
      const lesson = findLesson(lessonId)
      if (!lesson || lesson.exercises.length === 0) return 0
      return Math.max(...lesson.exercises.map((e) => e.order_index)) + 1
    },
    [findLesson],
  )

  const applyExercise = useCallback((exercise: AdminExerciseRepresentation) => {
    setTree((prev) => {
      if (!prev) return prev
      const next: AdminContentTreeResponse = {
        courses: prev.courses.map((course) => ({
          ...course,
          units: course.units.map((unit) => ({
            ...unit,
            skills: unit.skills.map((skill) => ({
              ...skill,
              lessons: skill.lessons.map((lesson) => {
                if (lesson.id !== exercise.lesson_id) {
                  // Exercise may have moved lessons — remove from old lesson.
                  return {
                    ...lesson,
                    exercises: lesson.exercises.filter(
                      (ex) => ex.id !== exercise.id,
                    ),
                  }
                }
                const exists = lesson.exercises.some((ex) => ex.id === exercise.id)
                const exercises = exists
                  ? lesson.exercises.map((ex) =>
                      ex.id === exercise.id ? exercise : ex,
                    )
                  : [...lesson.exercises, exercise]
                return {
                  ...lesson,
                  exercises: [...exercises].sort(
                    (a, b) => a.order_index - b.order_index,
                  ),
                }
              }),
            })),
          })),
        })),
      }
      return next
    })
  }, [])

  return {
    tree,
    status,
    error,
    selection,
    setSelection,
    reload,
    applyExercise,
    findExercise,
    findLesson,
    nextOrderIndex,
  }
}
