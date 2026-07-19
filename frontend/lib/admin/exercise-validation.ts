/**
 * Client-side usability validation for admin exercise forms.
 * Backend remains authoritative for contract acceptance.
 */

import {
  isCompleteTtsPair,
  isValidTtsLang,
  isValidTtsText,
} from '@/lib/audio/speech-config'
import type { ExerciseFormState } from '@/lib/admin/exercise-form-state'
import { parseMetadataJson } from '@/lib/admin/exercise-form-state'

export interface FieldError {
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: FieldError[]
}

function push(errors: FieldError[], field: string, message: string): void {
  errors.push({ field, message })
}

export function validateExerciseForm(form: ExerciseFormState): ValidationResult {
  const errors: FieldError[] = []

  if (!form.prompt.trim()) {
    push(errors, 'prompt', 'Prompt is required.')
  }

  if (!Number.isInteger(form.order_index) || form.order_index < 0) {
    push(errors, 'order_index', 'Order index must be an integer ≥ 0.')
  }

  const meta = parseMetadataJson(form.metadata_json)
  if (!meta.ok) {
    push(errors, 'metadata', meta.error)
  }

  const ttsText = form.tts_text
  const ttsLang = form.tts_lang
  const textPresent = ttsText !== null && ttsText.trim().length > 0
  const langPresent = ttsLang !== null && ttsLang.trim().length > 0

  if (textPresent || langPresent) {
    if (!textPresent || !langPresent) {
      push(
        errors,
        'tts',
        'TTS text and language must both be provided or both left empty.',
      )
    } else if (!isValidTtsText(ttsText)) {
      push(errors, 'tts_text', 'TTS text cannot be blank.')
    } else if (!isValidTtsLang(ttsLang)) {
      push(errors, 'tts_lang', 'TTS language must be a valid BCP 47 tag.')
    } else if (!isCompleteTtsPair(ttsText, ttsLang)) {
      push(errors, 'tts', 'TTS fields are incomplete.')
    }
  } else if (ttsText !== null || ttsLang !== null) {
    // One or both are empty strings / whitespace-only after trim path above
    if (
      (ttsText !== null && ttsText.trim().length === 0 && langPresent) ||
      (ttsLang !== null && ttsLang.trim().length === 0 && textPresent)
    ) {
      push(
        errors,
        'tts',
        'TTS text and language must both be provided or both left empty.',
      )
    }
  }

  if (form.audio_url !== null && form.audio_url.trim().length > 0) {
    if (/duolingo\.com/i.test(form.audio_url)) {
      push(
        errors,
        'audio_url',
        'Duolingo-hosted audio is not allowed. Use original or licensed audio only.',
      )
    }
  }

  switch (form.type) {
    case 'multiple_choice': {
      if (form.options.length < 2) {
        push(errors, 'options', 'Multiple choice needs at least two options.')
      }
      const ids = new Set<string>()
      form.options.forEach((opt, index) => {
        if (!opt.id.trim()) {
          push(errors, `options.${index}.id`, `Option ${index + 1} needs an ID.`)
        } else if (ids.has(opt.id)) {
          push(errors, `options.${index}.id`, 'Option IDs must be unique.')
        } else {
          ids.add(opt.id)
        }
        if (!opt.text.trim()) {
          push(
            errors,
            `options.${index}.text`,
            `Option ${index + 1} text is required.`,
          )
        }
      })
      if (
        form.correct_answer.option_id &&
        !ids.has(form.correct_answer.option_id)
      ) {
        push(
          errors,
          'correct_answer',
          'Correct answer references a missing option.',
        )
      }
      if (!form.correct_answer.option_id) {
        push(errors, 'correct_answer', 'Select a correct option.')
      }
      break
    }
    case 'translate_word_bank': {
      if (form.options.length < 2) {
        push(errors, 'options', 'Word bank needs at least two tiles.')
      }
      const ids = new Set<string>()
      form.options.forEach((opt, index) => {
        if (!opt.id.trim()) {
          push(errors, `options.${index}.id`, `Tile ${index + 1} needs an ID.`)
        } else if (ids.has(opt.id)) {
          push(errors, `options.${index}.id`, 'Tile IDs must be unique.')
        } else {
          ids.add(opt.id)
        }
        if (!opt.text.trim()) {
          push(
            errors,
            `options.${index}.text`,
            `Tile ${index + 1} text is required.`,
          )
        }
      })
      if (form.correct_answer.ordered_ids.length < 1) {
        push(errors, 'correct_answer', 'Add at least one ID to the sequence.')
      }
      const seen = new Set<string>()
      form.correct_answer.ordered_ids.forEach((id, index) => {
        if (!ids.has(id)) {
          push(
            errors,
            `correct_answer.${index}`,
            `Sequence entry references missing tile “${id}”.`,
          )
        }
        if (seen.has(id)) {
          push(
            errors,
            `correct_answer.${index}`,
            'Sequence IDs must not repeat.',
          )
        }
        seen.add(id)
      })
      break
    }
    case 'match_pairs': {
      if (form.options.left.length < 2 || form.options.right.length < 2) {
        push(errors, 'options', 'Match pairs needs at least two left and right items.')
      }
      const leftIds = new Set<string>()
      const rightIds = new Set<string>()
      form.options.left.forEach((opt, index) => {
        if (!opt.id.trim() || !opt.text.trim()) {
          push(errors, `left.${index}`, `Left item ${index + 1} needs ID and text.`)
        }
        if (leftIds.has(opt.id)) {
          push(errors, `left.${index}`, 'Left IDs must be unique.')
        }
        leftIds.add(opt.id)
      })
      form.options.right.forEach((opt, index) => {
        if (!opt.id.trim() || !opt.text.trim()) {
          push(
            errors,
            `right.${index}`,
            `Right item ${index + 1} needs ID and text.`,
          )
        }
        if (rightIds.has(opt.id)) {
          push(errors, `right.${index}`, 'Right IDs must be unique.')
        }
        rightIds.add(opt.id)
      })
      if (form.correct_answer.pairs.length !== form.options.left.length) {
        push(
          errors,
          'correct_answer',
          'Every left item must be paired exactly once.',
        )
      }
      const usedLeft = new Set<string>()
      const usedRight = new Set<string>()
      form.correct_answer.pairs.forEach((pair, index) => {
        if (!leftIds.has(pair.left_id)) {
          push(
            errors,
            `pairs.${index}`,
            `Pair references missing left “${pair.left_id}”.`,
          )
        }
        if (!rightIds.has(pair.right_id)) {
          push(
            errors,
            `pairs.${index}`,
            `Pair references missing right “${pair.right_id}”.`,
          )
        }
        if (usedLeft.has(pair.left_id)) {
          push(errors, `pairs.${index}`, 'Each left ID can only be used once.')
        }
        if (usedRight.has(pair.right_id)) {
          push(errors, `pairs.${index}`, 'Each right ID can only be used once.')
        }
        usedLeft.add(pair.left_id)
        usedRight.add(pair.right_id)
      })
      break
    }
    case 'fill_blank': {
      const blanks = (form.prompt.match(/___/g) ?? []).length
      if (blanks !== 1) {
        push(
          errors,
          'prompt',
          'Fill-blank prompt must contain exactly one ___ marker.',
        )
      }
      if (!form.correct_answer.text.trim()) {
        push(errors, 'correct_answer', 'Correct answer text is required.')
      }
      break
    }
    case 'type_answer': {
      const accepted = form.correct_answer.accepted
      if (accepted.length < 1) {
        push(errors, 'correct_answer', 'Add at least one accepted answer.')
      }
      const normalized = new Set<string>()
      accepted.forEach((value, index) => {
        if (!value.trim()) {
          push(
            errors,
            `accepted.${index}`,
            `Accepted answer ${index + 1} cannot be blank.`,
          )
        } else {
          const key = value.trim().toLowerCase()
          if (normalized.has(key)) {
            push(
              errors,
              `accepted.${index}`,
              'Accepted answers must be unique when normalized.',
            )
          }
          normalized.add(key)
        }
      })
      break
    }
  }

  return { valid: errors.length === 0, errors }
}
