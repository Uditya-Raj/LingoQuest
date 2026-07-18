import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { LessonPlayer } from '@/components/lesson/lesson-player'
import { ApiError } from '@/lib/api/client'
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

async function answerCurrentExercise(user: ReturnType<typeof userEvent.setup>) {
  const exercise = allFiveExercises.find((item) =>
    screen.queryByRole('heading', { name: item.prompt }),
  )
  expect(exercise).toBeTruthy()
  if (!exercise) throw new Error('No exercise heading found')

  switch (exercise.type) {
    case 'multiple_choice': {
      await user.click(screen.getByRole('radio', { name: 'Hola' }))
      break
    }
    case 'translate_word_bank': {
      await user.click(screen.getByRole('button', { name: 'Add Yo' }))
      await user.click(screen.getByRole('button', { name: 'Add como, choice 1' }))
      await user.click(screen.getByRole('button', { name: 'Add pan' }))
      break
    }
    case 'match_pairs': {
      await user.click(screen.getByRole('button', { name: /el pan, left item/i }))
      await user.click(screen.getByRole('button', { name: /bread, right item/i }))
      await user.click(
        screen.getByRole('button', { name: /la leche, left item/i }),
      )
      await user.click(screen.getByRole('button', { name: /milk, right item/i }))
      break
    }
    case 'fill_blank': {
      await user.type(screen.getByLabelText('Type the missing word'), 'días')
      break
    }
    case 'type_answer': {
      await user.type(screen.getByLabelText('Type your answer'), 'Thank you')
      break
    }
    default: {
      const _exhaustive: never = exercise
      throw new Error(`Unhandled ${( _exhaustive as { type: string }).type}`)
    }
  }

  const check = screen.getByRole('button', { name: 'Check' })
  expect(check).toBeEnabled()
  await user.click(check)

  const continueButton = await screen.findByRole('button', {
    name: /Continue|Finish lesson/i,
  })
  await user.click(continueButton)
  return exercise
}

