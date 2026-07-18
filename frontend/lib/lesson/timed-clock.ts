/**
 * Pure timed-practice countdown helpers.
 * Display-only — never marks attempts failed or awards XP.
 */

export type TimedClockPhase =
  | 'inactive'
  | 'normal'
  | 'warning'
  | 'critical'
  | 'checking_expiry'
  | 'backend_expired'

export const TIMED_WARNING_SECONDS = 30
export const TIMED_CRITICAL_SECONDS = 10
export const TIMED_ANNOUNCE_THRESHOLDS = [60, 30, 10, 5] as const

/** Parse an API expires_at string as UTC milliseconds. */
export function parseExpiresAtUtc(expiresAt: string): number {
  const normalized = expiresAt.endsWith('Z')
    ? expiresAt
    : expiresAt.includes('+') || /[+-]\d{2}:\d{2}$/.test(expiresAt)
      ? expiresAt
      : `${expiresAt}Z`
  const ms = Date.parse(normalized)
  if (Number.isNaN(ms)) {
    throw new Error(`Invalid expires_at: ${expiresAt}`)
  }
  return ms
}

/**
 * Derive browser↔server skew from expires_at + remaining_seconds.
 * Positive offset means the browser clock is behind the server.
 */
export function deriveServerSkewMs(
  expiresAtMs: number,
  remainingSeconds: number | null | undefined,
  browserNowMs: number,
): number {
  if (remainingSeconds === null || remainingSeconds === undefined) {
    return 0
  }
  if (!Number.isFinite(remainingSeconds) || remainingSeconds < 0) {
    return 0
  }
  const serverNowEstimate = expiresAtMs - remainingSeconds * 1000
  return serverNowEstimate - browserNowMs
}

/**
 * Remaining whole seconds for display.
 * Equality boundary: remaining may be 0 while still playable on the backend
 * (logical_now == expires_at). Display must not locally fail the attempt.
 */
export function computeRemainingSeconds(
  expiresAtMs: number,
  browserNowMs: number,
  skewMs = 0,
): number {
  const adjustedNow = browserNowMs + skewMs
  const deltaMs = expiresAtMs - adjustedNow
  if (deltaMs <= 0) return 0
  return Math.floor(deltaMs / 1000)
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function humanReadableRemaining(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  if (safe === 0) return 'Less than one second remaining'
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  if (minutes === 0) {
    return seconds === 1 ? '1 second remaining' : `${seconds} seconds remaining`
  }
  if (seconds === 0) {
    return minutes === 1 ? '1 minute remaining' : `${minutes} minutes remaining`
  }
  const minuteLabel = minutes === 1 ? '1 minute' : `${minutes} minutes`
  const secondLabel = seconds === 1 ? '1 second' : `${seconds} seconds`
  return `${minuteLabel} and ${secondLabel} remaining`
}

export function phaseFromRemaining(
  remainingSeconds: number,
  options: {
    checkingExpiry?: boolean
    backendExpired?: boolean
    active?: boolean
  } = {},
): TimedClockPhase {
  if (options.backendExpired) return 'backend_expired'
  if (!options.active) return 'inactive'
  if (options.checkingExpiry) return 'checking_expiry'
  if (remainingSeconds <= TIMED_CRITICAL_SECONDS) return 'critical'
  if (remainingSeconds <= TIMED_WARNING_SECONDS) return 'warning'
  return 'normal'
}

/**
 * Thresholds that should announce given current remaining and already-announced set.
 * Only announces thresholds that are still >= remaining (passed while counting down).
 * On refresh mid-session, thresholds already below remaining are treated as passed
 * without replaying them.
 */
export function thresholdsToAnnounce(
  remainingSeconds: number,
  announced: ReadonlySet<number>,
  previousRemaining: number | null,
): number[] {
  const due: number[] = []
  for (const threshold of TIMED_ANNOUNCE_THRESHOLDS) {
    if (announced.has(threshold)) continue
    // Crossing or landing on the threshold while counting down.
    if (
      remainingSeconds <= threshold &&
      (previousRemaining === null || previousRemaining > threshold)
    ) {
      due.push(threshold)
    }
  }
  return due
}

/** Seed announced thresholds so refresh does not replay already-passed ones. */
export function seedAnnouncedThresholds(remainingSeconds: number): Set<number> {
  const seeded = new Set<number>()
  for (const threshold of TIMED_ANNOUNCE_THRESHOLDS) {
    if (remainingSeconds < threshold) {
      seeded.add(threshold)
    }
  }
  return seeded
}

export function announcementForThreshold(threshold: number): string {
  switch (threshold) {
    case 60:
      return 'One minute remaining'
    case 30:
      return 'Thirty seconds remaining'
    case 10:
      return 'Ten seconds remaining'
    case 5:
      return 'Five seconds remaining'
    default:
      return `${threshold} seconds remaining`
  }
}
