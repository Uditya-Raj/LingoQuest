import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { LessonPlayer } from '@/components/lesson/lesson-player'
import { ApiError } from '@/lib/api/client'
import {
  mockAnswerResponse,
  mockCompletionResponse,
  mockFailedAttempt,
  mockLessonAttempt,
} from '@/tests/fixtures/phase10a'
import {
  allFiveExercises,
  mockAnswerForExercise,
  mockFiveTypeAttempt,
  mockJourneyCompletion,
} from '@/tests/fixtures/phase10b'
import { renderWithToast } from '@/tests/helpers/render-with-toast'
import { useSessionStore } from '@/stores/session-store'

const getAttemptMock = vi.fn()
const submitAnswerMock = vi.fn()
const completeLessonMock = vi.fn()
const refillHeartsMock = vi.fn()
const startLessonMock = vi.fn()
const pushMock = vi.fn()
const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}))

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    getAttempt: (...args: unknown[]) => getAttemptMock(...args),
    submitAnswer: (...args: unknown[]) => submitAnswerMock(...args),
    completeLesson: (...args: unknown[]) => completeLessonMock(...args),
    refillHearts: (...args: unknown[]) => refillHeartsMock(...args),
    startLesson: (...args: unknown[]) => startLessonMock(...args),
  }
})

