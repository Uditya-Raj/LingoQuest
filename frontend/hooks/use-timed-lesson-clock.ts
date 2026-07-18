'use client'

/**
 * Presentation countdown for timed practice.
 * Backend expires_at is authoritative; this hook never fails the attempt locally.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import type { AttemptMode } from '@/lib/contracts/common'
import {
  announcementForThreshold,
  computeRemainingSeconds,
  deriveServerSkewMs,
  formatCountdown,
  humanReadableRemaining,
  parseExpiresAtUtc,
  phaseFromRemaining,
  seedAnnouncedThresholds,
  thresholdsToAnnounce,
  type TimedClockPhase,
} from '@/lib/lesson/timed-clock'

const TICK_MS = 250
/** Cooldown between GET adjudications while display shows 0:00 at equality. */
const EXPIRY_RECHECK_MS = 1000

export type ExpiryCheckResult =
  | { outcome: 'expired' }
  | {
      outcome: 'in_progress'
      remainingSeconds?: number | null
      expiresAt?: string | null
    }
  | { outcome: 'error' }

export interface UseTimedLessonClockOptions {
  mode: AttemptMode | null | undefined
  expiresAt: string | null | undefined
  remainingSeconds: number | null | undefined
  attemptId: number | null | undefined
  enabled?: boolean
  /** Documented API adjudication (GET attempt). Never fabricate answers. */
  confirmExpiry: () => Promise<ExpiryCheckResult>
}

export interface UseTimedLessonClockResult {
  phase: TimedClockPhase
  remainingSeconds: number
  displayLabel: string
  accessibleLabel: string
  announcement: string | null
  isActive: boolean
  isCheckingExpiry: boolean
  isBackendExpired: boolean
  /** True when exercise controls must block (checking or confirmed expired). */
  blocksInteraction: boolean
}

