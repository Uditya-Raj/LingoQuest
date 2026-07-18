/**
 * Read-only verification against real attempt 143 public exercise data.
 * Does not call answer/complete endpoints.
 */

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { exerciseRenderer } from '@/components/lesson/exercise-renderer'
import type { PublicExercise } from '@/lib/contracts/exercises'
import type { LessonAttemptResponse } from '@/lib/contracts/lesson'

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ??
  'http://127.0.0.1:8000'

async function fetchAttempt143(): Promise<LessonAttemptResponse | null> {
  try {
    const response = await fetch(`${API_BASE}/api/lessons/143`)
    if (!response.ok) return null
    return (await response.json()) as LessonAttemptResponse
  } catch {
    return null
  }
}

function pickOneOfEachType(exercises: PublicExercise[]): PublicExercise[] {
  const seen = new Set<PublicExercise['type']>()
  const picked: PublicExercise[] = []
  for (const exercise of exercises) {
    if (seen.has(exercise.type)) continue
    seen.add(exercise.type)
    picked.push(exercise)
    if (seen.size === 5) break
  }
  return picked
}

describe('attempt 143 read-only exercise render', () => {
  it('renders all five public types without correct_answer and leaves attempt unchanged', async () => {
    const first = await fetchAttempt143()
    if (first === null) {
      console.warn('Skipping attempt 143 check — API unavailable')
      return
    }

    expect(first.status).toBe('in_progress')
    expect(first.current_index).toBe(0)
    expect(JSON.stringify(first)).not.toContain('correct_answer')

    const types = new Set(first.exercises.map((exercise) => exercise.type))
    expect(types).toEqual(
      new Set([
        'multiple_choice',
        'translate_word_bank',
        'match_pairs',
        'fill_blank',
        'type_answer',
      ]),
    )

    const Renderer = exerciseRenderer.Component
    const samples = pickOneOfEachType(first.exercises)
    expect(samples).toHaveLength(5)

    for (const exercise of samples) {
      expect(exercise).not.toHaveProperty('correct_answer')
      const { unmount, container } = render(
        <Renderer
          exercise={exercise}
          draftAnswer={null}
          onDraftChange={() => {}}
          disabled={false}
          isSubmitting={false}
          feedback={null}
        />,
      )
      expect(
        screen.getByRole('heading', { name: exercise.prompt }),
      ).toBeInTheDocument()
      expect(container.innerHTML).not.toContain('correct_answer')
      expect(screen.queryByRole('heading', { name: /could not be shown/i })).toBeNull()
      unmount()
    }

    const second = await fetchAttempt143()
    expect(second).not.toBeNull()
    if (!second) return
    expect(second.status).toBe('in_progress')
    expect(second.current_index).toBe(0)
    expect(second.attempt_id).toBe(143)
  }, 15_000)
})
