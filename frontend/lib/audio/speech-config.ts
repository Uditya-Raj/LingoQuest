/**
 * Centralized Speech Synthesis utterance settings.
 * Conservative values keep Spanish pronunciation understandable without rushing.
 */

/** Slightly slower than default for clearer L2 listening. */
export const SPEECH_RATE = 0.95

/** Neutral pitch — do not caricature voices. */
export const SPEECH_PITCH = 1

/** Full volume; system/OS mute remains the learner's control. */
export const SPEECH_VOLUME = 1

/** Loose BCP 47 check aligned with backend seed/admin validation intent. */
const BCP47_PATTERN = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/

export function isValidTtsText(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function isValidTtsLang(value: string | null | undefined): value is string {
  return typeof value === 'string' && BCP47_PATTERN.test(value.trim())
}

export function isCompleteTtsPair(
  text: string | null | undefined,
  lang: string | null | undefined,
): text is string {
  return isValidTtsText(text) && isValidTtsLang(lang)
}

/** Narrow both TTS fields when the pair is complete and valid. */
export function asCompleteTtsPair(
  text: string | null | undefined,
  lang: string | null | undefined,
): { text: string; lang: string } | null {
  if (!isValidTtsText(text) || !isValidTtsLang(lang)) return null
  return { text: text.trim(), lang: lang.trim() }
}

/**
 * Reject empty URLs and known Duolingo hosts. Only http(s)/blob are playable.
 */
export function isPlayableAudioUrl(value: string | null | undefined): value is string {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!trimmed) return false
  if (/duolingo\.com/i.test(trimmed)) return false

  try {
    const parsed = new URL(trimmed, 'https://lingoquest.local')
    return (
      parsed.protocol === 'http:' ||
      parsed.protocol === 'https:' ||
      parsed.protocol === 'blob:'
    )
  } catch {
    return false
  }
}

/** Human language name for accessible Play/Replay labels. */
export function languageDisplayName(lang: string): string {
  const base = lang.trim().split('-')[0] ?? lang
  try {
    const display = new Intl.DisplayNames(['en'], { type: 'language' })
    return display.of(base) ?? lang
  } catch {
    return lang
  }
}
