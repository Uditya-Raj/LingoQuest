'use client'

import { useEffect, useMemo, useSyncExternalStore } from 'react'

import { registerLessonAudioCancel } from '@/lib/audio/lesson-audio-controller'
import {
  resolveExerciseAudioSource,
  type ExerciseAudioSource,
} from '@/lib/audio/resolve-audio-source'
import { isSpeechSynthesisSupported } from '@/lib/audio/support'
import {
  useHtmlAudio,
  type HtmlAudioStatus,
} from '@/hooks/use-html-audio'
import {
  useSpeechSynthesis,
  type SpeechPlaybackStatus,
} from '@/hooks/use-speech-synthesis'

export type ExerciseAudioUiStatus =
  | 'hidden'
  | 'pending'
  | 'unsupported'
  | 'idle'
  | 'speaking'
  | 'replayable'
  | 'error'

export interface UseExerciseAudioOptions {
  exerciseId: number
  audioUrl: string | null | undefined
  ttsText: string | null | undefined
  ttsLang: string | null | undefined
}

export interface UseExerciseAudioResult {
  source: ExerciseAudioSource
  status: ExerciseAudioUiStatus
  errorMessage: string | null
  play: () => void
  cancel: () => void
  languageCode: string | null
}

function subscribeNoop() {
  return () => {}
}

/** Client-only flag; SSR always false to avoid hydration mismatch. */
function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )
}

function mapSpeechStatus(
  status: SpeechPlaybackStatus,
  source: ExerciseAudioSource,
): ExerciseAudioUiStatus {
  if (source.kind === 'none') return 'hidden'
  return status
}

function mapHtmlStatus(
  status: HtmlAudioStatus,
  source: ExerciseAudioSource,
): ExerciseAudioUiStatus {
  if (source.kind === 'none') return 'hidden'
  return status
}

/**
 * Unified exercise audio: prefer audio_url, else TTS pair.
 * Returns hidden when no valid source exists.
 */
export function useExerciseAudio({
  exerciseId,
  audioUrl,
  ttsText,
  ttsLang,
}: UseExerciseAudioOptions): UseExerciseAudioResult {
  const isClient = useIsClient()

  const source = useMemo(
    () => resolveExerciseAudioSource({ audioUrl, ttsText, ttsLang }),
    [audioUrl, ttsText, ttsLang],
  )

  const ttsEnabled = source.kind === 'tts'
  const urlEnabled = source.kind === 'audio_url'

  const speech = useSpeechSynthesis({
    token: exerciseId,
    text: source.kind === 'tts' ? source.text : '',
    lang: source.kind === 'tts' ? source.lang : 'en',
    enabled: ttsEnabled,
  })

  const html = useHtmlAudio({
    token: exerciseId,
    url: source.kind === 'audio_url' ? source.url : '',
    enabled: urlEnabled,
  })

  const cancel =
    source.kind === 'audio_url'
      ? html.cancel
      : source.kind === 'tts'
        ? speech.cancel
        : () => {}

  useEffect(() => {
    if (source.kind === 'none') return
    return registerLessonAudioCancel(cancel)
  }, [cancel, source.kind])

  if (source.kind === 'none') {
    return {
      source,
      status: 'hidden',
      errorMessage: null,
      play: () => {},
      cancel: () => {},
      languageCode: null,
    }
  }

  if (source.kind === 'audio_url') {
    return {
      source,
      status: mapHtmlStatus(html.status, source),
      errorMessage: html.errorMessage,
      play: html.play,
      cancel: html.cancel,
      languageCode: null,
    }
  }

  // TTS path — before hydration, do not claim support (avoid SSR mismatch).
  if (!isClient) {
    return {
      source,
      status: 'pending',
      errorMessage: null,
      play: () => {},
      cancel: speech.cancel,
      languageCode: source.lang,
    }
  }

  if (!isSpeechSynthesisSupported()) {
    return {
      source,
      status: 'unsupported',
      errorMessage: null,
      play: () => {},
      cancel: speech.cancel,
      languageCode: source.lang,
    }
  }

  return {
    source,
    status: mapSpeechStatus(speech.status, source),
    errorMessage: speech.errorMessage,
    play: speech.play,
    cancel: speech.cancel,
    languageCode: source.lang,
  }
}