export function useTimedLessonClock({
  mode,
  expiresAt,
  remainingSeconds: serverRemaining,
  attemptId,
  enabled = true,
  confirmExpiry,
}: UseTimedLessonClockOptions): UseTimedLessonClockResult {
  const isTimed = mode === 'timed' && enabled && Boolean(expiresAt)

  const [phase, setPhase] = useState<TimedClockPhase>('inactive')
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [announcement, setAnnouncement] = useState<string | null>(null)

  const skewMsRef = useRef(0)
  const expiresAtMsRef = useRef<number | null>(null)
  const announcedRef = useRef<Set<number>>(new Set())
  const previousRemainingRef = useRef<number | null>(null)
  const checkingRef = useRef(false)
  const backendExpiredRef = useRef(false)
  const nextExpiryCheckAtRef = useRef(0)
  const mountedRef = useRef(true)
  const confirmExpiryRef = useRef(confirmExpiry)
  confirmExpiryRef.current = confirmExpiry

  const attemptKey = `${attemptId ?? 'none'}:${expiresAt ?? 'none'}`

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Reset clock state when attempt / expiry identity changes.
  useEffect(() => {
    checkingRef.current = false
    backendExpiredRef.current = false
    nextExpiryCheckAtRef.current = 0
    previousRemainingRef.current = null
    setAnnouncement(null)

    if (!isTimed || !expiresAt) {
      expiresAtMsRef.current = null
      skewMsRef.current = 0
      announcedRef.current = new Set()
      setPhase('inactive')
      setRemainingSeconds(0)
      return
    }

    const expiresAtMs = parseExpiresAtUtc(expiresAt)
    expiresAtMsRef.current = expiresAtMs
    const now = Date.now()
    skewMsRef.current = deriveServerSkewMs(expiresAtMs, serverRemaining, now)
    const remaining = computeRemainingSeconds(expiresAtMs, now, skewMsRef.current)
    announcedRef.current = seedAnnouncedThresholds(remaining)
    previousRemainingRef.current = remaining
    setRemainingSeconds(remaining)
    setPhase(
      phaseFromRemaining(remaining, {
        active: true,
        checkingExpiry: false,
        backendExpired: false,
      }),
    )
    // serverRemaining intentionally only seeds skew at attempt identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- identity is attemptKey
  }, [attemptKey, isTimed])

  const runExpiryCheck = useCallback(async () => {
    if (!mountedRef.current || checkingRef.current || backendExpiredRef.current) {
      return
    }
    const now = Date.now()
    if (now < nextExpiryCheckAtRef.current) {
      return
    }

    checkingRef.current = true
    nextExpiryCheckAtRef.current = now + EXPIRY_RECHECK_MS
    setPhase('checking_expiry')
    setAnnouncement('Time is being checked')

    try {
      const result = await confirmExpiryRef.current()
      if (!mountedRef.current) return

      if (result.outcome === 'expired') {
        backendExpiredRef.current = true
        checkingRef.current = false
        setRemainingSeconds(0)
        setPhase('backend_expired')
        setAnnouncement('Time has expired')
        return
      }

      if (result.outcome === 'in_progress') {
        const expiresMs = expiresAtMsRef.current
        if (
          expiresMs !== null &&
          result.remainingSeconds !== null &&
          result.remainingSeconds !== undefined
        ) {
          skewMsRef.current = deriveServerSkewMs(
            expiresMs,
            result.remainingSeconds,
            Date.now(),
          )
        }
        const remaining = computeRemainingSeconds(
          expiresAtMsRef.current ?? 0,
          Date.now(),
          skewMsRef.current,
        )
        checkingRef.current = false
        nextExpiryCheckAtRef.current = Date.now() + EXPIRY_RECHECK_MS
        setRemainingSeconds(remaining)
        setPhase(
          phaseFromRemaining(remaining, {
            active: true,
            checkingExpiry: false,
            backendExpired: false,
          }),
        )
        setAnnouncement(null)
        return
      }

      // Error: leave playable; do not locally fail.
      checkingRef.current = false
      nextExpiryCheckAtRef.current = Date.now() + EXPIRY_RECHECK_MS
      const remaining = computeRemainingSeconds(
        expiresAtMsRef.current ?? 0,
        Date.now(),
        skewMsRef.current,
      )
      setRemainingSeconds(remaining)
      setPhase(
        phaseFromRemaining(remaining, {
          active: true,
          checkingExpiry: false,
          backendExpired: false,
        }),
      )
      setAnnouncement(null)
    } catch {
      if (!mountedRef.current) return
      checkingRef.current = false
      nextExpiryCheckAtRef.current = Date.now() + EXPIRY_RECHECK_MS
      const remaining = computeRemainingSeconds(
        expiresAtMsRef.current ?? 0,
        Date.now(),
        skewMsRef.current,
      )
      setRemainingSeconds(remaining)
      setPhase(
        phaseFromRemaining(remaining, {
          active: true,
          checkingExpiry: false,
          backendExpired: false,
        }),
      )
      setAnnouncement(null)
    }
  }, [])

  // Single interval: recalculate from absolute expiry (catches background throttling).
  useEffect(() => {
    if (!isTimed || expiresAtMsRef.current === null) return

    const tick = () => {
      if (!mountedRef.current || backendExpiredRef.current) return
      if (checkingRef.current) return

      const remaining = computeRemainingSeconds(
        expiresAtMsRef.current!,
        Date.now(),
        skewMsRef.current,
      )

      const previous = previousRemainingRef.current
      const due = thresholdsToAnnounce(remaining, announcedRef.current, previous)
      for (const threshold of due) {
        announcedRef.current.add(threshold)
        setAnnouncement(announcementForThreshold(threshold))
      }
      previousRemainingRef.current = remaining
      setRemainingSeconds(remaining)
      setPhase(
        phaseFromRemaining(remaining, {
          active: true,
          checkingExpiry: false,
          backendExpired: false,
        }),
      )

      if (remaining === 0) {
        void runExpiryCheck()
      }
    }

    tick()
    const id = window.setInterval(tick, TICK_MS)
    return () => window.clearInterval(id)
  }, [attemptKey, isTimed, runExpiryCheck])

  if (!isTimed) {
    return {
      phase: 'inactive',
      remainingSeconds: 0,
      displayLabel: '0:00',
      accessibleLabel: 'Timed practice inactive',
      announcement: null,
      isActive: false,
      isCheckingExpiry: false,
      isBackendExpired: false,
      blocksInteraction: false,
    }
  }

  const isCheckingExpiry = phase === 'checking_expiry'
  const isBackendExpired = phase === 'backend_expired'

  return {
    phase,
    remainingSeconds,
    displayLabel: formatCountdown(remainingSeconds),
    accessibleLabel: isCheckingExpiry
      ? 'Checking time with the server'
      : isBackendExpired
        ? 'Time has expired'
        : humanReadableRemaining(remainingSeconds),
    announcement,
    isActive: true,
    isCheckingExpiry,
    isBackendExpired,
    blocksInteraction: isCheckingExpiry || isBackendExpired,
  }
}
