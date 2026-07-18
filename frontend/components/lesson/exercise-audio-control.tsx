'use client'

import { Volume2, VolumeX } from 'lucide-react'

import { IconButton3D } from '@/components/ui/icon-button-3d'
import { useExerciseAudio } from '@/hooks/use-exercise-audio'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { languageDisplayName } from '@/lib/audio/speech-config'
import { cn } from '@/lib/utils'

export interface ExerciseAudioControlProps {
  exerciseId: number
  audioUrl: string | null | undefined
  ttsText: string | null | undefined
  ttsLang: string | null | undefined
  className?: string
}

function accessibleActionLabel(
  status: 'idle' | 'speaking' | 'replayable' | 'error',
  languageCode: string | null,
): string {
  const language = languageCode
    ? languageDisplayName(languageCode)
    : 'exercise'
  if (status === 'replayable' || status === 'speaking') {
    return `Replay ${language} pronunciation`
  }
  return `Play ${language} pronunciation`
}

/**
 * Accessible Play/Replay control for exercise TTS or audio_url.
 * Renders nothing when the exercise has no valid audio source.
 */
export function ExerciseAudioControl({
  exerciseId,
  audioUrl,
  ttsText,
  ttsLang,
  className,
}: ExerciseAudioControlProps) {
  const reducedMotion = useReducedMotion()
  const audio = useExerciseAudio({
    exerciseId,
    audioUrl,
    ttsText,
    ttsLang,
  })

  if (audio.status === 'hidden') {
    return null
  }

  if (audio.status === 'pending') {
    return (
      <div
        className={cn('min-h-11 min-w-11', className)}
        aria-hidden="true"
        data-audio-state="pending"
      />
    )
  }

  if (audio.status === 'unsupported') {
    return (
      <div
        className={cn(
          'inline-flex min-h-11 items-center gap-2 rounded-lq-full border-2 border-lq-border-default bg-lq-bg-surface px-3 text-lq-sm text-lq-text-secondary',
          className,
        )}
        data-audio-state="unsupported"
      >
        <VolumeX className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>Audio unavailable in this browser</span>
      </div>
    )
  }

  const isSpeaking = audio.status === 'speaking'
  const label = accessibleActionLabel(
    audio.status === 'error' ? 'idle' : audio.status,
    audio.languageCode,
  )

  return (
    <div
      className={cn('flex min-w-0 flex-col gap-1', className)}
      data-audio-state={audio.status}
    >
      <div className="flex items-center gap-2">
        <IconButton3D
          type="button"
          size="md"
          active={isSpeaking}
          aria-label={label}
          aria-pressed={isSpeaking || undefined}
          onClick={() => {
            audio.play()
          }}
        >
          <Volume2 aria-hidden="true" />
        </IconButton3D>

        <div className="min-w-0">
          <p className="text-lq-sm font-bold text-lq-text-secondary">
            {isSpeaking
              ? 'Speaking'
              : audio.status === 'replayable'
                ? 'Replay'
                : 'Play'}
          </p>
          {isSpeaking ? (
            <p
              className="text-lq-xs text-lq-text-tertiary"
              aria-live="polite"
            >
              Playing pronunciation
            </p>
          ) : null}
        </div>

        {isSpeaking && !reducedMotion ? (
          <span
            className="ml-1 inline-flex items-end gap-0.5"
            aria-hidden="true"
            data-audio-waves
          >
            <span className="h-2 w-1 animate-pulse rounded-full bg-lq-text-secondary [animation-delay:0ms]" />
            <span className="h-3 w-1 animate-pulse rounded-full bg-lq-text-secondary [animation-delay:120ms]" />
            <span className="h-4 w-1 animate-pulse rounded-full bg-lq-text-secondary [animation-delay:240ms]" />
          </span>
        ) : null}

        {isSpeaking && reducedMotion ? (
          <span
            className="ml-1 rounded-lq px-1.5 py-0.5 text-lq-xs font-bold text-lq-text-secondary ring-1 ring-lq-border-default"
            aria-hidden="true"
          >
            ●
          </span>
        ) : null}
      </div>

      {audio.status === 'error' && audio.errorMessage ? (
        <p className="text-lq-xs text-lq-text-error" role="status" aria-live="polite">
          {audio.errorMessage}
        </p>
      ) : null}
    </div>
  )
}
