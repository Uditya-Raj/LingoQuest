/**
 * Discriminated exercise form state for content administration.
 * Impossible type/answer combinations are not representable.
 */

import type {
  AdminExerciseCreateRequest,
  AdminExerciseRepresentation,
} from '@/lib/contracts/admin'
import type {
  CorrectAnswerFor,
  ExerciseOptionItem,
  ExerciseType,
  MatchPair,
  MatchPairsOptions,
} from '@/lib/contracts/exercises'
import { createOptionId } from '@/lib/admin/option-id'

export type AdminSelection =
  | { kind: 'none' }
  | { kind: 'course'; courseId: number }
  | { kind: 'unit'; courseId: number; unitId: number }
  | { kind: 'skill'; courseId: number; unitId: number; skillId: number }
  | {
      kind: 'lesson'
      courseId: number
      unitId: number
      skillId: number
      lessonId: number
    }
  | {
      kind: 'exercise'
      courseId: number
      unitId: number
      skillId: number
      lessonId: number
      exerciseId: number
    }
  | {
      kind: 'create'
      courseId: number
      unitId: number
      skillId: number
      lessonId: number
    }

export interface SharedExerciseFields {
  prompt: string
  order_index: number
  audio_url: string | null
  tts_text: string | null
  tts_lang: string | null
  /** Raw metadata JSON text for the advanced editor; empty means null. */
  metadata_json: string
  is_active: boolean
  lesson_id: number
}

export type ExerciseFormState =
  | (SharedExerciseFields & {
      type: 'multiple_choice'
      options: ExerciseOptionItem[]
      correct_answer: CorrectAnswerFor<'multiple_choice'>
    })
  | (SharedExerciseFields & {
      type: 'translate_word_bank'
      options: ExerciseOptionItem[]
      correct_answer: CorrectAnswerFor<'translate_word_bank'>
    })
  | (SharedExerciseFields & {
      type: 'match_pairs'
      options: MatchPairsOptions
      correct_answer: CorrectAnswerFor<'match_pairs'>
    })
  | (SharedExerciseFields & {
      type: 'fill_blank'
      options: null
      correct_answer: CorrectAnswerFor<'fill_blank'>
    })
  | (SharedExerciseFields & {
      type: 'type_answer'
      options: null
      correct_answer: CorrectAnswerFor<'type_answer'>
    })

const EMPTY_SHARED = (
  lessonId: number,
  orderIndex: number,
): SharedExerciseFields => ({
  prompt: '',
  order_index: orderIndex,
  audio_url: null,
  tts_text: null,
  tts_lang: null,
  metadata_json: '',
  is_active: true,
  lesson_id: lessonId,
})

function metadataToJson(metadata: Record<string, unknown> | null): string {
  if (metadata === null || metadata === undefined) return ''
  return JSON.stringify(metadata, null, 2)
}

export function createInitialFormState(
  type: ExerciseType,
  lessonId: number,
  orderIndex: number,
): ExerciseFormState {
  const shared = EMPTY_SHARED(lessonId, orderIndex)

  switch (type) {
    case 'multiple_choice': {
      const a = createOptionId('mc')
      const b = createOptionId('mc')
      return {
        ...shared,
        type,
        options: [
          { id: a, text: '' },
          { id: b, text: '' },
        ],
        correct_answer: { option_id: a },
      }
    }
    case 'translate_word_bank': {
      const w1 = createOptionId('wb')
      const w2 = createOptionId('wb')
      return {
        ...shared,
        type,
        options: [
          { id: w1, text: '' },
          { id: w2, text: '' },
        ],
        correct_answer: { ordered_ids: [w1] },
      }
    }
    case 'match_pairs': {
      const l1 = createOptionId('left')
      const l2 = createOptionId('left')
      const r1 = createOptionId('right')
      const r2 = createOptionId('right')
      return {
        ...shared,
        type,
        options: {
          left: [
            { id: l1, text: '' },
            { id: l2, text: '' },
          ],
          right: [
            { id: r1, text: '' },
            { id: r2, text: '' },
          ],
        },
        correct_answer: {
          pairs: [
            { left_id: l1, right_id: r1 },
            { left_id: l2, right_id: r2 },
          ],
        },
      }
    }
    case 'fill_blank':
      return {
        ...shared,
        type,
        prompt: '___',
        options: null,
        correct_answer: { text: '' },
      }
    case 'type_answer':
      return {
        ...shared,
        type,
        options: null,
        correct_answer: { accepted: [''] },
      }
  }
}

