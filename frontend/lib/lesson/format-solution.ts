/**
 * Safe correct-solution formatting for answer-response feedback only.
 * Never reads start/retrieve correct_answer — callers pass answer-response data.
 */

import type { CorrectAnswer, ExerciseType, PublicExercise } from '@/lib/contracts/exercises'

export interface FormattedSolutionPair {
  left: string
  right: string
}

export interface FormattedSolution {
  /** Plain text for compact displays and live regions. */
  text: string
  /** Structured match pairs when available. */
  pairs?: FormattedSolutionPair[]
  /** True when response shape was incomplete or unexpected. */
  degraded: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function optionText(
  options: { id: string; text: string }[] | undefined,
  id: string,
): string | null {
  if (!options) return null
  const match = options.find((option) => option.id === id)
  return match?.text ?? null
}

export function formatCorrectSolution(
  exercise: PublicExercise,
  correctAnswer: CorrectAnswer | unknown,
): FormattedSolution {
  try {
    switch (exercise.type) {
      case 'multiple_choice': {
        if (!isRecord(correctAnswer) || typeof correctAnswer.option_id !== 'string') {
          return { text: 'See the correct choice above.', degraded: true }
        }
        const text = optionText(exercise.options, correctAnswer.option_id)
        if (text === null) {
          return { text: 'See the correct choice above.', degraded: true }
        }
        return { text, degraded: false }
      }
      case 'translate_word_bank': {
        if (
          !isRecord(correctAnswer) ||
          !Array.isArray(correctAnswer.ordered_ids)
        ) {
          return { text: 'See the correct word order above.', degraded: true }
        }
        const ids = correctAnswer.ordered_ids.filter(
          (id): id is string => typeof id === 'string',
        )
        const words = ids.map((id) => optionText(exercise.options, id))
        if (words.some((word) => word === null)) {
          return { text: 'See the correct word order above.', degraded: true }
        }
        return { text: words.join(' '), degraded: false }
      }
      case 'match_pairs': {
        if (!isRecord(correctAnswer) || !Array.isArray(correctAnswer.pairs)) {
          return { text: 'See the correct pairs above.', degraded: true }
        }
        const pairs: FormattedSolutionPair[] = []
        for (const raw of correctAnswer.pairs) {
          if (!isRecord(raw)) continue
          if (typeof raw.left_id !== 'string' || typeof raw.right_id !== 'string') {
            continue
          }
          const left = optionText(exercise.options.left, raw.left_id)
          const right = optionText(exercise.options.right, raw.right_id)
          if (left === null || right === null) {
            return { text: 'See the correct pairs above.', degraded: true }
          }
          pairs.push({ left, right })
        }
        if (pairs.length === 0) {
          return { text: 'See the correct pairs above.', degraded: true }
        }
        return {
          text: pairs.map((pair) => `${pair.left} matches ${pair.right}`).join('. '),
          pairs,
          degraded: false,
        }
      }
      case 'fill_blank': {
        if (!isRecord(correctAnswer) || typeof correctAnswer.text !== 'string') {
          return { text: 'See the correct word above.', degraded: true }
        }
        const text = correctAnswer.text.trim()
        if (text.length === 0) {
          return { text: 'See the correct word above.', degraded: true }
        }
        return { text, degraded: false }
      }
      case 'type_answer': {
        if (!isRecord(correctAnswer)) {
          return { text: 'See the accepted answer above.', degraded: true }
        }
        if (Array.isArray(correctAnswer.accepted)) {
          const accepted = correctAnswer.accepted.filter(
            (item): item is string =>
              typeof item === 'string' && item.trim().length > 0,
          )
          if (accepted.length === 0) {
            return { text: 'See the accepted answer above.', degraded: true }
          }
          return { text: accepted.join(' / '), degraded: false }
        }
        if (typeof correctAnswer.text === 'string' && correctAnswer.text.trim()) {
          return { text: correctAnswer.text.trim(), degraded: false }
        }
        return { text: 'See the accepted answer above.', degraded: true }
      }
      default: {
        const _exhaustive: never = exercise
        void _exhaustive
        return { text: 'See the solution above.', degraded: true }
      }
    }
  } catch {
    return { text: 'See the solution above.', degraded: true }
  }
}

/** @deprecated Prefer formatCorrectSolution(...).text for new call sites. */
export function formatCorrectSolutionText(
  exercise: PublicExercise,
  correctAnswer: CorrectAnswer,
): string {
  return formatCorrectSolution(exercise, correctAnswer).text
}

export function exerciseTypeLabel(type: ExerciseType): string {
  const labels: Record<ExerciseType, string> = {
    multiple_choice: 'Multiple choice',
    translate_word_bank: 'Word bank',
    match_pairs: 'Match pairs',
    fill_blank: 'Fill in the blank',
    type_answer: 'Type answer',
  }
  return labels[type]
}
