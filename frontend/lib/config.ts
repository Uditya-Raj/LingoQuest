/**
 * Frontend environment configuration.
 * Feature components must not construct backend origins manually.
 */

const ENV_KEY = 'NEXT_PUBLIC_API_BASE_URL'

/**
 * Normalize and return the API base URL (no trailing slash).
 * Expected development value: http://localhost:8000/api
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL

  if (raw === undefined || raw.trim() === '') {
    throw new Error(
      `[LingoQuest] ${ENV_KEY} is missing or empty. ` +
        `Copy frontend/.env.example to frontend/.env.local and set ` +
        `${ENV_KEY}=http://localhost:8000/api`,
    )
  }

  const trimmed = raw.trim()

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('unsupported protocol')
    }
  } catch {
    throw new Error(
      `[LingoQuest] ${ENV_KEY} must be an absolute http(s) URL ` +
        `(received: ${JSON.stringify(trimmed)}). ` +
        `Example: http://localhost:8000/api`,
    )
  }

  return trimmed.replace(/\/+$/, '')
}

/**
 * Join the configured API base URL with a path that starts with `/`.
 */
export function buildApiUrl(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error(
      `[LingoQuest] API path must start with "/": ${JSON.stringify(path)}`,
    )
  }
  return `${getApiBaseUrl()}${path}`
}
