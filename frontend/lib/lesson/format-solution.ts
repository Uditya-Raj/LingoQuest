/**
 * Basic correct-solution formatting for feedback placeholder UI.
 */

import type { CorrectAnswer, ExerciseType, PublicExercise } from '@/lib/contracts/exercises'

export function formatCorrectSolution(
  exercise: PublicExercise,
  correctAnswer: CorrectAnswer,
): string {
  switch (exercise.type) {
    case 'multiple_choice': {
      const typed = correctAnswer as CorrectAnswer & { option_id?: string }
      const match = exercise.options.find((o) => o.id === typed.option_id)
      return match?.text ?? typed.option_id ?? 'See solution'
    }
    case 'translate_word_bank': {
      const typed = correctAnswer as CorrectAnswer & { ordered_ids?: string[] }
      const ids = typed.ordered_ids ?? []
      const words = ids.map(
        (id) => exercise.options.find((o) => o.id === id)?.text ?? id,
      )
      return words.join(' ')
    }
    case 'match_pairs': {
      const typed = correctAnswer as CorrectAnswer & {
        pairs?: { left_id: string; right_id: string }[]
      }
      const pairs = typed.pairs ?? []
      return pairs
        .map((pair) => {
          const left = exercise.options.left.find((o) => o.id === pair.left_id)
          const right = exercise.options.right.find((o) => o.id === pair.right_id)
          return `${left?.text ?? pair.left_id} → ${right?.text ?? pair.right_id}`
        })
        .join('; ')
    }
    case 'fill_blank':
    case 'type_answer': {
      const typed = correctAnswer as CorrectAnswer & {
        text?: string
        accepted?: string[]
      }
      if ('accepted' in typed && Array.isArray(typed.accepted)) {
        return typed.accepted.join(' / ')
      }
      return typed.text ?? 'See solution'
    }
    default: {
      const _exhaustive: never = exercise
      return String(_exhaustive)
    }
  }
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
