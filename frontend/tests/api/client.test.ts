import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError, apiGet, apiPatch, apiPost, apiRequest } from '@/lib/api/client'
import { getCourse } from '@/lib/api/course'
import { getContentTree } from '@/lib/api/content'
import { getAttempt, startLesson } from '@/lib/api/lessons'
import { getCurrentUser, getHeartsStatus, getLeaderboard } from '@/lib/api/user'
import { getDebugClock } from '@/lib/api/debug'
import { buildApiUrl, getApiBaseUrl } from '@/lib/config'
import { exerciseAnswerFixtures } from '../contracts/exercise-mappings'

describe('API config', () => {
  it('normalizes the base URL without a trailing slash', () => {
    expect(getApiBaseUrl()).toBe('http://localhost:8000/api')
    expect(buildApiUrl('/course')).toBe('http://localhost:8000/api/course')
  })

  it('rejects paths that do not start with /', () => {
    expect(() => buildApiUrl('course')).toThrow(/must start with/)
  })
})

describe('HTTP client', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  it('performs GET with Accept and cache no-store', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ status: 'healthy' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const data = await apiGet<{ status: string }>('/health')

    expect(data).toEqual({ status: 'healthy' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://localhost:8000/api/health')
    expect(init.method).toBe('GET')
    expect(init.cache).toBe('no-store')
    const headers = new Headers(init.headers)
    expect(headers.get('Accept')).toBe('application/json')
    expect(headers.get('Content-Type')).toBeNull()
  })

  it('serializes POST JSON bodies and sets Content-Type', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const data = await apiPost<{ ok: boolean }>('/admin/exercises', {
      lesson_id: 1,
    })

    expect(data).toEqual({ ok: true })
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ lesson_id: 1 }))
    const headers = new Headers(init.headers)
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('serializes PATCH JSON bodies', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ display_name: 'Maya R.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await apiPatch('/user/me', { display_name: 'Maya R.' })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe('PATCH')
    expect(init.body).toBe(JSON.stringify({ display_name: 'Maya R.' }))
  })

  it('parses the standard backend error envelope', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: 'SKILL_LOCKED',
            message: 'Complete the required skill before starting this lesson.',
            details: { required_skill_id: 2 },
          },
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    await expect(apiGet('/skills/3')).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      code: 'SKILL_LOCKED',
      message: 'Complete the required skill before starting this lesson.',
      details: { required_skill_id: 2 },
    })
  })

  it('falls back safely for malformed non-JSON errors', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>gateway error</html>', {
        status: 502,
        headers: { 'Content-Type': 'text/html' },
      }),
    )

    try {
      await apiRequest('/course')
      expect.unreachable('should throw')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      const apiError = error as ApiError
      expect(apiError.status).toBe(502)
      expect(apiError.code).toBe('HTTP_ERROR')
      expect(apiError.message).toContain('502')
    }
  })

  it('forwards AbortSignal to fetch', async () => {
    const controller = new AbortController()
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await apiGet('/course', { signal: controller.signal })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.signal).toBe(controller.signal)
  })

  it('handles empty 200 bodies', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 200 }))
    const result = await apiGet<undefined>('/noop')
    expect(result).toBeUndefined()
  })
})

describe('Endpoint wrappers', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  it('getCourse hits /course', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ units: [] }))
    await getCourse()
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://localhost:8000/api/course',
    )
  })

  it('startLesson posts to /skills/{id}/start', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ attempt_id: 1 }, 201))
    await startLesson(3)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://localhost:8000/api/skills/3/start')
    expect(init.method).toBe('POST')
  })

  it('getAttempt hits /lessons/{id}', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ attempt_id: 42 }))
    await getAttempt(42)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://localhost:8000/api/lessons/42',
    )
  })

  it('getHeartsStatus hits /hearts/status', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ hearts: 4 }))
    await getHeartsStatus()
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://localhost:8000/api/hearts/status',
    )
  })

  it('getCurrentUser hits /user/me', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ user: { id: 1 } }))
    await getCurrentUser()
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://localhost:8000/api/user/me',
    )
  })

  it('getLeaderboard hits /leaderboard', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ entries: [] }))
    await getLeaderboard(10)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://localhost:8000/api/leaderboard?limit=10',
    )
  })

  it('getContentTree hits admin tree', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ courses: [] }))
    await getContentTree()
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://localhost:8000/api/admin/content/tree',
    )
  })

  it('getDebugClock hits debug clock path', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ offset_days: 0 }))
    await getDebugClock()
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://localhost:8000/api/debug/clock',
    )
  })
})

describe('Exercise answer fixtures', () => {
  it('provides all five submitted-answer shapes', () => {
    expect(Object.keys(exerciseAnswerFixtures).sort()).toEqual(
      [
        'fill_blank',
        'match_pairs',
        'multiple_choice',
        'translate_word_bank',
        'type_answer',
      ].sort(),
    )
    expect(exerciseAnswerFixtures.multiple_choice).toEqual({ option_id: 'a' })
    expect(exerciseAnswerFixtures.type_answer).toEqual({ text: 'Hello' })
  })
})
