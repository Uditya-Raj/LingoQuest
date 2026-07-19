import { describe, expect, it, beforeEach } from 'vitest'

import {
  buildCreatePayload,
  buildPatchPayload,
  createInitialFormState,
  formStateFromExercise,
  isFormDirty,
} from '@/lib/admin/exercise-form-state'
import { resetOptionIdCounter } from '@/lib/admin/option-id'
import { validateExerciseForm } from '@/lib/admin/exercise-validation'
import {
  mockFillExercise,
  mockMcExercise,
} from '@/tests/fixtures/phase11b'

describe('admin PATCH and create payloads', () => {
  beforeEach(() => {
    resetOptionIdCounter()
  })

  it('builds exact create payloads for all five types', () => {
    const mc = createInitialFormState('multiple_choice', 3, 10)
    mc.prompt = 'MC?'
    mc.options = [
      { id: 'a', text: 'Yes' },
      { id: 'b', text: 'No' },
    ]
    mc.correct_answer = { option_id: 'a' }
    expect(buildCreatePayload(mc)).toMatchObject({
      lesson_id: 3,
      order_index: 10,
      type: 'multiple_choice',
      options: [
        { id: 'a', text: 'Yes' },
        { id: 'b', text: 'No' },
      ],
      correct_answer: { option_id: 'a' },
    })

    const wb = createInitialFormState('translate_word_bank', 3, 11)
    wb.prompt = 'WB'
    wb.options = [
      { id: 'w1', text: 'I' },
      { id: 'w2', text: 'eat' },
    ]
    wb.correct_answer = { ordered_ids: ['w1', 'w2'] }
    expect(buildCreatePayload(wb).correct_answer).toEqual({
      ordered_ids: ['w1', 'w2'],
    })

    const mp = createInitialFormState('match_pairs', 3, 12)
    mp.prompt = 'MP'
    mp.options = {
      left: [
        { id: 'l1', text: 'agua' },
        { id: 'l2', text: 'pan' },
      ],
      right: [
        { id: 'r1', text: 'water' },
        { id: 'r2', text: 'bread' },
      ],
    }
    mp.correct_answer = {
      pairs: [
        { left_id: 'l1', right_id: 'r1' },
        { left_id: 'l2', right_id: 'r2' },
      ],
    }
    expect(buildCreatePayload(mp).correct_answer).toEqual(mp.correct_answer)

    const fb = createInitialFormState('fill_blank', 3, 13)
    fb.prompt = 'Ella ___ ok.'
    fb.correct_answer = { text: 'es' }
    expect(buildCreatePayload(fb)).toMatchObject({
      type: 'fill_blank',
      options: null,
      correct_answer: { text: 'es' },
    })

    const ta = createInitialFormState('type_answer', 3, 14)
    ta.prompt = 'Hello'
    ta.correct_answer = { accepted: ['hola'] }
    expect(buildCreatePayload(ta).correct_answer).toEqual({
      accepted: ['hola'],
    })
  })

  it('omits unchanged fields and sends explicit null for cleared audio', () => {
    const withAudio = {
      ...mockMcExercise,
      audio_url: 'https://cdn.example.test/hola.mp3',
    }
    const form = formStateFromExercise(withAudio)
    expect(buildPatchPayload(withAudio, form)).toEqual({})

    form.prompt = 'Hola!'
    form.audio_url = null
    const patch = buildPatchPayload(withAudio, form)
    expect(patch).toEqual({
      prompt: 'Hola!',
      audio_url: null,
    })
    expect('tts_text' in patch).toBe(false)
    expect('correct_answer' in patch).toBe(false)
  })

  it('detects dirty state and preserves metadata omit vs replace', () => {
    const form = formStateFromExercise(mockFillExercise)
    expect(isFormDirty(mockFillExercise, form, 'edit')).toBe(false)
    form.prompt = 'Ella ___ mi hermana.'
    expect(isFormDirty(mockFillExercise, form, 'edit')).toBe(true)

    form.metadata_json = '{"hint":"ser"}'
    const patch = buildPatchPayload(mockFillExercise, form)
    expect(patch.metadata).toEqual({ hint: 'ser' })
  })

  it('rejects partial TTS and dangling MC references', () => {
    const form = formStateFromExercise(mockMcExercise)
    form.tts_text = 'hola'
    form.tts_lang = null
    expect(validateExerciseForm(form).valid).toBe(false)

    form.tts_text = null
    form.tts_lang = null
    form.correct_answer = { option_id: 'missing' }
    const result = validateExerciseForm(form)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.field === 'correct_answer')).toBe(true)
  })

  it('allows duplicate visible words with distinct IDs', () => {
    const form = createInitialFormState('translate_word_bank', 3, 1)
    form.prompt = 'Duplicate words'
    form.options = [
      { id: 'w1', text: 'the' },
      { id: 'w2', text: 'the' },
    ]
    form.correct_answer = { ordered_ids: ['w1', 'w2'] }
    expect(validateExerciseForm(form).valid).toBe(true)
    expect(buildCreatePayload(form).options).toEqual(form.options)
  })
})
