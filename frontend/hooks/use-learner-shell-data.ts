'use client'

/**
 * Loads the course learner summary into the session store for the shell.
 * Read-only; does not persist gamification locally.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError, getCourse } from '@/lib/api'
import type { CourseResponse } from '@/lib/contracts/course'
import { useSessionStore } from '@/stores/session-store'

export type ShellLoadStatus = 'idle' | 'loading' | 'ready' | 'error' | 'empty'

export interface UseLearnerShellDataResult {
  course: CourseResponse | null
  status: ShellLoadStatus
  error: Pick<ApiError, 'status' | 'code' | 'message'> | null
  reload: () => void
}

export function useLearnerShellData(): UseLearnerShellDataResult {
  const setLearner = useSessionStore((s) => s.setLearner)
  const setLoading = useSessionStore((s) => s.setLoading)
  const setError = useSessionStore((s) => s.setError)

  const [course, setCourse] = useState<CourseResponse | null>(null)
  const [status, setStatus] = useState<ShellLoadStatus>('loading')
  const [error, setLocalError] = useState<UseLearnerShellDataResult['error']>(null)
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
    setLocalError(null)
    setLoading()

    void getCourse(controller.signal)
      .then((data) => {
        if (!mountedRef.current || controller.signal.aborted) return
        setLearner(data.learner)
        setCourse(data)
        if (data.units.length === 0) {
          setStatus('empty')
        } else {
          setStatus('ready')
        }
      })
      .catch((err: unknown) => {
        if (!mountedRef.current || controller.signal.aborted) return
        if (err instanceof ApiError) {
          const payload = {
            status: err.status,
            code: err.code,
            message: err.message,
          }
          setError(payload)
          setLocalError(payload)
          setStatus('error')
          return
        }
        const payload = {
          status: 0,
          code: 'NETWORK_ERROR',
          message: 'Unable to reach the LingoQuest API.',
        }
        setError(payload)
        setLocalError(payload)
        setStatus('error')
      })

    return () => controller.abort()
  }, [reloadToken, setError, setLearner, setLoading])

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1)
  }, [])

  return { course, status, error, reload }
}
