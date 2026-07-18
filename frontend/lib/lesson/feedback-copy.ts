/**
 * Original LingoQuest feedback phrases — not Duolingo product copy.
 */

const CORRECT_PHRASES = [
  'Nailed it!',
  "You're on fire!",
  'Perfect quest move!',
  'Exactly right!',
  'Sharp thinking!',
] as const

const INCORRECT_PHRASES = [
  'Not quite — keep going!',
  'Almost there!',
  'Close one!',
  'Good try!',
] as const

/** Deterministic phrase from exercise id so re-renders stay stable. */
export function correctFeedbackMessage(exerciseId: number): string {
  return CORRECT_PHRASES[Math.abs(exerciseId) % CORRECT_PHRASES.length]!
}

export function incorrectFeedbackMessage(exerciseId: number): string {
  return INCORRECT_PHRASES[Math.abs(exerciseId) % INCORRECT_PHRASES.length]!
}
