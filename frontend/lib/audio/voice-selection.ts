/**
 * Voice selection for browser Speech Synthesis.
 *
 * Priority (documented):
 * 1. Exact language match (e.g. es-ES)
 * 2. Same base language (any es-*)
 * 3. Browser default voice while retaining utterance.lang
 *
 * Do not hardcode platform voice names. Do not block indefinitely for voices.
 */

export function normalizeVoiceLang(lang: string): string {
  return lang.trim().replace(/_/g, '-')
}

export function selectVoice(
  voices: ReadonlyArray<SpeechSynthesisVoice>,
  requestedLang: string,
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null

  const target = normalizeVoiceLang(requestedLang).toLowerCase()
  const base = target.split('-')[0] ?? target

  const exact = voices.find(
    (voice) => normalizeVoiceLang(voice.lang).toLowerCase() === target,
  )
  if (exact) return exact

  const baseMatch = voices.find((voice) => {
    const voiceLang = normalizeVoiceLang(voice.lang).toLowerCase()
    return voiceLang === base || voiceLang.startsWith(`${base}-`)
  })
  if (baseMatch) return baseMatch

  return null
}
