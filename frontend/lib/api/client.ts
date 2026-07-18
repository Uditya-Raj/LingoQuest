/**
 * Central HTTP client for the LingoQuest backend API.
 * No UI toasts or navigation — callers handle presentation.
 */

import { buildApiUrl } from '@/lib/config'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Record<string, unknown> | null | undefined

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown> | null,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH'

export interface ApiRequestOptions {
  method?: HttpMethod
  body?: unknown
  signal?: AbortSignal
  /** Extra headers merged after defaults. */
  headers?: Record<string, string>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseErrorEnvelope(
  status: number,
  payload: unknown,
  rawText: string,
): ApiError {
  if (isRecord(payload) && isRecord(payload.error)) {
    const err = payload.error
    const code =
      typeof err.code === 'string' && err.code.length > 0
        ? err.code
        : 'UNKNOWN_ERROR'
    const message =
      typeof err.message === 'string' && err.message.length > 0
        ? err.message
        : `Request failed with status ${status}`
    const details =
      err.details === undefined
        ? undefined
        : isRecord(err.details) || err.details === null
          ? (err.details as Record<string, unknown> | null)
          : { value: err.details }
    return new ApiError(status, code, message, details)
  }

  // FastAPI validation errors often use { detail: ... }
  if (isRecord(payload) && 'detail' in payload) {
    const detail = payload.detail
    if (typeof detail === 'string' && detail.length > 0) {
      return new ApiError(status, 'HTTP_ERROR', detail, payload)
    }
    return new ApiError(
      status,
      'VALIDATION_ERROR',
      `Request failed with status ${status}`,
      isRecord(detail) ? detail : { detail },
    )
  }

  const fallbackMessage =
    rawText.trim().length > 0
      ? `Request failed with status ${status}`
      : `Request failed with status ${status}`

  return new ApiError(status, 'HTTP_ERROR', fallbackMessage, isRecord(payload) ? payload : null)
}

async function readBody(response: Response): Promise<{
  text: string
  json: unknown | undefined
}> {
  const text = await response.text()
  if (text.trim() === '') {
    return { text: '', json: undefined }
  }
  try {
    return { text, json: JSON.parse(text) as unknown }
  } catch {
    return { text, json: undefined }
  }
}

/**
 * Perform a typed JSON API request against the configured base URL.
 * Does not retry mutations. Does not treat HTTP failures as success.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const method: HttpMethod = options.method ?? 'GET'
  const url = buildApiUrl(path)

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  }

  let body: string | undefined
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
    signal: options.signal,
    cache: 'no-store',
  })

  const { text, json } = await readBody(response)

  if (!response.ok) {
    if (json !== undefined) {
      throw parseErrorEnvelope(response.status, json, text)
    }
    throw new ApiError(
      response.status,
      'HTTP_ERROR',
      text.trim().length > 0
        ? `Request failed with status ${response.status}`
        : `Request failed with status ${response.status}`,
      text.trim().length > 0 ? { raw: text } : null,
    )
  }

  // 200 / 201 with empty body
  if (json === undefined) {
    return undefined as T
  }

  return json as T
}

export async function apiGet<T>(
  path: string,
  options?: Pick<ApiRequestOptions, 'signal' | 'headers'>,
): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'GET' })
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  options?: Pick<ApiRequestOptions, 'signal' | 'headers'>,
): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'POST', body })
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  options?: Pick<ApiRequestOptions, 'signal' | 'headers'>,
): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'PATCH', body })
}
