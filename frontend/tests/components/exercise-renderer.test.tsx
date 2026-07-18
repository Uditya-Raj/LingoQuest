import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { exerciseRenderer } from '@/components/lesson/exercise-renderer'
import type { PublicExercise, SubmittedAnswer } from '@/lib/contracts/exercises'
import { ExerciseHarness } from '@/tests/components/exercise-test-harness'
import {
  exerciseFillBlank,
  exerciseMatchPairs,
  exerciseMultipleChoice,
  exerciseTypeAnswer,
  exerciseWordBank,
} from '@/tests/fixtures/phase10b'

function renderExercise(
  exercise: PublicExercise,
  overrides: {
    draftAnswer?: SubmittedAnswer | null
    onDraftChange?: (answer: SubmittedAnswer | null) => void
    disabled?: boolean
    isSubmitting?: boolean
    feedback?: {
      isCorrect: boolean
      correctAnswer: Record<string, unknown>
    } | null
  } = {},
) {
  const onDraftChange = overrides.onDraftChange ?? vi.fn()
  const Renderer = exerciseRenderer.Component
  return {
    onDraftChange,
    ...render(
      <Renderer
        exercise={exercise}
        draftAnswer={overrides.draftAnswer ?? null}
        onDraftChange={onDraftChange}
        disabled={overrides.disabled ?? false}
        isSubmitting={overrides.isSubmitting ?? false}
        feedback={(overrides.feedback as never) ?? null}
      />,
    ),
  }
}

describe('exerciseRenderer dispatcher', () => {
  it('dispatches all five exercise types', () => {
    const cases: Array<[PublicExercise, RegExp]> = [
      [exerciseMultipleChoice, /Choose the best answer/i],
      [exerciseWordBank, /Build the translation/i],
      [exerciseMatchPairs, /Match each item/i],
      [exerciseFillBlank, /Fill in the missing word/i],
      [exerciseTypeAnswer, /Type your answer\./i],
    ]

    for (const [exercise, instruction] of cases) {
      const { unmount } = renderExercise(exercise)
      expect(screen.getByText(instruction)).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { name: exercise.prompt }),
      ).toBeInTheDocument()
      unmount()
    }
  })

  it('resets draft validity when exercise identity changes', () => {
    expect(
      exerciseRenderer.isDraftValid(exerciseMultipleChoice, {
        option_id: 'opt_a',
      }),
    ).toBe(true)

    expect(
      exerciseRenderer.isDraftValid(exerciseFillBlank, {
        option_id: 'opt_a',
      } as never),
    ).toBe(false)

    expect(exerciseRenderer.resetKey(exerciseMultipleChoice)).not.toEqual(
      exerciseRenderer.resetKey(exerciseFillBlank),
    )
  })

  it('fails safely for malformed options without exposing raw JSON as the main UI', () => {
    const malformed = {
      ...exerciseMultipleChoice,
      options: null,
    } as unknown as PublicExercise

    const { container } = renderExercise(malformed)
    expect(
      screen.getByRole('heading', { name: /could not be shown/i }),
    ).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/"option_id"/)
    expect(exerciseRenderer.isDraftValid(malformed, { option_id: 'x' })).toBe(
      false,
    )
  })

  it('never reads correct_answer from public exercises', () => {
    for (const exercise of [
      exerciseMultipleChoice,
      exerciseWordBank,
      exerciseMatchPairs,
      exerciseFillBlank,
      exerciseTypeAnswer,
    ]) {
      expect(exercise).not.toHaveProperty('correct_answer')
      const { container, unmount } = renderExercise(exercise)
      expect(container.innerHTML).not.toContain('correct_answer')
      unmount()
    }
  })

  it('builds exact typed payloads per exercise type', () => {
    expect(
      exerciseRenderer.buildSubmitPayload(exerciseMultipleChoice, {
        option_id: 'opt_b',
      }),
    ).toEqual({
      exercise_id: 601,
      position: 0,
      answer: { option_id: 'opt_b' },
    })

    expect(
      exerciseRenderer.buildSubmitPayload(exerciseWordBank, {
        ordered_ids: ['w1', 'w5', 'w3'],
      }),
    ).toEqual({
      exercise_id: 602,
      position: 1,
      answer: { ordered_ids: ['w1', 'w5', 'w3'] },
    })

    expect(
      exerciseRenderer.buildSubmitPayload(exerciseMatchPairs, {
        pairs: [
          { left_id: 'l1', right_id: 'r1' },
          { left_id: 'l2', right_id: 'r2' },
        ],
      }),
    ).toEqual({
      exercise_id: 603,
      position: 2,
      answer: {
        pairs: [
          { left_id: 'l1', right_id: 'r1' },
          { left_id: 'l2', right_id: 'r2' },
        ],
      },
    })

    expect(
      exerciseRenderer.buildSubmitPayload(exerciseFillBlank, { text: 'días' }),
    ).toEqual({
      exercise_id: 604,
      position: 3,
      answer: { text: 'días' },
    })

    expect(
      exerciseRenderer.buildSubmitPayload(exerciseTypeAnswer, {
        text: 'Gracias',
      }),
    ).toEqual({
      exercise_id: 605,
      position: 4,
      answer: { text: 'Gracias' },
    })
  })
})

