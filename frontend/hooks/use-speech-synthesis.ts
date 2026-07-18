'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  SPEECH_PITCH,
  SPEECH_RATE,
  SPEECH_VOLUME,
} from '@/lib/audio/speech-config'
import {
  getSpeechSynthesis,
  isSpeechSynthesisSupported,
} from '@/lib/audio/support'
import { selectVoice } from '@/lib/audio/voice-selection'

export type SpeechPlaybackStatus =
  | 'unsupported'
  | 'idle'
  | 'speaking'
  | 'replayable'
  | 'error'

export interface UseSpeechSynthesisOptions {
  /** Opaque token — changes cancel prior speech and ignore stale callbacks. */
  token: string | number
  text: string
  lang: string
  enabled?: boolean
}

export interface UseSpeechSynthesisResult {
  status: SpeechPlaybackStatus
  errorMessage: string | null
  play: () => void
  cancel: () => void
  supported: boolean
}

/**
 * Browser Speech Synthesis controller for one exercise utterance.
 * No Zustand/localStorage. Safe for SSR (support detected after mount).
 */
export function useSpeechSynthesis({
  token,
  text,
  lang,
  enabled = true,
}: UseSpeechSynthesisOptions): UseSpeechSynthesisResult {
  const [supported, setSupported] = useState(false)
  const [status, setStatus] = useState<SpeechPlaybackStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const generationRef = useRef(0)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])
  const finishedRef = useRef(false)

  const cancelInternal = useCallback((markIdle: boolean) => {
    const synth = getSpeechSynthesis()
    if (synth) {
      synth.cancel()
    }
    utteranceRef.current = null
    if (markIdle) {
      setStatus((current) =>
        current === 'unsupported' || current === 'error'
          ? current
          : finishedRef.current
            ? 'replayable'
            : 'idle',
      )
    }
  }, [])

  const cancel = useCallback(() => {
    generationRef.current += 1
    cancelInternal(true)
  }, [cancelInternal])

  useEffect(() => {
    const ok = enabled && isSpeechSynthesisSupported()
    setSupported(ok)
    if (!ok) {
      setStatus('unsupported')
      return
    }
    setStatus('idle')
    setErrorMessage(null)
    finishedRef.current = false
  }, [enabled])

  useEffect(() => {
    if (!supported) return

    const synth = getSpeechSynthesis()
    if (!synth) return

    const syncVoices = () => {
      voicesRef.current = synth.getVoices()
    }
    syncVoices()

    const onVoicesChanged = () => {
      syncVoices()
    }

    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', onVoicesChanged)
      return () => {
        synth.removeEventListener('voiceschanged', onVoicesChanged)
      }
    }

    // Legacy path used by some engines
    const legacy = synth as SpeechSynthesis & {
      onvoiceschanged: (() => void) | null
    }
    legacy.onvoiceschanged = onVoicesChanged
    return () => {
      if (legacy.onvoiceschanged === onVoicesChanged) {
        legacy.onvoiceschanged = null
      }
    }
  }, [supported])

  // Cancel when exercise/token changes or unmounts
  useEffect(() => {
    generationRef.current += 1
    finishedRef.current = false
    setErrorMessage(null)
    if (supported) {
      setStatus('idle')
    }
    const synth = getSpeechSynthesis()
    synth?.cancel()
    utteranceRef.current = null

    return () => {
      generationRef.current += 1
      synth?.cancel()
      utteranceRef.current = null
    }
  }, [token, text, lang, supported])

  const play = useCallback(() => {
    if (!supported || !enabled) return

    const synth = getSpeechSynthesis()
    if (!synth) {
      setStatus('unsupported')
      return
    }

    const generation = ++generationRef.current
    synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = SPEECH_RATE
    utterance.pitch = SPEECH_PITCH
    utterance.volume = SPEECH_VOLUME

    const voice = selectVoice(voicesRef.current, lang)
    if (voice) {
      utterance.voice = voice
    }

    utterance.onstart = () => {
      if (generation !== generationRef.current) return
      setStatus('speaking')
      setErrorMessage(null)
    }

    utterance.onend = () => {
      if (generation !== generationRef.current) return
      utteranceRef.current = null
      finishedRef.current = true
      setStatus('replayable')
    }

    utterance.onerror = () => {
      if (generation !== generationRef.current) return
      utteranceRef.current = null
      setStatus('error')
      setErrorMessage('Audio could not be played. You can still answer the exercise.')
    }

    utteranceRef.current = utterance
    setStatus('speaking')
    setErrorMessage(null)

    try {
      synth.speak(utterance)
    } catch {
      if (generation !== generationRef.current) return
      utteranceRef.current = null
      setStatus('error')
      setErrorMessage('Audio could not be played. You can still answer the exercise.')
    }
  }, [enabled, lang, supported, text])

  return {
    status: enabled ? status : 'unsupported',
    errorMessage,
    play,
    cancel,
    supported,
  }
}
