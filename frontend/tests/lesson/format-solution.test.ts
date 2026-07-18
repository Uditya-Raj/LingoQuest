import { describe, expect, it } from 'vitest'

import {
  allFiveExercises,
  exerciseFillBlank,
  exerciseMatchPairs,
  exerciseMultipleChoice,
  exerciseTypeAnswer,
  exerciseWordBank,
} from '@/tests/fixtures/phase10b'
import { formatCorrectSolution } from '@/lib/lesson/format-solution'

describe('formatCorrectSolution', () => {
  it('formats all five exercise types from answer-response data', () => {
    expect(
      formatCorrectSolution(exerciseMultipleChoice, { option_id: 'opt_a' }).text,
    ).toBe('Hola')
    expect(
      formatCorrectSolution(exerciseWordBank, {
        ordered_ids: ['w1', 'w2', 'w3'],
      }).text,
    ).toBe('Yo como pan')
    expect(
      formatCorrectSolution(exerciseMatchPairs, {
        pairs: [
          { left_id: 'l1', right_id: 'r1' },
          { left_id: 'l2', right_id: 'r2' },
        ],
      }).pairs,
    ).toEqual([
      { left: 'el pan', right: 'bread' },
      { left: 'la leche', right: 'milk' },
    ])
    expect(
      formatCorrectSolution(exerciseFillBlank, { text: 'días' }).text,
    ).toBe('días')
    expect(
      formatCorrectSolution(exerciseTypeAnswer, {
        accepted: ['Thank you', 'thanks'],
      }).text,
    ).toBe('Thank you / thanks')
  })

  it('never dumps raw JSON and degrades on malformed payloads', () => {
    for (const exercise of allFiveExercises) {
      const result = formatCorrectSolution(exercise, { unexpected: true })
      expect(result.degraded).toBe(true)
      expect(result.text).not.toContain('{')
      expect(result.text).not.toContain('option_id')
    }
  })

  it('resolves option ids to public text only', () => {
    const result = formatCorrectSolution(exerciseMultipleChoice, {
      option_id: 'missing',
    })
    expect(result.degraded).toBe(true)
    expect(result.text).not.toBe('missing')
  })
})
