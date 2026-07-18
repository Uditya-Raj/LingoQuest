import {
  asCompleteTtsPair,
  isPlayableAudioUrl,
} from '@/lib/audio/speech-config'

export type ExerciseAudioSource =
  | { kind: 'audio_url'; url: string }
  | { kind: 'tts'; text: string; lang: string }
  | { kind: 'none' }

/**
 * Prefer original/licensed audio_url over TTS when both are valid.
 * Never invent TTS text from the prompt.
 */
export function resolveExerciseAudioSource(input: {
  audioUrl: string | null | undefined
  ttsText: string | null | undefined
  ttsLang: string | null | undefined
}): ExerciseAudioSource {
  if (isPlayableAudioUrl(input.audioUrl)) {
    return { kind: 'audio_url', url: input.audioUrl.trim() }
  }

  const tts = asCompleteTtsPair(input.ttsText, input.ttsLang)
  if (tts) {
    return { kind: 'tts', text: tts.text, lang: tts.lang }
  }

  return { kind: 'none' }
}

export function hasExerciseAudioSource(input: {
  audioUrl: string | null | undefined
  ttsText: string | null | undefined
  ttsLang: string | null | undefined
}): boolean {
  return resolveExerciseAudioSource(input).kind !== 'none'
}
