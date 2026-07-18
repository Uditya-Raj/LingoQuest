import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { LessonPlayer } from '@/components/lesson/lesson-player'
import { testExerciseRenderer } from '@/components/lesson/placeholder-exercise-renderer'
import { ApiError } from '@/lib/api/client'
import {
  mockCompletedAttempt,
  mockFailedAttempt,
  mockLessonAttempt,
} from '@/tests/fixtures/phase10a'
import { renderWithToast } from '@/tests/helpers/render-with-toast'
import { useSessionStore } from '@/stores/session-store'

const getAttemptMock = vi.fn()
const submitAnswerMock = vi.fn()
const completeLessonMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    getAttempt: (...args: unknown[]) => getAttemptMock(...args),
    submitAnswer: (...args: unknown[]) => submitAnswerMock(...args),
    completeLesson: (...args: unknown[]) => completeLessonMock(...args),
  }
})

describe('LessonPlayer shell', () => {
  beforeEach(() => {
    getAttemptMock.mockReset()
    submitAnswerMock.mockReset()
    completeLessonMock.mockReset()
    useSessionStore.getState().reset()
  })

  it('shows accessible progress and hearts labels', async () => {
    getAttemptMock.mockResolvedValue(
      mockLessonAttempt({ current_index: 1, hearts: 3, total_exercises: 5 }),
    )

    renderWithToast(
      <LessonPlayer attemptId={9001} renderer={testExerciseRenderer} />,
    )

    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'aria-label',
        'Exercise 2 of 5',
      )
    })
    expect(screen.getByRole('status', { name: '3 of 5 hearts' })).toBeInTheDocument()
  })

  it('never depends on correct_answer in retrieve payload', async () => {
    const attempt = mockLessonAttempt()
    getAttemptMock.mockResolvedValue(attempt)
    const { container } = renderWithToast(<LessonPlayer attemptId={9001} />)
    await screen.findByRole('heading', { name: attempt.exercises[0]!.prompt })

    expect(container.innerHTML).not.toContain('correct_answer')
    for (const exercise of attempt.exercises) {
      expect(exercise).not.toHaveProperty('correct_answer')
    }
  })

  it('opens exit confirmation and keeps lesson active when cancelled', async () => {
    const user = userEvent.setup()
    getAttemptMock.mockResolvedValue(mockLessonAttempt())
    renderWithToast(<LessonPlayer attemptId={9001} />)

    const exitButton = await screen.findByRole('button', {
      name: /Exit Food lesson/i,
    })
    await user.click(exitButton)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Keep learning' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(exitButton).toHaveFocus()
  })

  it('shows completed state for terminal completed attempts', async () => {
    getAttemptMock.mockResolvedValue(mockCompletedAttempt())
    renderWithToast(<LessonPlayer attemptId={9001} />)
    expect(
      await screen.findByRole('heading', { name: 'Lesson complete!' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Food/i)).toBeInTheDocument()
  })

  it('shows failed state for terminal failed attempts', async () => {
    getAttemptMock.mockResolvedValue(mockFailedAttempt())
    renderWithToast(<LessonPlayer attemptId={9001} />)
    expect(await screen.findByRole('heading', { name: 'Out of hearts' })).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('shows not-found error for missing attempts', async () => {
    getAttemptMock.mockRejectedValue(
      new ApiError(404, 'ATTEMPT_NOT_FOUND', 'Attempt not found'),
    )
    renderWithToast(<LessonPlayer attemptId={999} />)
    expect(await screen.findByRole('heading', { name: 'Attempt not found' })).toBeInTheDocument()
  })

  it('uses focused lesson landmark structure while loading', () => {
    getAttemptMock.mockImplementation(() => new Promise(() => {}))
    renderWithToast(<LessonPlayer attemptId={9001} />)
    expect(screen.getByLabelText('Loading lesson')).toBeInTheDocument()
  })

  it('keeps Check disabled until a valid exercise draft exists', async () => {
    getAttemptMock.mockResolvedValue(mockLessonAttempt())
    renderWithToast(<LessonPlayer attemptId={9001} />)
    await screen.findByRole('heading', { name: 'Select hello' })
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'Hello' })).toBeInTheDocument()
  })

  it('renders timed countdown without failing locally', async () => {
    getAttemptMock.mockResolvedValue(
      mockLessonAttempt({
        mode: 'timed',
        remaining_seconds: 88,
        expires_at: new Date(Date.now() + 88_000).toISOString(),
      }),
    )
    renderWithToast(<LessonPlayer attemptId={9001} />)
    expect(await screen.findByText('Timed Practice')).toBeInTheDocument()
    expect(screen.getByRole('timer')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Time's up/i })).not.toBeInTheDocument()
  })
})
