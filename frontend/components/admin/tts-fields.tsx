'use client'

import { useEffect } from 'react'

import { Button3D } from '@/components/ui/button-3d'
import { useSpeechSynthesis } from '@/hooks/use-speech-synthesis'
import {
  asCompleteTtsPair,
  languageDisplayName,
} from '@/lib/audio/speech-config'
import { cn } from '@/lib/utils'

interface TtsFieldsProps {
  ttsText: string | null
  ttsLang: string | null
  onTtsTextChange: (value: string | null) => void
  onTtsLangChange: (value: string | null) => void
  errorIds?: {
    text?: string
    lang?: string
    pair?: string
  }
  className?: string
}

/**
 * Admin TTS pair fields with explicit Preview (no autoplay).
 * Preview uses unsaved form values and does not mutate the exercise.
 */
export function TtsFields({
  ttsText,
  ttsLang,
  onTtsTextChange,
  onTtsLangChange,
  errorIds,
  className,
}: TtsFieldsProps) {
  const pair = asCompleteTtsPair(ttsText, ttsLang)
  const speech = useSpeechSynthesis({
    token: `admin-tts-${ttsText ?? ''}-${ttsLang ?? ''}`,
    text: pair?.text ?? '',
    lang: pair?.lang ?? 'es-ES',
    enabled: pair !== null,
  })

  useEffect(() => {
    return () => {
      speech.cancel()
    }
    // Cancel only on unmount / token change handled inside hook
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup uses latest cancel
  }, [ttsText, ttsLang, speech.cancel])

  const textValue = ttsText ?? ''
  const langValue = ttsLang ?? ''
  const language = pair ? languageDisplayName(pair.lang) : 'selected language'
  const canPreview = pair !== null && speech.supported && speech.status !== 'unsupported'

  return (
    <fieldset
      className={cn('space-y-3 rounded-lq border border-lq-border-default p-4', className)}
    >
      <legend className="px-1 text-lq-sm font-extrabold">
        Speech synthesis (TTS)
      </legend>
      <p className="text-lq-xs text-lq-text-secondary">
        Provide both text and language, or leave both empty. Preview uses the
        current unsaved values and never autoplays.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="admin-field-tts_text"
            className="text-lq-sm font-bold"
          >
            TTS text
          </label>
          <input
            id="admin-field-tts_text"
            type="text"
            value={textValue}
            onChange={(e) =>
              onTtsTextChange(e.target.value.length === 0 ? null : e.target.value)
            }
            aria-invalid={Boolean(errorIds?.text || errorIds?.pair)}
            aria-describedby={errorIds?.text ?? errorIds?.pair}
            className="min-h-11 w-full rounded-lq border-2 border-lq-border-default bg-lq-bg-surface px-3 text-lq-sm"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="admin-field-tts_lang"
            className="text-lq-sm font-bold"
          >
            TTS language (BCP 47)
          </label>
          <input
            id="admin-field-tts_lang"
            type="text"
            value={langValue}
            placeholder="es-ES"
            onChange={(e) =>
              onTtsLangChange(e.target.value.length === 0 ? null : e.target.value)
            }
            aria-invalid={Boolean(errorIds?.lang || errorIds?.pair)}
            aria-describedby={errorIds?.lang ?? errorIds?.pair}
            className="min-h-11 w-full rounded-lq border-2 border-lq-border-default bg-lq-bg-surface px-3 text-lq-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button3D
          type="button"
          size="sm"
          variant="secondary"
          disabled={!canPreview || speech.status === 'speaking'}
          onClick={() => speech.play()}
          aria-label={
            speech.status === 'replayable' || speech.status === 'idle'
              ? `Preview ${language} pronunciation`
              : `Play ${language} pronunciation`
          }
        >
          {speech.status === 'replayable' ? 'Replay' : 'Preview'}
        </Button3D>
        {!speech.supported ? (
          <span className="text-lq-xs text-lq-text-secondary">
            Speech synthesis is unavailable in this browser.
          </span>
        ) : null}
        {speech.errorMessage ? (
          <span className="text-lq-xs text-lq-error" role="status">
            {speech.errorMessage}
          </span>
        ) : null}
      </div>
    </fieldset>
  )
}
