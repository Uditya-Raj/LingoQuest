'use client'

/**
 * Loads GET /leaderboard. Preserves backend order — no local ranking.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError, getLeaderboard } from '@/lib/api'
import type { LeaderboardResponse } from '@/lib/contracts/leaderboard'

export type LeaderboardLoadStatus = 'loading' | 'ready' | 'error' | 'empty'

export interface UseLeaderboardDataResult {
  data: LeaderboardResponse | null
  status: LeaderboardLoadStatus
  error: Pick<ApiError, 'status' | 'code' | 'message'> | null
  reload: () => void
}

function toErrorPayload(err: unknown): Pick<ApiError, 'status' | 'code' | 'message'> {
  if (err instanceof ApiError) {
    return { status: err.status, code: err.code, message: err.message }
  }
  return {
    status: 0,
    code: 'NETWORK_ERROR',
    message: 'Unable to reach the LingoQuest API.',
  }
}

export function useLeaderboardData(): UseLeaderboardDataResult {
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [status, setStatus] = useState<LeaderboardLoadStatus>('loading')
  const [error, setError] = useState<UseLeaderboardDataResult['error']>(null)
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

    void getLeaderboard(undefined, controller.signal)
      .then((response) => {
        if (!mountedRef.current || controller.signal.aborted) return
        setData(response)
        if (response.entries.length === 0) {
          setStatus('empty')
        } else {
          setStatus('ready')
        }
      })
      .catch((err: unknown) => {
        if (!mountedRef.current || controller.signal.aborted) return
        setError(toErrorPayload(err))
        setStatus('error')
      })

    return () => controller.abort()
  }, [reloadToken])

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1)
  }, [])

  return { data, status, error, reload }
}
