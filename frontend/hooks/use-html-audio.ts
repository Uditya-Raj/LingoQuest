'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type HtmlAudioStatus = 'idle' | 'speaking' | 'replayable' | 'error'

export interface UseHtmlAudioOptions {
  token: string | number
  url: string
  enabled?: boolean
}

export interface UseHtmlAudioResult {
  status: HtmlAudioStatus
  errorMessage: string | null
  play: () => void
  cancel: () => void
}

/**
 * HTMLAudioElement Play/Replay for original/licensed audio_url.
 * Never autoplays. Pauses and clears on token change / unmount.
 */
export function useHtmlAudio({
  token,
  url,
  enabled = true,
}: UseHtmlAudioOptions): UseHtmlAudioResult {
  const [status, setStatus] = useState<HtmlAudioStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const generationRef = useRef(0)
  const finishedRef = useRef(false)

  const disposeElement = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
    audioRef.current = null
  }, [])

  const cancel = useCallback(() => {
    generationRef.current += 1
    disposeElement()
    setStatus(finishedRef.current ? 'replayable' : 'idle')
  }, [disposeElement])

  useEffect(() => {
    generationRef.current += 1
    finishedRef.current = false
    disposeElement()
    setErrorMessage(null)
    setStatus('idle')

    return () => {
      generationRef.current += 1
      disposeElement()
    }
  }, [token, url, disposeElement])

  const play = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return

    const generation = ++generationRef.current
    disposeElement()

    const audio = new Audio(url)
    audio.preload = 'auto'
    audioRef.current = audio

    audio.onplaying = () => {
      if (generation !== generationRef.current) return
      setStatus('speaking')
      setErrorMessage(null)
    }

    audio.onended = () => {
      if (generation !== generationRef.current) return
      finishedRef.current = true
      setStatus('replayable')
      audioRef.current = null
    }

    audio.onerror = () => {
      if (generation !== generationRef.current) return
      audioRef.current = null
      setStatus('error')
      setErrorMessage('Audio could not be played. You can still answer the exercise.')
    }

    setStatus('speaking')
    setErrorMessage(null)

    void audio.play().catch(() => {
      if (generation !== generationRef.current) return
      audioRef.current = null
      setStatus('error')
      setErrorMessage('Audio could not be played. You can still answer the exercise.')
    })
  }, [disposeElement, enabled, url])

  return {
    status,
    errorMessage,
    play,
    cancel,
  }
}