describe('multiple choice interaction', () => {
  it('supports one selection, replacement, payload, locking, and keyboard', async () => {
    const user = userEvent.setup()
    const onDraftChange = vi.fn()

    const { rerender } = render(
      <ExerciseHarness
        exercise={exerciseMultipleChoice}
        onDraftChange={onDraftChange}
      />,
    )

    await user.click(screen.getByRole('radio', { name: 'Adiós' }))
    expect(onDraftChange).toHaveBeenLastCalledWith({ option_id: 'opt_b' })

    await user.click(screen.getByRole('radio', { name: 'Hola' }))
    expect(onDraftChange).toHaveBeenLastCalledWith({ option_id: 'opt_a' })
    expect(
      exerciseRenderer.buildSubmitPayload(exerciseMultipleChoice, {
        option_id: 'opt_a',
      }),
    ).toEqual({
      exercise_id: 601,
      position: 0,
      answer: { option_id: 'opt_a' },
    })

    const radio = screen.getByRole('radio', { name: 'Hola' })
    radio.focus()
    await user.keyboard('{Enter}')
    expect(onDraftChange).toHaveBeenLastCalledWith({ option_id: 'opt_a' })

    rerender(
      <ExerciseHarness
        exercise={exerciseMultipleChoice}
        disabled
        feedback={{
          isCorrect: true,
          correctAnswer: { option_id: 'opt_a' },
        }}
        onDraftChange={onDraftChange}
      />,
    )

    expect(screen.getByRole('radio', { name: 'Hola' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'Adiós' })).toBeDisabled()
  })
})

describe('word bank interaction', () => {
  it('adds, removes, preserves duplicate word identities, and locks', async () => {
    const user = userEvent.setup()
    const onDraftChange = vi.fn()

    const { rerender } = render(
      <ExerciseHarness
        exercise={exerciseWordBank}
        onDraftChange={onDraftChange}
      />,
    )

    expect(exerciseRenderer.isDraftValid(exerciseWordBank, null)).toBe(false)

    await user.click(screen.getByRole('button', { name: 'Add Yo' }))
    expect(onDraftChange).toHaveBeenLastCalledWith({ ordered_ids: ['w1'] })

    await user.click(screen.getByRole('button', { name: 'Add como, choice 1' }))
    expect(onDraftChange).toHaveBeenLastCalledWith({ ordered_ids: ['w1', 'w2'] })

    await user.click(screen.getByRole('button', { name: 'Add como, choice 2' }))
    expect(onDraftChange).toHaveBeenLastCalledWith({
      ordered_ids: ['w1', 'w2', 'w5'],
    })

    await user.click(
      screen.getByRole('button', { name: 'Remove como from position 2' }),
    )
    expect(onDraftChange).toHaveBeenLastCalledWith({
      ordered_ids: ['w1', 'w5'],
    })

    expect(
      exerciseRenderer.buildSubmitPayload(exerciseWordBank, {
        ordered_ids: ['w1', 'w2', 'w3'],
      })?.answer,
    ).toEqual({ ordered_ids: ['w1', 'w2', 'w3'] })

    rerender(
      <ExerciseHarness
        exercise={exerciseWordBank}
        disabled
        feedback={{
          isCorrect: false,
          correctAnswer: { ordered_ids: ['w1', 'w2', 'w3'] },
        }}
        onDraftChange={onDraftChange}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Remove Yo from position 1' }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Add pan' })).toBeDisabled()
  })
})