describe('Phase 10C feedback, failure, refill, and results', () => {
  beforeEach(() => {
    getAttemptMock.mockReset()
    submitAnswerMock.mockReset()
    completeLessonMock.mockReset()
    refillHeartsMock.mockReset()
    startLessonMock.mockReset()
    pushMock.mockReset()
    replaceMock.mockReset()
    useSessionStore.getState().reset()
  })

  it('shows correct feedback with Continue and backend hearts, without revealing rewards', async () => {
    const user = userEvent.setup()
    getAttemptMock.mockResolvedValue(mockFiveTypeAttempt({ hearts: 4 }))
    submitAnswerMock.mockResolvedValue(
      mockAnswerForExercise(allFiveExercises[0]!, {
        hearts_remaining: 4,
        max_hearts: 5,
      }),
    )

    renderWithToast(<LessonPlayer attemptId={9200} />)
    await screen.findByRole('heading', { name: allFiveExercises[0]!.prompt })
    await user.click(screen.getByRole('radio', { name: 'Hola' }))
    await user.click(screen.getByRole('button', { name: 'Check' }))

    expect(await screen.findByRole('button', { name: 'Continue' })).toBeInTheDocument()
    expect(screen.getAllByText(/4 of 5 hearts remaining/i).length).toBeGreaterThan(0)
    expect(screen.queryByLabelText(/XP earned/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Check' })).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Hola' })).toBeDisabled()
  })

  it('shows incorrect feedback with formatted solution and exact heart value', async () => {
    const user = userEvent.setup()
    getAttemptMock.mockResolvedValue(mockFiveTypeAttempt({ hearts: 3 }))
    submitAnswerMock.mockResolvedValue(
      mockAnswerForExercise(allFiveExercises[0]!, {
        is_correct: false,
        hearts_remaining: 2,
        mistakes_count: 1,
        correct_answer: { option_id: 'opt_a' },
      }),
    )

    renderWithToast(<LessonPlayer attemptId={9200} />)
    await screen.findByRole('heading', { name: allFiveExercises[0]!.prompt })
    await user.click(screen.getByRole('radio', { name: 'Adiós' }))
    await user.click(screen.getByRole('button', { name: 'Check' }))

    expect(await screen.findByRole('button', { name: 'Continue' })).toBeInTheDocument()
    expect(screen.getAllByText(/Correct answer:/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Hola').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/2 of 5 hearts remaining/i).length).toBeGreaterThan(0)
    expect(useSessionStore.getState().hearts?.hearts).toBe(2)
  })

  it('formats match-pair solutions accessibly after the answer response', async () => {
    const user = userEvent.setup()
    getAttemptMock.mockResolvedValue(
      mockFiveTypeAttempt({ current_index: 2, hearts: 5 }),
    )
    submitAnswerMock.mockResolvedValue(
      mockAnswerForExercise(allFiveExercises[2]!, {
        is_correct: false,
        hearts_remaining: 4,
      }),
    )

    renderWithToast(<LessonPlayer attemptId={9200} />)
    await screen.findByRole('heading', { name: allFiveExercises[2]!.prompt })
    await user.click(screen.getByRole('button', { name: /el pan, left item/i }))
    await user.click(screen.getByRole('button', { name: /milk, right item/i }))
    await user.click(screen.getByRole('button', { name: /la leche, left item/i }))
    await user.click(screen.getByRole('button', { name: /bread, right item/i }))
    await user.click(screen.getByRole('button', { name: 'Check' }))

    expect(await screen.findByLabelText(/el pan matches bread/i)).toBeInTheDocument()
    expect(screen.queryByText(/ordered_ids|left_id|correct_answer/i)).not.toBeInTheDocument()
  })

  it('does not expose correct_answer before an answer response', async () => {
    getAttemptMock.mockResolvedValue(mockFiveTypeAttempt())
    const { container } = renderWithToast(<LessonPlayer attemptId={9200} />)
    await screen.findByRole('heading', { name: allFiveExercises[0]!.prompt })
    expect(container.innerHTML).not.toContain('correct_answer')
    expect(screen.queryByText(/Correct answer:/i)).not.toBeInTheDocument()
  })

  it('opens terminal out-of-hearts modal and never completes', async () => {
    const user = userEvent.setup()
    getAttemptMock.mockResolvedValue(mockFiveTypeAttempt({ hearts: 1 }))
    submitAnswerMock.mockResolvedValue(
      mockAnswerForExercise(allFiveExercises[0]!, {
        is_correct: false,
        hearts_remaining: 0,
        lesson_status: 'failed',
        can_complete: false,
      }),
    )

    renderWithToast(<LessonPlayer attemptId={9200} />)
    await screen.findByRole('heading', { name: allFiveExercises[0]!.prompt })
    await user.click(screen.getByRole('radio', { name: 'Adiós' }))
    await user.click(screen.getByRole('button', { name: 'Check' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Out of hearts' })).toBeInTheDocument()
    expect(completeLessonMock).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Check' })).not.toBeInTheDocument()
  })

  it('does not treat timed expiry as out of hearts', async () => {
    getAttemptMock.mockResolvedValue(
      mockFailedAttempt({
        mode: 'timed',
        terminal_summary: {
          outcome: 'failed',
          xp_earned: 0,
          perfect: false,
          failure_reason: 'time_expired',
          completed_at: '2026-07-19T11:00:00Z',
        },
      }),
    )

    renderWithToast(<LessonPlayer attemptId={9100} />)
    expect(await screen.findByRole('heading', { name: /Time's up/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Refill/i })).not.toBeInTheDocument()
  })

  it('refills once, applies returned hearts/gems, then retries a new attempt id', async () => {
    const user = userEvent.setup()
    useSessionStore.getState().setLearner({
      id: 1,
      display_name: 'Alex',
      hearts: 0,
      max_hearts: 5,
      next_heart_at: null,
      total_xp: 100,
      today_xp: 0,
      daily_goal_xp: 20,
      daily_goal_progress: 0,
      current_streak: 1,
      gems: 40,
    })

    getAttemptMock.mockResolvedValue(mockFailedAttempt({ skill_id: 3, attempt_id: 777 }))
    refillHeartsMock.mockResolvedValue({
      hearts: 5,
      max_hearts: 5,
      gems: 20,
      gems_spent: 20,
      next_heart_at: null,
    })
    startLessonMock.mockResolvedValue(
      mockLessonAttempt({ attempt_id: 888, skill_id: 3, status: 'in_progress' }),
    )

    renderWithToast(<LessonPlayer attemptId={777} />)
    await screen.findByRole('heading', { name: 'Out of hearts' })

    await user.click(screen.getByRole('button', { name: /Refill hearts for 20 gems/i }))
    await screen.findByRole('button', { name: 'Retry lesson' })
    expect(refillHeartsMock).toHaveBeenCalledTimes(1)
    expect(useSessionStore.getState().hearts?.hearts).toBe(5)
    expect(useSessionStore.getState().learner?.gems).toBe(20)

    await user.click(screen.getByRole('button', { name: 'Retry lesson' }))
    await waitFor(() => {
      expect(startLessonMock).toHaveBeenCalledWith(3)
      expect(replaceMock).toHaveBeenCalledWith('/lesson/888')
    })
    expect(replaceMock).not.toHaveBeenCalledWith('/lesson/777')
  })

  it('prevents duplicate refill requests while a refill is pending', async () => {
    const user = userEvent.setup()
    getAttemptMock.mockResolvedValue(mockFailedAttempt())

    let resolveRefill: (value: unknown) => void = () => {}
    refillHeartsMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefill = resolve
        }),
    )

    renderWithToast(<LessonPlayer attemptId={9001} />)
    await screen.findByRole('heading', { name: 'Out of hearts' })
    const refill = screen.getByRole('button', { name: /Refill hearts for 20 gems/i })
    await user.click(refill)
    await user.click(refill)
    expect(refillHeartsMock).toHaveBeenCalledTimes(1)

    resolveRefill({
      hearts: 5,
      max_hearts: 5,
      gems: 20,
      gems_spent: 20,
      next_heart_at: null,
    })
    expect(await screen.findByRole('button', { name: 'Retry lesson' })).toBeInTheDocument()
  })

  it('surfaces refill errors without unlocking retry', async () => {
    const user = userEvent.setup()
    getAttemptMock.mockResolvedValue(mockFailedAttempt())
    refillHeartsMock.mockRejectedValue(
      new ApiError(409, 'INSUFFICIENT_GEMS', 'Not enough gems'),
    )

    renderWithToast(<LessonPlayer attemptId={9001} />)
    await screen.findByRole('heading', { name: 'Out of hearts' })
    await user.click(screen.getByRole('button', { name: /Refill hearts for 20 gems/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Not enough gems/i)
    expect(screen.queryByRole('button', { name: 'Retry lesson' })).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Refill hearts for 20 gems/i }),
    ).toBeEnabled()
  })

  it('completes once and renders exact CompletionResponse fields only', async () => {
    const user = userEvent.setup()
    const attempt = mockLessonAttempt({
      current_index: 1,
      total_exercises: 2,
      exercises: mockLessonAttempt().exercises,
    })
    getAttemptMock.mockResolvedValue(attempt)
    submitAnswerMock.mockResolvedValue(
      mockAnswerResponse({
        exercise_id: attempt.exercises[1]!.id,
        position: 1,
        current_index: 2,
        can_complete: true,
        is_correct: true,
        hearts_remaining: 4,
      }),
    )
    completeLessonMock.mockResolvedValue(
      mockCompletionResponse({
        xp: { base: 10, perfect_bonus: 0, earned: 10, perfect: false },
        streak: {
          current: 3,
          longest: 11,
          extended_today: false,
          activity_date: '2026-07-19',
        },
        achievements_unlocked: [
          {
            key: 'first_lesson',
            title: 'First Steps',
            description: 'Complete your first lesson',
            icon: 'star',
          },
        ],
        skill: {
          id: 3,
          title: 'Food',
          new_crowns: 2,
          max_level: 5,
          status: 'in_progress',
        },
        user_totals: {
          total_xp: 310,
          hearts: 4,
          max_hearts: 5,
          gems: 80,
        },
      }),
    )

    renderWithToast(<LessonPlayer attemptId={9001} />)
    await screen.findByRole('heading', { name: attempt.exercises[1]!.prompt })
    await user.type(screen.getByLabelText(/Type the missing word|Type your answer/i), 'días')
    await user.click(screen.getByRole('button', { name: 'Check' }))
    await user.click(await screen.findByRole('button', { name: 'Finish lesson' }))

    await waitFor(() => expect(completeLessonMock).toHaveBeenCalledTimes(1))
    expect(
      await screen.findByRole('heading', { name: 'Lesson complete!' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('10 XP earned')).toBeInTheDocument()
    expect(screen.queryByText(/Perfect lesson/i)).not.toBeInTheDocument()
    expect(screen.getAllByText('First Steps').length).toBeGreaterThan(0)
    expect(screen.getByText(/2 \/ 5/)).toBeInTheDocument()
    expect(screen.getByText('310')).toBeInTheDocument()
  })

  it('shows perfect badge only when the completion response confirms it', async () => {
    const user = userEvent.setup()
    getAttemptMock.mockResolvedValue(
      mockLessonAttempt({ current_index: 1, total_exercises: 2 }),
    )
    submitAnswerMock.mockResolvedValue(
      mockAnswerResponse({
        exercise_id: 502,
        position: 1,
        current_index: 2,
        can_complete: true,
      }),
    )
    completeLessonMock.mockResolvedValue(mockJourneyCompletion())

    renderWithToast(<LessonPlayer attemptId={9001} />)
    await screen.findByRole('heading', { name: 'Buenos ___' })
    await user.type(screen.getByLabelText('Type the missing word'), 'días')
    await user.click(screen.getByRole('button', { name: 'Check' }))
    await user.click(await screen.findByRole('button', { name: 'Finish lesson' }))

    expect(await screen.findByText(/Perfect lesson/i)).toBeInTheDocument()
  })

  it('shows no rewards when completion fails', async () => {
    const user = userEvent.setup()
    getAttemptMock.mockResolvedValue(
      mockLessonAttempt({ current_index: 1, total_exercises: 2 }),
    )
    submitAnswerMock.mockResolvedValue(
      mockAnswerResponse({
        exercise_id: 502,
        position: 1,
        current_index: 2,
        can_complete: true,
      }),
    )
    completeLessonMock.mockRejectedValue(
      new ApiError(409, 'CONFLICT', 'Already completed'),
    )

    renderWithToast(<LessonPlayer attemptId={9001} />)
    await screen.findByRole('heading', { name: 'Buenos ___' })
    await user.type(screen.getByLabelText('Type the missing word'), 'días')
    await user.click(screen.getByRole('button', { name: 'Check' }))
    await user.click(await screen.findByRole('button', { name: 'Finish lesson' }))

    await waitFor(() => expect(completeLessonMock).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole('heading', { name: 'Lesson complete!' })).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/Already completed|Unable to complete/i)
    expect(screen.queryByLabelText(/XP earned/i)).not.toBeInTheDocument()
  })

  it('returns to path and clears transient completion state', async () => {
    const user = userEvent.setup()
    getAttemptMock.mockResolvedValue(
      mockLessonAttempt({
        status: 'completed',
        current_index: 2,
        terminal_summary: {
          outcome: 'completed',
          xp_earned: 15,
          perfect: true,
          completed_at: '2026-07-19T11:30:00Z',
        },
      }),
    )
    useSessionStore.getState().setCompletion(mockCompletionResponse())

    renderWithToast(<LessonPlayer attemptId={9001} />)
    await screen.findByRole('heading', { name: 'Lesson complete!' })
    await user.click(screen.getByRole('button', { name: 'Return to learning path' }))

    expect(pushMock).toHaveBeenCalledWith('/')
    expect(useSessionStore.getState().completion).toBeNull()
    expect(useSessionStore.getState().attempt).toBeNull()
  })

  it('hides decorative celebration particles from assistive technology', async () => {
    getAttemptMock.mockResolvedValue(
      mockLessonAttempt({
        status: 'completed',
        current_index: 2,
        terminal_summary: {
          outcome: 'completed',
          xp_earned: 15,
          perfect: true,
          completed_at: '2026-07-19T11:30:00Z',
        },
      }),
    )

    const { container } = renderWithToast(<LessonPlayer attemptId={9001} />)
    await screen.findByRole('heading', { name: 'Lesson complete!' })
    const decorative = container.querySelectorAll('[aria-hidden="true"]')
    expect(decorative.length).toBeGreaterThan(0)
  })
})
