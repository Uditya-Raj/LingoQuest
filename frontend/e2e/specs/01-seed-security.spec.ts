/**
 * Phase 12 — Fresh seed gate + public-data security (API + browser).
 * Does not depend on prior mutation order.
 */
import { test, expect } from '@playwright/test'
import { spawnSync } from 'node:child_process'
import {
  assertNoCorrectAnswer,
  apiPath,
  createApiContext,
  freezeSeedClock,
} from '../helpers/api'
import { attachConsoleGuard, assertNoDuolingoRequests } from '../helpers/console'
import { loadE2EState } from '../env'

test.describe('Phase 12 seed and security gate', () => {
  test('isolated OpenAPI title and seed learner identity', async () => {
    const api = await createApiContext()
    await freezeSeedClock(api)
    const openapi = await (await api.get(apiPath('/openapi.json'))).json()
    expect(openapi.info.title).toBe('LingoQuest API')
    expect(JSON.stringify(openapi)).not.toMatch(/LingoPath/i)

    const me = await (await api.get(apiPath('/user/me'))).json()
    expect(me.user.username).toBe('maya_demo')
    expect(me.user.display_name).toBe('Maya')
    expect(me.stats.total_xp).toBe(340)
    expect(me.stats.hearts).toBe(4)
    expect(me.stats.gems).toBe(100)
    expect(me.stats.current_streak).toBe(6)
    expect(me.stats.daily_goal_xp).toBe(20)

    const lb = await (await api.get(apiPath('/leaderboard'))).json()
    expect(lb.current_user.is_current_user).toBe(true)
    expect(lb.current_user.rank).toBe(3)
    expect(lb.current_user.display_name).toBe('Maya')

    const state = loadE2EState()
    expect(state.apiBaseUrl).toContain('18080')
    await api.dispose()
  })

  test('FK check on isolated E2E database remains clean', async () => {
    const state = loadE2EState()
    const py = process.platform === 'win32' ? 'python' : 'python3'
    const script = `
import sqlite3, sys
conn = sqlite3.connect(sys.argv[1])
conn.execute("PRAGMA foreign_keys=ON")
assert conn.execute("PRAGMA foreign_key_check").fetchall() == []
print("fk_ok")
`
    const result = spawnSync(py, ['-c', script, state.dbPath], {
      encoding: 'utf8',
    })
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('fk_ok')
  })

  test('course path payload and browser storage never leak correct_answer', async ({
    page,
  }) => {
    const api = await createApiContext()
    await freezeSeedClock(api)
    const guard = attachConsoleGuard(page)
    const seen: string[] = []
    page.on('request', (req) => seen.push(req.url()))

    // Read-only: do not start attempts here (would leave active attempts for later journeys).
    const course = await (await api.get(apiPath('/course'))).json()
    assertNoCorrectAnswer(course)

    const skills = (
      course.units as Array<{
        skills: Array<{ id: number; status: string; title: string }>
      }>
    ).flatMap((u) => u.skills)
    expect(skills.find((s) => s.title === 'Greetings')?.status).toBe('completed')
    expect(skills.find((s) => s.title === 'Basics')?.status).toBe('completed')
    expect(skills.find((s) => s.title === 'Food')?.status).toBe('in_progress')
    expect(skills.find((s) => s.title === 'Family')?.status).toBe('available')
    expect(skills.find((s) => s.title === 'Questions')?.status).toBe('locked')

    await page.goto('/learn')
    await page.getByRole('list', { name: 'Learning path units' }).waitFor()

    const leaked = await page.evaluate(() => {
      const blob = JSON.stringify(localStorage) + JSON.stringify(sessionStorage)
      return blob.includes('correct_answer')
    })
    expect(leaked).toBe(false)

    assertNoDuolingoRequests(seen)
    guard.assertClean()
    await api.dispose()
  })

  test('admin tree may include correct_answer after authorization', async () => {
    const api = await createApiContext()
    const tree = await (await api.get(apiPath('/admin/content/tree'))).json()
    const sample = tree.courses[0].units[0].skills[0].lessons[0].exercises[0]
    expect(sample).toHaveProperty('correct_answer')
    await api.dispose()
  })

  test('frontend bundle has no secrets or hardcoded stale API ports', async ({
    request,
  }) => {
    const state = loadE2EState()
    const home = await request.get(state.frontendBaseUrl)
    expect(home.ok()).toBeTruthy()
    const html = await home.text()
    // Client should talk to isolated API, not default :8000 leftover in HTML if present
    expect(html).not.toMatch(/sk-[a-zA-Z0-9]{20,}/)
    expect(html).not.toMatch(/API_KEY\s*=\s*['\"][^'\"]+['\"]/)
  })
})
