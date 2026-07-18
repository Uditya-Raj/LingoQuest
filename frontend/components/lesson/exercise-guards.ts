/**
 * Focused runtime guards for public exercise options at the renderer boundary.
 * Does not invent IDs or repair malformed content.
 */

import type {
  ExerciseOptionItem,
  FillBlankExercise,
  MatchPairsExercise,
  MatchPairsOptions,
  MultipleChoiceExercise,
  PublicExercise,
  TranslateWordBankExercise,
  TypeAnswerExercise,
} from '@/lib/contracts/exercises'

function isOptionItem(value: unknown): value is ExerciseOptionItem {
  if (value === null || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.id === 'string' && typeof item.text === 'string'
}

function isOptionList(value: unknown): value is ExerciseOptionItem[] {
  return Array.isArray(value) && value.length > 0 && value.every(isOptionItem)
}

export function isMultipleChoiceExercise(
  exercise: PublicExercise,
): exercise is MultipleChoiceExercise {
  return exercise.type === 'multiple_choice' && isOptionList(exercise.options)
}

export function isWordBankExercise(
  exercise: PublicExercise,
): exercise is TranslateWordBankExercise {
  return exercise.type === 'translate_word_bank' && isOptionList(exercise.options)
}

function isMatchOptions(value: unknown): value is MatchPairsOptions {
  if (value === null || typeof value !== 'object') return false
  const opts = value as Record<string, unknown>
  return isOptionList(opts.left) && isOptionList(opts.right)
}

export function isMatchPairsExercise(
  exercise: PublicExercise,
): exercise is MatchPairsExercise {
  return exercise.type === 'match_pairs' && isMatchOptions(exercise.options)
}

export function isFillBlankExercise(
  exercise: PublicExercise,
): exercise is FillBlankExercise {
  return exercise.type === 'fill_blank'
}

export function isTypeAnswerExercise(
  exercise: PublicExercise,
): exercise is TypeAnswerExercise {
  return exercise.type === 'type_answer'
}

export function malformedExerciseMessage(exercise: PublicExercise): string {
  return 'The exercise content is incomplete. Exit and try again, or continue later.'
}