describe('LessonPlayer five-exercise journey', () => {
  beforeEach(() => {
    getAttemptMock.mockReset()
    submitAnswerMock.mockReset()
    completeLessonMock.mockReset()
    useSessionStore.getState().reset()
  })

  it(
    'runs all five types through check, feedback, continue, and completion',
    async () => {
    const user = userEvent.setup()
    const attempt = mockFiveTypeAttempt()
    getAttemptMock.mockResolvedValue(attempt)

    submitAnswerMock.mockImplementation(
      (_id: number, payload: { exercise_id: number; answer: unknown }) => {
        const exercise = allFiveExercises.find(
          (item) => item.id === payload.exercise_id,
        )
        if (!exercise) throw new Error('unknown exercise')
        return Promise.resolve(mockAnswerForExercise(exercise))
      },
    )
    completeLessonMock.mockResolvedValue(mockJourneyCompletion())

    renderWithToast(<LessonPlayer attemptId={9200} />)

    await screen.findByRole('heading', {
      name: allFiveExercises[0]!.prompt,
    })

    const submitted: unknown[] = []
    for (let index = 0; index < allFiveExercises.length; index += 1) {
      const exercise = await answerCurrentExercise(user)
      submitted.push(exercise.type)

      if (index < allFiveExercises.length - 1) {
        await screen.findByRole('heading', {
          name: allFiveExercises[index + 1]!.prompt,
        })
        // Focus moves to next prompt heading
        expect(
          screen.getByRole('heading', {
            name: allFiveExercises[index + 1]!.prompt,
          }),
        ).toHaveFocus()
      }
    }

    expect(submitted).toEqual([
      'multiple_choice',
      'translate_word_bank',
      'match_pairs',
      'fill_blank',
      'type_answer',
    ])

    await waitFor(() => {
      expect(completeLessonMock).toHaveBeenCalledTimes(1)
    })
    expect(
      await screen.findByRole('heading', { name: 'Lesson complete!' }),
    ).toBeInTheDocument()
    expect(useSessionStore.getState().completion?.xp.earned).toBe(15)

    expect(submitAnswerMock).toHaveBeenCalledTimes(5)
    expect(submitAnswerMock.mock.calls[0]![1]).toMatchObject({
      exercise_id: 601,
      position: 0,
      answer: { option_id: 'opt_a' },
    })
    expect(submitAnswerMock.mock.calls[1]![1]).toMatchObject({
      answer: { ordered_ids: ['w1', 'w2', 'w3'] },
    })
    expect(submitAnswerMock.mock.calls[2]![1]).toMatchObject({
      answer: {
        pairs: [
          { left_id: 'l1', right_id: 'r1' },
          { left_id: 'l2', right_id: 'r2' },
        ],
      },
    })
    expect(submitAnswerMock.mock.calls[3]![1]).toMatchObject({
      answer: { text: 'días' },
    })
    expect(submitAnswerMock.mock.calls[4]![1]).toMatchObject({
      answer: { text: 'Thank you' },
    })

    for (const exercise of attempt.exercises) {
      expect(exercise).not.toHaveProperty('correct_answer')
    }
  },
  20_000,
  )

  it('enables Check only for valid drafts and preserves draft on mutation error', async () => {
    const user = userEvent.setup()
    getAttemptMock.mockResolvedValue(mockFiveTypeAttempt())
    submitAnswerMock.mockRejectedValue(
      new ApiError(409, 'CONFLICT', 'Answer conflict'),
    )

    renderWithToast(<LessonPlayer attemptId={9200} />)
    await screen.findByRole('heading', {
      name: allFiveExercises[0]!.prompt,
    })

    const check = screen.getByRole('button', { name: 'Check' })
    expect(check).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'Hola' }))
    expect(check).toBeEnabled()

    await user.click(check)
    expect(await screen.findByRole('alert')).toHaveTextContent(/conflict/i)
    expect(screen.getByRole('radio', { name: 'Hola' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(completeLessonMock).not.toHaveBeenCalled()
  })

  it('updates hearts from wrong-answer response and fails without completion', async () => {
    const user = userEvent.setup()
    getAttemptMock.mockResolvedValue(mockFiveTypeAttempt({ hearts: 1 }))
    submitAnswerMock.mockResolvedValue(
      mockAnswerForExercise(allFiveExercises[0]!, {
        is_correct: false,
        hearts_remaining: 0,
        lesson_status: 'failed',
        can_complete: false,
        correct_answer: { option_id: 'opt_a' },
      }),
    )

    renderWithToast(<LessonPlayer attemptId={9200} />)
    await screen.findByRole('heading', {
      name: allFiveExercises[0]!.prompt,
    })

    await user.click(screen.getByRole('radio', { name: 'Adiós' }))
    await user.click(screen.getByRole('button', { name: 'Check' }))

    expect(await screen.findByRole('heading', { name: 'Out of hearts' })).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(completeLessonMock).not.toHaveBeenCalled()
    expect(useSessionStore.getState().hearts?.hearts).toBe(0)
  })

  it('prevents duplicate Check while submitting', async () => {
    const user = userEvent.setup()
    getAttemptMock.mockResolvedValue(mockFiveTypeAttempt())

    let resolveAnswer: (value: unknown) => void = () => {}
    submitAnswerMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAnswer = resolve
        }),
    )

    renderWithToast(<LessonPlayer attemptId={9200} />)
    await screen.findByRole('heading', {
      name: allFiveExercises[0]!.prompt,
    })

    await user.click(screen.getByRole('radio', { name: 'Hola' }))
    const check = screen.getByRole('button', { name: 'Check' })
    await user.click(check)
    await user.click(check)
    expect(submitAnswerMock).toHaveBeenCalledTimes(1)

    resolveAnswer(mockAnswerForExercise(allFiveExercises[0]!))
    expect(
      await screen.findByRole('button', { name: 'Continue' }),
    ).toBeInTheDocument()
  })

  it('locks renderer during feedback and advances on Continue', async () => {
    const user = userEvent.setup()
    getAttemptMock.mockResolvedValue(mockFiveTypeAttempt())
    submitAnswerMock.mockResolvedValue(mockAnswerForExercise(allFiveExercises[0]!))

    renderWithToast(<LessonPlayer attemptId={9200} />)
    await screen.findByRole('heading', {
      name: allFiveExercises[0]!.prompt,
    })

    await user.click(screen.getByRole('radio', { name: 'Hola' }))
    await user.click(screen.getByRole('button', { name: 'Check' }))

    expect(
      await screen.findByRole('button', { name: 'Continue' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Check' })).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Hola' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await screen.findByRole('heading', {
      name: allFiveExercises[1]!.prompt,
    })
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled()
  })
})
