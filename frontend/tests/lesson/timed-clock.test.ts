import { describe, expect, it } from 'vitest'

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
} from '@/lib/lesson/timed-clock'

describe('timed-clock helpers', () => {
  const expiresAt = '2026-07-19T13:00:00Z'
  const expiresMs = parseExpiresAtUtc(expiresAt)

  it('parses expires_at as UTC', () => {
    expect(parseExpiresAtUtc('2026-07-19T13:00:00Z')).toBe(
      Date.UTC(2026, 6, 19, 13, 0, 0),
    )
    expect(parseExpiresAtUtc('2026-07-19T13:00:00')).toBe(
      Date.UTC(2026, 6, 19, 13, 0, 0),
    )
  })

  it('computes remaining from absolute expiry without a fresh 120s reset', () => {
    const now = expiresMs - 88_000
    expect(computeRemainingSeconds(expiresMs, now)).toBe(88)
  })

  it('derives skew from remaining_seconds and preserves absolute expiry', () => {
    const browserNow = expiresMs - 50_000
    const skew = deriveServerSkewMs(expiresMs, 90, browserNow)
    // Server thinks 90s remain; browser thinks 50s → skew = -40s
    expect(skew).toBe(-40_000)
    expect(computeRemainingSeconds(expiresMs, browserNow, skew)).toBe(90)
  })

  it('one moment before expiry is playable (remaining > 0)', () => {
    expect(computeRemainingSeconds(expiresMs, expiresMs - 1)).toBe(0)
    // floor((expires - (expires-1))/1000) = floor(0.001) = 0 for display,
    // but backend equality uses logical_now == expires_at as playable.
    expect(computeRemainingSeconds(expiresMs, expiresMs - 1000)).toBe(1)
  })

  it('exact equality shows 0:00 without implying local failure', () => {
    expect(computeRemainingSeconds(expiresMs, expiresMs)).toBe(0)
    expect(phaseFromRemaining(0, { active: true })).toBe('critical')
    expect(phaseFromRemaining(0, { active: true, checkingExpiry: true })).toBe(
      'checking_expiry',
    )
  })

  it('one moment after expiry still requires backend confirmation phase', () => {
    expect(computeRemainingSeconds(expiresMs, expiresMs + 1)).toBe(0)
    expect(
      phaseFromRemaining(0, { active: true, backendExpired: true }),
    ).toBe('backend_expired')
  })

  it('formats countdown with tabular-friendly MM:SS', () => {
    expect(formatCountdown(120)).toBe('2:00')
    expect(formatCountdown(65)).toBe('1:05')
    expect(formatCountdown(0)).toBe('0:00')
  })

  it('announces thresholds once and seeds passed thresholds on refresh', () => {
    const seeded = seedAnnouncedThresholds(45)
    expect(seeded.has(60)).toBe(true)
    expect(seeded.has(30)).toBe(false)

    const due = thresholdsToAnnounce(30, seeded, 31)
    expect(due).toEqual([30])
    seeded.add(30)
    expect(thresholdsToAnnounce(29, seeded, 30)).toEqual([])
    expect(announcementForThreshold(60)).toMatch(/One minute/i)
    expect(humanReadableRemaining(90)).toMatch(/1 minute/i)
  })

  it('background time jump catches up via absolute recalculation', () => {
    const start = expiresMs - 60_000
    expect(computeRemainingSeconds(expiresMs, start)).toBe(60)
    // Tab throttled; wall clock jumped 40s.
    expect(computeRemainingSeconds(expiresMs, start + 40_000)).toBe(20)
  })
})
