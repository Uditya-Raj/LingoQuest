import { describe, expect, it } from 'vitest'

import { resolveExerciseAudioSource } from '@/lib/audio/resolve-audio-source'
import {
  isCompleteTtsPair,
  isPlayableAudioUrl,
} from '@/lib/audio/speech-config'
import { selectVoice } from '@/lib/audio/voice-selection'
import { createMockVoice } from '@/tests/helpers/mock-speech-synthesis'

describe('resolveExerciseAudioSource', () => {
  it('prefers audio_url over TTS when both are valid', () => {
    const source = resolveExerciseAudioSource({
      audioUrl: 'https://cdn.example.com/hola.mp3',
      ttsText: 'hola',
      ttsLang: 'es-ES',
    })
    expect(source).toEqual({
      kind: 'audio_url',
      url: 'https://cdn.example.com/hola.mp3',
    })
  })

  it('uses TTS when the pair is complete and audio_url is absent', () => {
    expect(
      resolveExerciseAudioSource({
        audioUrl: null,
        ttsText: 'hola',
        ttsLang: 'es-ES',
      }),
    ).toEqual({ kind: 'tts', text: 'hola', lang: 'es-ES' })
  })

  it('hides control for partial or invalid TTS data', () => {
    expect(
      resolveExerciseAudioSource({
        audioUrl: null,
        ttsText: 'hola',
        ttsLang: null,
      }).kind,
    ).toBe('none')
    expect(
      resolveExerciseAudioSource({
        audioUrl: null,
        ttsText: '   ',
        ttsLang: 'es-ES',
      }).kind,
    ).toBe('none')
    expect(
      resolveExerciseAudioSource({
        audioUrl: null,
        ttsText: 'hola',
        ttsLang: '!!',
      }).kind,
    ).toBe('none')
  })

  it('rejects Duolingo-hosted audio URLs', () => {
    expect(isPlayableAudioUrl('https://duolingo.com/audio/hola.mp3')).toBe(
      false,
    )
    expect(isCompleteTtsPair('hola', 'es-ES')).toBe(true)
  })
})

describe('selectVoice', () => {
  it('prefers exact language, then base language, then default null', () => {
    const voices = [
      createMockVoice('en-US'),
      createMockVoice('es-MX'),
      createMockVoice('es-ES', 'Exact Spanish'),
    ] as unknown as SpeechSynthesisVoice[]

    expect(selectVoice(voices, 'es-ES')?.name).toBe('Exact Spanish')
    expect(selectVoice(voices.filter((v) => v.lang !== 'es-ES'), 'es-ES')?.lang).toBe(
      'es-MX',
    )
    expect(selectVoice([createMockVoice('en-US')] as unknown as SpeechSynthesisVoice[], 'es-ES')).toBeNull()
  })
})
