/**
 * Phase 12 global setup (runs after webServer is up).
 * DB prepare happens in `npm run test:e2e` via prepare-db.mjs before Playwright starts.
 */
import { existsSync, statSync } from 'node:fs'
import { loadE2EState } from './env'

async function waitFor(url: string, attempts = 120): Promise<void> {
  let last = ''
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return
      last = `${res.status}`
    } catch (e) {
      last = e instanceof Error ? e.message : String(e)
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`Timed out waiting for ${url}: ${last}`)
}

export default async function globalSetup(): Promise<void> {
  const state = loadE2EState() as ReturnType<typeof loadE2EState> & {
    devDbPath?: string
    devDbBefore?: { size: number; mtimeMs: number } | null
    seedLogicalNow: string
  }

  await waitFor(`${state.apiBaseUrl}/health`)

  const openapi = await (await fetch(`${state.apiBaseUrl}/openapi.json`)).json()
  if (openapi?.info?.title !== 'LingoQuest API') {
    throw new Error(`OpenAPI title mismatch: ${JSON.stringify(openapi?.info?.title)}`)
  }

  const setClock = await fetch(`${state.apiBaseUrl}/debug/clock/set`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logical_now: state.seedLogicalNow }),
  })
  if (!setClock.ok) {
    throw new Error(`Failed to freeze debug clock: ${await setClock.text()}`)
  }

  const me = await (await fetch(`${state.apiBaseUrl}/user/me`)).json()
  if (me?.user?.username !== 'maya_demo' || me?.user?.display_name !== 'Maya') {
    throw new Error(`Expected Maya current learner, got ${JSON.stringify(me)}`)
  }

  const lb = await (await fetch(`${state.apiBaseUrl}/leaderboard`)).json()
  const mayaRank = lb.current_user?.rank
  if (mayaRank !== 3) {
    throw new Error(`Expected Maya rank 3, got ${JSON.stringify(lb.current_user)}`)
  }

  if (state.devDbBefore && state.devDbPath && existsSync(state.devDbPath)) {
    const st = statSync(state.devDbPath)
    if (
      st.size !== state.devDbBefore.size ||
      st.mtimeMs !== state.devDbBefore.mtimeMs
    ) {
      throw new Error('Development lingopath.db was mutated during E2E prepare — aborting')
    }
  }

  // Warm App Router compiles so journey navigations do not hit 90s load timeouts.
  const warmPaths = [
    '/',
    '/profile',
    '/leaderboard',
    '/settings',
    '/admin/content',
    '/skill/1',
    '/skill/2',
    '/skill/3',
    '/skill/4',
    '/skill/5',
  ]
  for (const path of warmPaths) {
    await waitFor(`${state.frontendBaseUrl}${path}`, 240)
  }

  console.log('[e2e] global-setup complete', {
    api: state.apiBaseUrl,
    web: state.frontendBaseUrl,
    db: state.dbPath,
    openApiTitle: 'LingoQuest API',
  })
}
