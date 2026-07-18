/**
 * Safe Speech Synthesis support detection.
 * Never touch window/speechSynthesis at module initialization.
 */

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false
  return (
    typeof window.speechSynthesis !== 'undefined' &&
    typeof window.SpeechSynthesisUtterance === 'function'
  )
}

export function getSpeechSynthesis(): SpeechSynthesis | null {
  if (!isSpeechSynthesisSupported()) return null
  return window.speechSynthesis
}
