/**
 * Public and admin exercise contracts.
 * Public types never include correct_answer.
 * Admin types are separate and may include correct answers.
 */

export type ExerciseType =
  | 'multiple_choice'
  | 'translate_word_bank'
  | 'match_pairs'
  | 'fill_blank'
  | 'type_answer'

export interface ExerciseOptionItem {
  id: string
  text: string
}

export interface MatchPairsOptions {
  left: ExerciseOptionItem[]
  right: ExerciseOptionItem[]
}

export interface MatchPair {
  left_id: string
  right_id: string
}

/** Submitted answer shapes keyed by exercise type. */
export interface AnswerByType {
  multiple_choice: { option_id: string }
  translate_word_bank: { ordered_ids: string[] }
  match_pairs: { pairs: MatchPair[] }
  fill_blank: { text: string }
  type_answer: { text: string }
}

/** Stored / revealed correct-answer shapes keyed by exercise type. */
export interface CorrectAnswerByType {
  multiple_choice: { option_id: string }
  translate_word_bank: { ordered_ids: string[] }
  match_pairs: { pairs: MatchPair[] }
  fill_blank: { text: string }
  type_answer: { accepted: string[] }
}

export type SubmittedAnswer = AnswerByType[ExerciseType]
export type CorrectAnswer = CorrectAnswerByType[ExerciseType]

/** Type-safe mapping from exercise type to its submitted answer shape. */
export type AnswerFor<T extends ExerciseType> = AnswerByType[T]
export type CorrectAnswerFor<T extends ExerciseType> = CorrectAnswerByType[T]

interface PublicExerciseBase {
  id: number
  position: number
  prompt: string
  audio_url: string | null
  tts_text: string | null
  tts_lang: string | null
  metadata: Record<string, unknown> | null
}

export interface MultipleChoiceExercise extends PublicExerciseBase {
  type: 'multiple_choice'
  options: ExerciseOptionItem[]
}

export interface TranslateWordBankExercise extends PublicExerciseBase {
  type: 'translate_word_bank'
  options: ExerciseOptionItem[]
}

export interface MatchPairsExercise extends PublicExerciseBase {
  type: 'match_pairs'
  options: MatchPairsOptions
}

export interface FillBlankExercise extends PublicExerciseBase {
  type: 'fill_blank'
  options: null
}

export interface TypeAnswerExercise extends PublicExerciseBase {
  type: 'type_answer'
  options: null
}

/**
 * Public exercise union — never includes correct_answer.
 * Used by start/retrieve/resume lesson payloads.
 */
export type PublicExercise =
  | MultipleChoiceExercise
  | TranslateWordBankExercise
  | MatchPairsExercise
  | FillBlankExercise
  | TypeAnswerExercise

/** Payload for POST /api/lessons/{attempt_id}/answer */
export interface AnswerSubmitRequest<T extends ExerciseType = ExerciseType> {
  exercise_id: number
  position: number
  answer: AnswerFor<T>
}

/**
 * Assert a compile-time mapping from each exercise type to its answer shape.
 * Used by type-level tests; no runtime effect.
 */
export type ExerciseAnswerMappingAssert = {
  [K in ExerciseType]: AnswerFor<K>
}
