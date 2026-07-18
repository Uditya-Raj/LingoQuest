/**
 * Compile-time fixtures: each exercise type maps to its submitted answer shape.
 * If this file fails typecheck, the AnswerByType mapping is broken.
 */

import type {
  AnswerFor,
  ExerciseAnswerMappingAssert,
  ExerciseType,
} from '@/lib/contracts/exercises'

type AssertEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false

type _MappingComplete = AssertEqual<
  keyof ExerciseAnswerMappingAssert,
  ExerciseType
>

const multipleChoiceAnswer: AnswerFor<'multiple_choice'> = {
  option_id: 'a',
}

const wordBankAnswer: AnswerFor<'translate_word_bank'> = {
  ordered_ids: ['w1', 'w2', 'w3'],
}

const matchPairsAnswer: AnswerFor<'match_pairs'> = {
  pairs: [
    { left_id: 'l1', right_id: 'r1' },
    { left_id: 'l2', right_id: 'r2' },
  ],
}

const fillBlankAnswer: AnswerFor<'fill_blank'> = {
  text: 'es',
}

const typeAnswerAnswer: AnswerFor<'type_answer'> = {
  text: 'Hello',
}

export const exerciseAnswerFixtures = {
  multiple_choice: multipleChoiceAnswer,
  translate_word_bank: wordBankAnswer,
  match_pairs: matchPairsAnswer,
  fill_blank: fillBlankAnswer,
  type_answer: typeAnswerAnswer,
} satisfies ExerciseAnswerMappingAssert

// Ensure public exercise fixtures cannot require correct_answer at the type level.
type PublicExerciseKeys = keyof import('@/lib/contracts/exercises').PublicExercise
type _NoCorrectAnswerOnPublic = PublicExerciseKeys extends 'correct_answer'
  ? never
  : true

export type TypeFixturesOk = [_MappingComplete, _NoCorrectAnswerOnPublic]
