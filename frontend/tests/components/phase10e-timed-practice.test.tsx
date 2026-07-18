import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act, renderHook } from '@testing-library/react'

import { LessonPlayer } from '@/components/lesson/lesson-player'
import { LessonHearts } from '@/components/lesson/lesson-hearts'
import { useLessonSession } from '@/hooks/use-lesson-session'
import { ApiError } from '@/lib/api/client'
import { cancelActiveLessonAudio } from '@/lib/audio/lesson-audio-controller'
import {
  mockAnswerResponse,
  mockCompletionResponse,
  mockFailedAttempt,
  mockFinalAnswerResponse,
  mockLessonAttempt,
  mockTimedAttempt,
  exerciseMc,
} from '@/tests/fixtures/phase10a'
import { allFiveExercises, mockFiveTypeAttempt } from '@/tests/fixtures/phase10b'
import { renderWithToast } from '@/tests/helpers/render-with-toast'
import { useSessionStore } from '@/stores/session-store'

const getAttemptMock = vi.fn()
const submitAnswerMock = vi.fn()
const completeLessonMock = vi.fn()
const startTimedMock = vi.fn()
const routerReplace = vi.fn()
const routerPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush, replace: routerReplace }),
}))

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    getAttempt: (...args: unknown[]) => getAttemptMock(...args),
    submitAnswer: (...args: unknown[]) => submitAnswerMock(...args),
    completeLesson: (...args: unknown[]) => completeLessonMock(...args),
    startTimedPractice: (...args: unknown[]) => startTimedMock(...args),
  }
})

vi.mock('@/lib/audio/lesson-audio-controller', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/lib/audio/lesson-audio-controller')>()
  return {
    ...actual,
    cancelActiveLessonAudio: vi.fn(),
  }
})

function futureTimedAttempt(
  overrides: Parameters<typeof mockTimedAttempt>[0] = {},
) {
  const remaining = overrides.remaining_seconds ?? 90
  return mockTimedAttempt({
    ...overrides,
    remaining_seconds: remaining,
    expires_at:
      overrides.expires_at ??
      new Date(Date.now() + remaining * 1000).toISOString(),
  })
}

