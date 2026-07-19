/**
 * Stable, unique option ID helpers for content-admin exercise editors.
 * IDs are independent of visible text and never derived from array indices.
 */

let counter = 0

/** Reset the sequential counter (tests only). */
export function resetOptionIdCounter(): void {
  counter = 0
}

/**
 * Generate a unique option ID safe for SSR and client use.
 * Prefers crypto.randomUUID when available; falls back to a counter + time.
 */
export function createOptionId(prefix = 'opt'): string {
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '') || 'opt'

  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return `${safePrefix}_${globalThis.crypto.randomUUID().replace(/-/g, '')}`
  }

  counter += 1
  const stamp = Date.now().toString(36)
  return `${safePrefix}_${stamp}_${counter}`
}

/** Ensure an ID is unique within an existing set by appending a suffix if needed. */
export function ensureUniqueOptionId(
  candidate: string,
  existing: ReadonlySet<string>,
  prefix = 'opt',
): string {
  const trimmed = candidate.trim()
  if (trimmed.length > 0 && !existing.has(trimmed)) {
    return trimmed
  }
  let next = createOptionId(prefix)
  while (existing.has(next)) {
    next = createOptionId(prefix)
  }
  return next
}