describe('match pairs interaction', () => {
  it('creates, replaces, validates, and stays keyboard operable without local grading', async () => {
    const user = userEvent.setup()
    const onDraftChange = vi.fn()

    render(
      <ExerciseHarness
        exercise={exerciseMatchPairs}
        onDraftChange={onDraftChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: /el pan, left item/i }))
    await user.click(screen.getByRole('button', { name: /bread, right item/i }))
    expect(onDraftChange).toHaveBeenLastCalledWith({
      pairs: [{ left_id: 'l1', right_id: 'r1' }],
    })

    expect(
      exerciseRenderer.isDraftValid(exerciseMatchPairs, {
        pairs: [{ left_id: 'l1', right_id: 'r1' }],
      }),
    ).toBe(false)

    await user.click(screen.getByRole('button', { name: /la leche, left item/i }))
    await user.click(screen.getByRole('button', { name: /milk, right item/i }))
    expect(onDraftChange).toHaveBeenLastCalledWith({
      pairs: [
        { left_id: 'l1', right_id: 'r1' },
        { left_id: 'l2', right_id: 'r2' },
      ],
    })
    expect(
      exerciseRenderer.isDraftValid(exerciseMatchPairs, {
        pairs: [
          { left_id: 'l1', right_id: 'r1' },
          { left_id: 'l2', right_id: 'r2' },
        ],
      }),
    ).toBe(true)

    await user.click(
      screen.getByRole('button', {
        name: /el pan, pair 1\. Activate to unpair/i,
      }),
    )
    expect(onDraftChange).toHaveBeenLastCalledWith({
      pairs: [{ left_id: 'l2', right_id: 'r2' }],
    })

    expect(screen.queryByText(/^Correct!$/i)).not.toBeInTheDocument()
  })
})

describe('fill blank interaction', () => {
  it('splits prompt, rejects whitespace, preserves raw text, and respects IME', async () => {
    const user = userEvent.setup()
    const onDraftChange = vi.fn()
    const onRequestCheck = vi.fn()

    render(
      <ExerciseHarness
        exercise={exerciseFillBlank}
        onDraftChange={onDraftChange}
        onRequestCheck={onRequestCheck}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Buenos ___' })).toBeInTheDocument()
    expect(exerciseRenderer.isDraftValid(exerciseFillBlank, { text: '   ' })).toBe(
      false,
    )

    const input = screen.getByLabelText('Type the missing word')
    await user.type(input, 'días')
    expect(onDraftChange).toHaveBeenLastCalledWith({ text: 'días' })

    await user.keyboard('{Enter}')
    expect(onRequestCheck).toHaveBeenCalledTimes(1)

    const noMarker = {
      ...exerciseFillBlank,
      id: 999,
      prompt: 'No blank marker here',
    }
    const { unmount } = renderExercise(noMarker)
    expect(
      screen.getByText(/Type the missing word for this sentence/i),
    ).toBeInTheDocument()
    unmount()
  })
})

describe('type answer interaction', () => {
  it('preserves accented text and locks during feedback', async () => {
    const user = userEvent.setup()
    const onDraftChange = vi.fn()

    const { rerender } = render(
      <ExerciseHarness
        exercise={exerciseTypeAnswer}
        onDraftChange={onDraftChange}
      />,
    )

    expect(exerciseRenderer.isDraftValid(exerciseTypeAnswer, { text: '' })).toBe(
      false,
    )

    const input = screen.getByLabelText('Type your answer')
    await user.type(input, 'café')
    expect(onDraftChange).toHaveBeenLastCalledWith({ text: 'café' })

    expect(
      exerciseRenderer.buildSubmitPayload(exerciseTypeAnswer, { text: 'café' })
        ?.answer,
    ).toEqual({ text: 'café' })

    const Renderer = exerciseRenderer.Component
    rerender(
      <Renderer
        exercise={exerciseTypeAnswer}
        draftAnswer={{ text: 'café' }}
        onDraftChange={onDraftChange}
        disabled
        isSubmitting={false}
        feedback={{
          isCorrect: true,
          correctAnswer: { accepted: ['café'] },
        }}
      />,
    )

    expect(screen.getByLabelText('Type your answer')).toBeDisabled()
  })
})
