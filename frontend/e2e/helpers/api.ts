/**
 * Test-only API access for Phase 12.
 * Solution lookup uses the authorized admin tree — never learner start/retrieve payloads.
 */
import { request, type APIRequestContext } from '@playwright/test'
import { loadE2EState } from '../env'

export type ExerciseType =
  | 'multiple_choice'
  | 'translate_word_bank'
  | 'match_pairs'
  | 'fill_blank'
  | 'type_answer'

export interface AdminExercise {
  id: number
  type: ExerciseType
  prompt: string
  options: unknown
  correct_answer: Record<string, unknown>
  tts_text: string | null
  tts_lang: string | null
  audio_url: string | null
}

/**
 * Playwright resolves absolute paths against the origin only, so baseURL must be
 * the host origin and every path must include the `/api` prefix.
 */
export async function createApiContext(): Promise<APIRequestContext> {
  const { apiBaseUrl } = loadE2EState()
  const origin = apiBaseUrl.replace(/\/api\/?$/, '')
  return request.newContext({
    baseURL: origin,
    extraHTTPHeaders: { Accept: 'application/json' },
  })
}

function apiPath(path: string): string {
  if (!path.startsWith('/')) return `/api/${path}`
  if (path.startsWith('/api/')) return path
  return `/api${path}`
}

export async function freezeSeedClock(api: APIRequestContext): Promise<void> {
  const { seedLogicalNow } = loadE2EState()
  const res = await api.post(apiPath('/debug/clock/set'), {
    data: { logical_now: seedLogicalNow },
  })
  if (!res.ok()) {
    throw new Error(`clock/set failed: ${res.status()} ${await res.text()}`)
  }
}

export async function setLogicalNow(
  api: APIRequestContext,
  iso: string,
): Promise<void> {
  const res = await api.post(apiPath('/debug/clock/set'), {
    data: { logical_now: iso },
  })
  if (!res.ok()) {
    throw new Error(`clock/set failed: ${res.status()} ${await res.text()}`)
  }
}

/** Resolve a skill id from GET /course by exact title. */
export async function skillIdByTitle(
  api: APIRequestContext,
  title: string,
): Promise<number> {
  const res = await api.get(apiPath('/course'))
  if (!res.ok()) {
    throw new Error(`course failed: ${res.status()} ${await res.text()}`)
  }
  const course = await res.json()
  const skill = (
    course.units as Array<{ skills: Array<{ id: number; title: string }> }>
  )
    .flatMap((u) => u.skills)
    .find((s) => s.title === title)
  if (!skill) throw new Error(`Skill not found in course: ${title}`)
  return skill.id
}

/** Build exercise_id → correct_answer map from admin content tree. */
export async function loadSolutionMap(
  api: APIRequestContext,
): Promise<Map<number, AdminExercise>> {
  const res = await api.get(apiPath('/admin/content/tree'))
  if (!res.ok()) {
    throw new Error(`admin tree failed: ${res.status()} ${await res.text()}`)
  }
  const tree = await res.json()
  const map = new Map<number, AdminExercise>()
  for (const course of tree.courses ?? []) {
    for (const unit of course.units ?? []) {
      for (const skill of unit.skills ?? []) {
        for (const lesson of skill.lessons ?? []) {
          for (const ex of lesson.exercises ?? []) {
            map.set(ex.id, ex as AdminExercise)
          }
        }
      }
    }
  }
  return map
}

export function correctPayload(
  exercise: AdminExercise,
): Record<string, unknown> {
  const ca = exercise.correct_answer
  switch (exercise.type) {
    case 'multiple_choice':
      return { option_id: ca.option_id }
    case 'translate_word_bank':
      return { ordered_ids: [...(ca.ordered_ids as string[])] }
    case 'match_pairs':
      return {
        pairs: (ca.pairs as Array<Record<string, string>>).map((p) => ({
          ...p,
        })),
      }
    case 'fill_blank':
      return { text: ca.text }
    case 'type_answer':
      return { text: (ca.accepted as string[])[0] }
    default:
      throw new Error(`Unknown type ${(exercise as AdminExercise).type}`)
  }
}

export function wrongPayload(exercise: AdminExercise): Record<string, unknown> {
  const ca = exercise.correct_answer
  switch (exercise.type) {
    case 'multiple_choice': {
      const options = exercise.options as Array<{ id: string }>
      const wrong = options.find((o) => o.id !== ca.option_id)
      if (!wrong) throw new Error('No wrong MC option')
      return { option_id: wrong.id }
    }
    case 'translate_word_bank': {
      const ids = [...(ca.ordered_ids as string[])]
      if (ids.length < 2) throw new Error('Word bank too short to reverse')
      return { ordered_ids: ids.reverse() }
    }
    case 'match_pairs': {
      const pairs = (ca.pairs as Array<{ left_id: string; right_id: string }>).map(
        (p) => ({ ...p }),
      )
      if (pairs.length < 2) throw new Error('Need 2 pairs to scramble')
      const tmp = pairs[0].right_id
      pairs[0].right_id = pairs[1].right_id
      pairs[1].right_id = tmp
      return { pairs }
    }
    case 'fill_blank':
      return { text: '__wrong__' }
    case 'type_answer':
      return { text: '__wrong__' }
    default:
      throw new Error(`Unknown type ${(exercise as AdminExercise).type}`)
  }
}

export function assertNoCorrectAnswer(payload: unknown, path = 'root'): void {
  if (payload === null || payload === undefined) return
  if (Array.isArray(payload)) {
    payload.forEach((item, i) => assertNoCorrectAnswer(item, `${path}[${i}]`))
    return
  }
  if (typeof payload === 'object') {
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      if (key === 'correct_answer') {
        throw new Error(`correct_answer leaked at ${path}.${key}`)
      }
      assertNoCorrectAnswer(value, `${path}.${key}`)
    }
  }
}

export async function getJson<T>(
  api: APIRequestContext,
  path: string,
): Promise<T> {
  const res = await api.get(apiPath(path))
  if (!res.ok()) {
    throw new Error(`GET ${path} → ${res.status()} ${await res.text()}`)
  }
  return res.json() as Promise<T>
}

export { apiPath }
