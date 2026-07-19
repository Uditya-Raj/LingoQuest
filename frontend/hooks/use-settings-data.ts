'use client'

/**
 * Loads GET /user/me for settings form initialization.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError, getCurrentUser } from '@/lib/api'
import type { ProfileResponse } from '@/lib/contracts/user'
import { learnerSummaryFromProfile } from '@/lib/profile/learner-from-profile'
import { useSessionStore } from '@/stores/session-store'

export type SettingsLoadStatus = 'loading' | 'ready' | 'error'

export interface UseSettingsDataResult {
  profile: ProfileResponse | null
  status: SettingsLoadStatus
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

export function useSettingsData(): UseSettingsDataResult {
  const setProfile = useSessionStore((s) => s.setProfile)
  const setLearner = useSessionStore((s) => s.setLearner)
  const storeProfile = useSessionStore((s) => s.profile)
  const previousLearnerRef = useRef(useSessionStore.getState().learner)

  const [fetchedProfile, setFetchedProfile] = useState<ProfileResponse | null>(
    null,
  )
  const [status, setStatus] = useState<SettingsLoadStatus>('loading')
  const [error, setError] = useState<UseSettingsDataResult['error']>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    previousLearnerRef.current = useSessionStore.getState().learner
  })

  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    setError(null)

    void getCurrentUser(controller.signal)
      .then((profileData) => {
        if (!mountedRef.current || controller.signal.aborted) return
        setFetchedProfile(profileData)
        setProfile(profileData)
        setLearner(
          learnerSummaryFromProfile(profileData, previousLearnerRef.current),
        )
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (!mountedRef.current || controller.signal.aborted) return
        setError(toErrorPayload(err))
        setStatus('error')
      })

    return () => controller.abort()
  }, [reloadToken, setLearner, setProfile])

  const reload = useCallback(() => {
    setReloadToken((token) => token + 1)
  }, [])

  // Prefer store profile after PATCH so form baseline matches saved values.
  const profile = storeProfile ?? fetchedProfile

  return {
    profile: status === 'ready' ? profile : fetchedProfile,
    status,
    error,
    reload,
  }
}