describe('Phase 10E Timed Practice UI', () => {
  beforeEach(() => {
    getAttemptMock.mockReset()
    submitAnswerMock.mockReset()
    completeLessonMock.mockReset()
    startTimedMock.mockReset()
    routerReplace.mockReset()
    routerPush.mockReset()
    useSessionStore.getState().reset()
    vi.mocked(cancelActiveLessonAudio).mockClear()
  })

  it('shows Timed Practice header countdown without hearts emphasis', async () => {
    getAttemptMock.mockResolvedValue(futureTimedAttempt({ remaining_seconds: 90 }))

    renderWithToast(<LessonPlayer attemptId={9100} />)

    expect(await screen.findByText('Timed Practice')).toBeInTheDocument()
    expect(screen.getByRole('timer')).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: /hearts/i })).not.toBeInTheDocument()
  })

  it('keeps all five exercise types available in timed mode', async () => {
    const timedFive = mockFiveTypeAttempt({
      mode: 'timed',
      expires_at: new Date(Date.now() + 90_000).toISOString(),
      remaining_seconds: 90,
      attempt_id: 9300,
    })
    getAttemptMock.mockResolvedValue(timedFive)

    renderWithToast(<LessonPlayer attemptId={9300} />)

    await screen.findByRole('heading', { name: allFiveExercises[0]!.prompt })
    expect(screen.getByRole('timer')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Hola' })).toBeInTheDocument()
  })

  it('wrong timed answer does not animate heart loss; standard still can', () => {
    const timed = render(<LessonHearts hearts={5} maxHearts={5} mode="timed" />)
    timed.rerender(<LessonHearts hearts={4} maxHearts={5} mode="timed" />)
    expect(timed.container.querySelector('.lq-heart-loss')).toBeNull()

    const standard = render(
      <LessonHearts hearts={5} maxHearts={5} mode="standard" />,
    )
    standard.rerender(<LessonHearts hearts={4} maxHearts={5} mode="standard" />)
    expect(
      standard.getByRole('status', { name: '4 of 5 hearts' }),
    ).toBeInTheDocument()
  })

  it('backend failed retrieval with time_expired opens timed modal, not out-of-hearts', async () => {
    getAttemptMock.mockResolvedValue(
      mockFailedAttempt({
        mode: 'timed',
        hearts: 5,
        terminal_summary: {
          outcome: 'failed',
          xp_earned: 0,
          perfect: false,
          failure_reason: 'time_expired',
          completed_at: '2026-07-19T13:00:01Z',
        },
      }),
    )

    renderWithToast(<LessonPlayer attemptId={9100} />)

    expect(await screen.findByRole('heading', { name: /Time's up/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Out of hearts' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Retry Timed Practice/i })).toBeInTheDocument()
    expect(screen.getByText(/No XP was awarded/i)).toBeInTheDocument()
  })

  it('standard failure still opens out-of-hearts modal', async () => {
    getAttemptMock.mockResolvedValue(mockFailedAttempt())
    renderWithToast(<LessonPlayer attemptId={9001} />)
    expect(await screen.findByRole('heading', { name: 'Out of hearts' })).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('timed completion displays exact backend XP without perfect/crown/unlock', async () => {
    getAttemptMock.mockResolvedValue(
      futureTimedAttempt({
        current_index: 0,
        total_exercises: 1,
        exercises: [{ ...exerciseMc, position: 0 }],
        remaining_seconds: 80,
        hearts: 5,
      }),
    )
    submitAnswerMock.mockResolvedValue(
      mockFinalAnswerResponse({
        exercise_id: exerciseMc.id,
        position: 0,
        current_index: 1,
        total_exercises: 1,
        can_complete: true,
        hearts_remaining: 5,
        mistakes_count: 1,
      }),
    )
    completeLessonMock.mockResolvedValue(
      mockCompletionResponse({
        xp: { base: 20, perfect_bonus: 0, earned: 20, perfect: false },
        unlocked_skill_ids: [],
        skill: {
          id: 3,
          title: 'Food',
          new_crowns: 1,
          max_level: 5,
          status: 'in_progress',
        },
      }),
    )

    const user = userEvent.setup()
    renderWithToast(<LessonPlayer attemptId={9100} />)

    await user.click(await screen.findByRole('radio', { name: 'Hello' }))
    await user.click(screen.getByRole('button', { name: 'Check' }))
    await user.click(await screen.findByRole('button', { name: /Continue|Finish/i }))

    expect(
      await screen.findByRole('heading', { name: 'Timed Practice complete' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('20 XP earned')).toBeInTheDocument()
    expect(screen.queryByText(/Perfect lesson/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Crown progress/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Skill unlocked/i)).not.toBeInTheDocument()
    expect(completeLessonMock).toHaveBeenCalledTimes(1)
  })

  it('retry from expired modal starts a new timed attempt', async () => {
    getAttemptMock.mockResolvedValue(
      mockFailedAttempt({
        mode: 'timed',
        skill_id: 3,
        terminal_summary: {
          outcome: 'failed',
          xp_earned: 0,
          perfect: false,
          failure_reason: 'time_expired',
          completed_at: '2026-07-19T13:00:01Z',
        },
      }),
    )
    startTimedMock.mockResolvedValue(
      mockTimedAttempt({ attempt_id: 9999, resumed: false }),
    )

    const user = userEvent.setup()
    renderWithToast(<LessonPlayer attemptId={9100} />)

    await screen.findByRole('heading', { name: /Time's up/i })
    await user.click(screen.getByRole('button', { name: /Retry Timed Practice/i }))

    await waitFor(() => {
      expect(startTimedMock).toHaveBeenCalledWith(3)
      expect(routerReplace).toHaveBeenCalledWith('/lesson/9999')
    })
    expect(cancelActiveLessonAudio).toHaveBeenCalled()
  })

  it('cancels TTS on timed terminal transition', async () => {
    getAttemptMock.mockResolvedValue(
      mockFailedAttempt({
        mode: 'timed',
        terminal_summary: {
          outcome: 'failed',
          xp_earned: 0,
          perfect: false,
          failure_reason: 'time_expired',
          completed_at: '2026-07-19T13:00:01Z',
        },
      }),
    )

    renderWithToast(<LessonPlayer attemptId={9100} />)
    await screen.findByRole('heading', { name: /Time's up/i })
    expect(cancelActiveLessonAudio).toHaveBeenCalled()
  })

  it('standard lesson still shows hearts and no timer', async () => {
    getAttemptMock.mockResolvedValue(mockLessonAttempt({ hearts: 4 }))
    renderWithToast(<LessonPlayer attemptId={9001} />)
    expect(
      await screen.findByRole('status', { name: '4 of 5 hearts' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    expect(screen.queryByText('Timed Practice')).not.toBeInTheDocument()
  })

  it('wrong timed answer keeps hearts unchanged in feedback', async () => {
    getAttemptMock.mockResolvedValue(
      futureTimedAttempt({
        hearts: 5,
        exercises: [{ ...exerciseMc, position: 0 }],
        total_exercises: 2,
        current_index: 0,
      }),
    )
    submitAnswerMock.mockResolvedValue(
      mockAnswerResponse({
        is_correct: false,
        hearts_remaining: 5,
        mistakes_count: 1,
        current_index: 1,
      }),
    )

    const user = userEvent.setup()
    renderWithToast(<LessonPlayer attemptId={9100} />)

    await user.click(await screen.findByRole('radio', { name: 'Hello' }))
    await user.click(screen.getByRole('button', { name: 'Check' }))

    expect(await screen.findByRole('button', { name: /Continue/i })).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: /hearts/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/hearts remaining/i)).not.toBeInTheDocument()
  })
})

describe('Phase 10E session TIME_EXPIRED', () => {
  beforeEach(() => {
    getAttemptMock.mockReset()
    submitAnswerMock.mockReset()
    completeLessonMock.mockReset()
    useSessionStore.getState().reset()
  })

  it('TIME_EXPIRED from answer enters failed time_expired without fabricated answer', async () => {
    getAttemptMock.mockResolvedValue(mockTimedAttempt())
    submitAnswerMock.mockRejectedValue(
      new ApiError(409, 'TIME_EXPIRED', 'Timed practice has expired', {
        failure_reason: 'time_expired',
      }),
    )

    const { result } = renderHook(() => useLessonSession({ attemptId: 9100 }))
    await waitFor(() => expect(result.current.state.status).toBe('ready'))

    await act(async () => {
      result.current.submitCurrentAnswer({
        exercise_id: exerciseMc.id,
        position: 0,
        answer: { option_id: 'a' },
      })
    })

    await waitFor(() => expect(result.current.state.status).toBe('failed'))
    if (result.current.state.status === 'failed') {
      expect(result.current.state.failureReason).toBe('time_expired')
    }
    expect(submitAnswerMock).toHaveBeenCalledTimes(1)
  })

  it('checkExpiry uses GET and preserves in_progress without local failure', async () => {
    getAttemptMock
      .mockResolvedValueOnce(mockTimedAttempt({ remaining_seconds: 1 }))
      .mockResolvedValueOnce(
        mockTimedAttempt({ remaining_seconds: 0, status: 'in_progress' }),
      )

    const { result } = renderHook(() => useLessonSession({ attemptId: 9100 }))
    await waitFor(() => expect(result.current.state.status).toBe('ready'))

    const adjudication = await result.current.checkExpiry()
    expect(adjudication.outcome).toBe('in_progress')
    expect(result.current.state.status).toBe('ready')
    expect(getAttemptMock).toHaveBeenCalledTimes(2)
  })
})
