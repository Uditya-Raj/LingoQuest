'use client'

/**
 * Loads profile + achievements for /profile.
 * Aborts stale requests; does not persist learner progress locally.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError, getAchievements, getCurrentUser } from '@/lib/api'
import type { AchievementListItem } from '@/lib/contracts/achievements'
import type { ProfileResponse } from '@/lib/contracts/user'
import { learnerSummaryFromProfile } from '@/lib/profile/learner-from-profile'
import { useSessionStore } from '@/stores/session-store'

export type ProfileLoadStatus = 'loading' | 'ready' | 'error'

export interface UseProfileDataResult {
  profile: ProfileResponse | null
  achievements: AchievementListItem[]
  status: ProfileLoadStatus
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

export function useProfileData(): UseProfileDataResult {
  const setProfile = useSessionStore((s) => s.setProfile)
  const setLearner = useSessionStore((s) => s.setLearner)
  const previousLearner = useSessionStore((s) => s.learner)

  const [profile, setLocalProfile] = useState<ProfileResponse | null>(null)
  const [achievements, setAchievements] = useState<AchievementListItem[]>([])
  const [status, setStatus] = useState<ProfileLoadStatus>('loading')
  const [error, setError] = useState<UseProfileDataResult['error']>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const mountedRef = useRef(true)
  const previousLearnerRef = useRef(previousLearner)

  previousLearnerRef.current = previousLearner

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

    void Promise.all([
      getCurrentUser(controller.signal),
      getAchievements(controller.signal),
    ])
      .then(([profileData, achievementsData]) => {
        if (!mountedRef.current || controller.signal.aborted) return
        setLocalProfile(profileData)
        setAchievements(achievementsData.achievements)
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

  return { profile, achievements, status, error, reload }
}