export function formStateFromExercise(
  exercise: AdminExerciseRepresentation,
): ExerciseFormState {
  const shared: SharedExerciseFields = {
    prompt: exercise.prompt,
    order_index: exercise.order_index,
    audio_url: exercise.audio_url,
    tts_text: exercise.tts_text,
    tts_lang: exercise.tts_lang,
    metadata_json: metadataToJson(exercise.metadata),
    is_active: exercise.is_active,
    lesson_id: exercise.lesson_id,
  }

  switch (exercise.type) {
    case 'multiple_choice': {
      const options = Array.isArray(exercise.options)
        ? exercise.options.map((o) => ({ id: o.id, text: o.text }))
        : []
      const optionId =
        'option_id' in exercise.correct_answer
          ? exercise.correct_answer.option_id
          : ''
      return {
        ...shared,
        type: 'multiple_choice',
        options,
        correct_answer: { option_id: optionId },
      }
    }
    case 'translate_word_bank': {
      const options = Array.isArray(exercise.options)
        ? exercise.options.map((o) => ({ id: o.id, text: o.text }))
        : []
      const ordered =
        'ordered_ids' in exercise.correct_answer
          ? [...exercise.correct_answer.ordered_ids]
          : []
      return {
        ...shared,
        type: 'translate_word_bank',
        options,
        correct_answer: { ordered_ids: ordered },
      }
    }
    case 'match_pairs': {
      const opts =
        exercise.options !== null &&
        typeof exercise.options === 'object' &&
        !Array.isArray(exercise.options)
          ? exercise.options
          : { left: [], right: [] }
      const pairs =
        'pairs' in exercise.correct_answer
          ? exercise.correct_answer.pairs.map(
              (p: MatchPair): MatchPair => ({
                left_id: p.left_id,
                right_id: p.right_id,
              }),
            )
          : []
      return {
        ...shared,
        type: 'match_pairs',
        options: {
          left: opts.left.map((o) => ({ id: o.id, text: o.text })),
          right: opts.right.map((o) => ({ id: o.id, text: o.text })),
        },
        correct_answer: { pairs },
      }
    }
    case 'fill_blank': {
      const text =
        'text' in exercise.correct_answer ? exercise.correct_answer.text : ''
      return {
        ...shared,
        type: 'fill_blank',
        options: null,
        correct_answer: { text },
      }
    }
    case 'type_answer': {
      const accepted =
        'accepted' in exercise.correct_answer
          ? [...exercise.correct_answer.accepted]
          : ['']
      return {
        ...shared,
        type: 'type_answer',
        options: null,
        correct_answer: { accepted },
      }
    }
  }
}

export function parseMetadataJson(
  raw: string,
):
  | { ok: true; value: Record<string, unknown> | null }
  | { ok: false; error: string } {
  const trimmed = raw.trim()
  if (trimmed.length === 0) {
    return { ok: true, value: null }
  }
  try {
    const parsed: unknown = JSON.parse(trimmed)
    if (parsed === null) {
      return { ok: true, value: null }
    }
    if (
      typeof parsed !== 'object' ||
      Array.isArray(parsed) ||
      parsed === null
    ) {
      return { ok: false, error: 'Metadata must be a JSON object or empty.' }
    }
    return { ok: true, value: parsed as Record<string, unknown> }
  } catch {
    return { ok: false, error: 'Metadata is not valid JSON.' }
  }
}

