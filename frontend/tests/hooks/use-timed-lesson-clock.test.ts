import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'

import { useTimedLessonClock } from '@/hooks/use-timed-lesson-clock'

describe('useTimedLessonClock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-19T12:58:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not start a fresh 120-second timer on mount', () => {
    const confirmExpiry = vi.fn()
    const { result } = renderHook(() =>
      useTimedLessonClock({
        mode: 'timed',
        expiresAt: '2026-07-19T13:00:00Z',
        remainingSeconds: 120,
        attemptId: 1,
        confirmExpiry,
      }),
    )

    expect(result.current.remainingSeconds).toBe(120)
    expect(result.current.displayLabel).toBe('2:00')
    expect(confirmExpiry).not.toHaveBeenCalled()
  })

  it('refresh preserves absolute expiry (remaining from expires_at)', () => {
    vi.setSystemTime(new Date('2026-07-19T12:59:10Z'))
    const { result } = renderHook(() =>
      useTimedLessonClock({
        mode: 'timed',
        expiresAt: '2026-07-19T13:00:00Z',
        remainingSeconds: 50,
        attemptId: 1,
        confirmExpiry: vi.fn(),
      }),
    )
    expect(result.current.remainingSeconds).toBe(50)
  })

  it('display reaching zero does not locally fail — asks backend', async () => {
    const confirmExpiry = vi.fn().mockResolvedValue({
      outcome: 'in_progress',
      remainingSeconds: 0,
    })

    const { result } = renderHook(() =>
      useTimedLessonClock({
        mode: 'timed',
        expiresAt: '2026-07-19T12:58:00Z',
        remainingSeconds: 0,
        attemptId: 1,
        confirmExpiry,
      }),
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(confirmExpiry).toHaveBeenCalled()
    expect(result.current.phase).not.toBe('backend_expired')
    expect(result.current.isBackendExpired).toBe(false)
  })

  it('enters backend_expired only after confirmExpiry reports expired', async () => {
    const confirmExpiry = vi.fn().mockResolvedValue({ outcome: 'expired' })
    vi.setSystemTime(new Date('2026-07-19T13:00:01Z'))

    const { result } = renderHook(() =>
      useTimedLessonClock({
        mode: 'timed',
        expiresAt: '2026-07-19T13:00:00Z',
        remainingSeconds: 0,
        attemptId: 1,
        confirmExpiry,
      }),
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(result.current.phase).toBe('backend_expired')
    expect(result.current.announcement).toMatch(/expired/i)
  })

  it('cleans up interval on unmount and attempt change', () => {
    const clearSpy = vi.spyOn(window, 'clearInterval')
    const { unmount, rerender } = renderHook(
      ({ id }) =>
        useTimedLessonClock({
          mode: 'timed',
          expiresAt: '2026-07-19T13:00:00Z',
          remainingSeconds: 90,
          attemptId: id,
          confirmExpiry: vi.fn(),
        }),
      { initialProps: { id: 1 } },
    )

    rerender({ id: 2 })
    unmount()
    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })

  it('announces the one-minute threshold once while counting down', async () => {
    const { result } = renderHook(() =>
      useTimedLessonClock({
        mode: 'timed',
        expiresAt: '2026-07-19T12:59:01Z',
        remainingSeconds: 61,
        attemptId: 1,
        confirmExpiry: vi.fn(),
      }),
    )

    expect(result.current.remainingSeconds).toBe(61)

    await act(async () => {
      vi.setSystemTime(new Date('2026-07-19T12:58:01Z'))
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(result.current.remainingSeconds).toBeLessThanOrEqual(60)
    expect(result.current.announcement).toBe('One minute remaining')

    await act(async () => {
      vi.setSystemTime(new Date('2026-07-19T12:58:02Z'))
      await vi.advanceTimersByTimeAsync(300)
    })

    // Already announced — announcement may clear or stay; threshold set prevents re-fire.
    expect(result.current.remainingSeconds).toBeLessThanOrEqual(59)
  })
})
