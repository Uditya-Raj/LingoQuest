'use client'

/**
 * Production exercise renderer — dispatches by exercise type discriminant.
 */

import type { ExerciseRendererContract, ExerciseRendererProps } from '@/components/lesson/exercise-renderer-types'
import { buildAnswerPayload } from '@/components/lesson/exercise-renderer-types'
import { ExerciseErrorFrame } from '@/components/lesson/exercise-frame'
import {
  isMatchPairsExercise,
  isMultipleChoiceExercise,
  isWordBankExercise,
  malformedExerciseMessage,
} from '@/components/lesson/exercise-guards'
import {
  FillBlankExerciseView,
  MatchPairsExerciseView,
  MultipleChoiceExerciseView,
  TypeAnswerExerciseView,
  WordBankExerciseView,
} from '@/components/lesson/exercises'
import type {
  AnswerFor,
  MatchPair,
  PublicExercise,
  SubmittedAnswer,
} from '@/lib/contracts/exercises'

function isMcDraft(draft: SubmittedAnswer | null): draft is AnswerFor<'multiple_choice'> {
  return (
    draft !== null &&
    'option_id' in draft &&
    typeof draft.option_id === 'string' &&
    draft.option_id.length > 0
  )
}

function isWordBankDraft(
  draft: SubmittedAnswer | null,
): draft is AnswerFor<'translate_word_bank'> {
  return (
    draft !== null &&
    'ordered_ids' in draft &&
    Array.isArray(draft.ordered_ids) &&
    draft.ordered_ids.length > 0 &&
    draft.ordered_ids.every((id) => typeof id === 'string')
  )
}

function isMatchDraft(draft: SubmittedAnswer | null): draft is AnswerFor<'match_pairs'> {
  return (
    draft !== null &&
    'pairs' in draft &&
    Array.isArray(draft.pairs) &&
    draft.pairs.every(
      (pair): pair is MatchPair =>
        typeof pair === 'object' &&
        pair !== null &&
        typeof pair.left_id === 'string' &&
        typeof pair.right_id === 'string',
    )
  )
}

function isTextDraft(
  draft: SubmittedAnswer | null,
): draft is AnswerFor<'fill_blank'> | AnswerFor<'type_answer'> {
  return (
    draft !== null &&
    'text' in draft &&
    typeof draft.text === 'string' &&
    draft.text.trim().length > 0
  )
}

function uniqueIds(ids: string[]): boolean {
  return new Set(ids).size === ids.length
}

function isDraftValidForExercise(
  exercise: PublicExercise,
  draft: SubmittedAnswer | null,
): boolean {
  switch (exercise.type) {
    case 'multiple_choice': {
      if (!isMultipleChoiceExercise(exercise) || !isMcDraft(draft)) return false
      return exercise.options.some((option) => option.id === draft.option_id)
    }
    case 'translate_word_bank': {
      if (!isWordBankExercise(exercise) || !isWordBankDraft(draft)) return false
      const validIds = new Set(exercise.options.map((option) => option.id))
      return (
        uniqueIds(draft.ordered_ids) &&
        draft.ordered_ids.every((id) => validIds.has(id))
      )
    }
    case 'match_pairs': {
      if (!isMatchPairsExercise(exercise) || !isMatchDraft(draft)) return false
      return isMatchDraftComplete(exercise, draft)
    }
    case 'fill_blank':
    case 'type_answer':
      return isTextDraft(draft)
    default: {
      const _exhaustive: never = exercise
      void _exhaustive
      return false
    }
  }
}

function isMatchDraftComplete(
  exercise: PublicExercise & { type: 'match_pairs' },
  draft: AnswerFor<'match_pairs'>,
): boolean {
  const leftIds = exercise.options.left.map((item) => item.id)
  const rightIds = new Set(exercise.options.right.map((item) => item.id))
  const leftSet = new Set(leftIds)

  if (draft.pairs.length !== leftIds.length) return false
  if (!uniqueIds(draft.pairs.map((pair) => pair.left_id))) return false
  if (!uniqueIds(draft.pairs.map((pair) => pair.right_id))) return false

  for (const pair of draft.pairs) {
    if (!leftSet.has(pair.left_id)) return false
    if (!rightIds.has(pair.right_id)) return false
  }

  return leftIds.every((id) => draft.pairs.some((pair) => pair.left_id === id))
}

function ExerciseRendererComponent(props: ExerciseRendererProps) {
  const { exercise } = props
  const exerciseId = exercise.id
  const exerciseType = exercise.type

  switch (exercise.type) {
    case 'multiple_choice': {
      if (!isMultipleChoiceExercise(exercise)) {
        return (
          <ExerciseErrorFrame
            exerciseId={exerciseId}
            exerciseType={exerciseType}
            message={malformedExerciseMessage(exercise)}
          />
        )
      }
      return <MultipleChoiceExerciseView {...props} exercise={exercise} />
    }
    case 'translate_word_bank': {
      if (!isWordBankExercise(exercise)) {
        return (
          <ExerciseErrorFrame
            exerciseId={exerciseId}
            exerciseType={exerciseType}
            message={malformedExerciseMessage(exercise)}
          />
        )
      }
      return <WordBankExerciseView {...props} exercise={exercise} />
    }
    case 'match_pairs': {
      if (!isMatchPairsExercise(exercise)) {
        return (
          <ExerciseErrorFrame
            exerciseId={exerciseId}
            exerciseType={exerciseType}
            message={malformedExerciseMessage(exercise)}
          />
        )
      }
      return (
        <MatchPairsExerciseView
          key={exercise.id}
          {...props}
          exercise={exercise}
        />
      )
    }
    case 'fill_blank':
      return <FillBlankExerciseView {...props} exercise={exercise} />
    case 'type_answer':
      return <TypeAnswerExerciseView {...props} exercise={exercise} />
    default: {
      const _exhaustive: never = exercise
      void _exhaustive
      return (
        <ExerciseErrorFrame
          exerciseId={exerciseId}
          exerciseType={String(exerciseType)}
          message="This exercise type is not supported yet."
        />
      )
    }
  }
}

export const exerciseRenderer: ExerciseRendererContract = {
  Component: ExerciseRendererComponent,

  buildSubmitPayload(exercise, draft) {
    if (draft === null || !isDraftValidForExercise(exercise, draft)) return null
    return buildAnswerPayload(exercise, draft)
  },

  isDraftValid(exercise, draft) {
    return isDraftValidForExercise(exercise, draft)
  },

  resetKey(exercise) {
    return `${exercise.id}-${exercise.position}-${exercise.type}`
  },
}