function normalizeAudioUrl(value: string | null): string | null {
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function normalizeTts(value: string | null): string | null {
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

/**
 * Build a create request from form state. Throws if metadata JSON is invalid.
 */
export function buildCreatePayload(
  form: ExerciseFormState,
): AdminExerciseCreateRequest {
  const meta = parseMetadataJson(form.metadata_json)
  if (!meta.ok) {
    throw new Error(meta.error)
  }

  const ttsText = normalizeTts(form.tts_text)
  const ttsLang = normalizeTts(form.tts_lang)

  const base = {
    lesson_id: form.lesson_id,
    order_index: form.order_index,
    type: form.type,
    prompt: form.prompt,
    audio_url: normalizeAudioUrl(form.audio_url),
    tts_text: ttsText,
    tts_lang: ttsLang,
    metadata: meta.value,
    is_active: form.is_active,
  }

  switch (form.type) {
    case 'multiple_choice':
      return {
        ...base,
        type: 'multiple_choice',
        options: form.options.map((o) => ({ id: o.id, text: o.text })),
        correct_answer: { option_id: form.correct_answer.option_id },
      }
    case 'translate_word_bank':
      return {
        ...base,
        type: 'translate_word_bank',
        options: form.options.map((o) => ({ id: o.id, text: o.text })),
        correct_answer: { ordered_ids: [...form.correct_answer.ordered_ids] },
      }
    case 'match_pairs':
      return {
        ...base,
        type: 'match_pairs',
        options: {
          left: form.options.left.map((o) => ({ id: o.id, text: o.text })),
          right: form.options.right.map((o) => ({ id: o.id, text: o.text })),
        },
        correct_answer: {
          pairs: form.correct_answer.pairs.map((p) => ({
            left_id: p.left_id,
            right_id: p.right_id,
          })),
        },
      }
    case 'fill_blank':
      return {
        ...base,
        type: 'fill_blank',
        options: null,
        correct_answer: { text: form.correct_answer.text },
      }
    case 'type_answer':
      return {
        ...base,
        type: 'type_answer',
        options: null,
        correct_answer: { accepted: [...form.correct_answer.accepted] },
      }
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * Build a merged PATCH payload containing only dirty fields.
 * Omitted fields keep stored values on the backend.
 * Explicit null is sent when the administrator clears a nullable field.
 */
export function buildPatchPayload(
  baseline: AdminExerciseRepresentation,
  form: ExerciseFormState,
): Record<string, unknown> {
  const meta = parseMetadataJson(form.metadata_json)
  if (!meta.ok) {
    throw new Error(meta.error)
  }

  const payload: Record<string, unknown> = {}

  if (form.lesson_id !== baseline.lesson_id) {
    payload.lesson_id = form.lesson_id
  }
  if (form.order_index !== baseline.order_index) {
    payload.order_index = form.order_index
  }
  if (form.type !== baseline.type) {
    payload.type = form.type
  }
  if (form.prompt !== baseline.prompt) {
    payload.prompt = form.prompt
  }

  const nextAudio = normalizeAudioUrl(form.audio_url)
  if (nextAudio !== baseline.audio_url) {
    payload.audio_url = nextAudio
  }

  const nextTtsText = normalizeTts(form.tts_text)
  const nextTtsLang = normalizeTts(form.tts_lang)
  if (nextTtsText !== baseline.tts_text) {
    payload.tts_text = nextTtsText
  }
  if (nextTtsLang !== baseline.tts_lang) {
    payload.tts_lang = nextTtsLang
  }

  if (form.is_active !== baseline.is_active) {
    payload.is_active = form.is_active
  }

  if (!deepEqual(meta.value, baseline.metadata ?? null)) {
    payload.metadata = meta.value
  }

  const createShape = buildCreatePayload(form)
  if (!deepEqual(createShape.options ?? null, baseline.options ?? null)) {
    payload.options = createShape.options ?? null
  }
  if (!deepEqual(createShape.correct_answer, baseline.correct_answer)) {
    payload.correct_answer = createShape.correct_answer
  }

  return payload
}

export function isFormDirty(
  baseline: AdminExerciseRepresentation | null,
  form: ExerciseFormState | null,
  mode: 'edit' | 'create',
): boolean {
  if (form === null) return false
  if (mode === 'create') return true
  if (baseline === null) return false
  try {
    return Object.keys(buildPatchPayload(baseline, form)).length > 0
  } catch {
    // Invalid metadata JSON still counts as dirty vs baseline.
    return true
  }
}

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  multiple_choice: 'Multiple choice',
  translate_word_bank: 'Word bank',
  match_pairs: 'Match pairs',
  fill_blank: 'Fill blank',
  type_answer: 'Type answer',
}

export const EXERCISE_TYPES: ExerciseType[] = [
  'multiple_choice',
  'translate_word_bank',
  'match_pairs',
  'fill_blank',
  'type_answer',
]
