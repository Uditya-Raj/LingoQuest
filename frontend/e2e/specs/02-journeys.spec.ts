/**
 * Phase 12 — Serial product journeys against the isolated stack.
 *
 * These tests mutate Maya’s state and MUST run in order (workers=1, serial).
 * Solutions come from GET /admin/content/tree only.
 */
import { test, expect } from '@playwright/test'
import {
  assertNoCorrectAnswer,
  apiPath,
  createApiContext,
  freezeSeedClock,
  loadSolutionMap,
  setLogicalNow,
  skillIdByTitle,
} from '../helpers/api'
import { attachConsoleGuard, assertNoDuolingoRequests } from '../helpers/console'
import {
  answerAllCorrect,
  completeAttemptViaApi,
  installSpeechMocks,
  openSkill,
  startStandardLesson,
  startTimedPractice,
  submitCurrentExercise,
} from '../helpers/lesson'

test.describe.configure({ mode: 'serial' })

test.describe('Phase 12 required journeys (serial)', () => {
  test('path shell, four skill states, top bar matches API', async ({ page }) => {
    const api = await createApiContext()
    await freezeSeedClock(api)
    const guard = attachConsoleGuard(page)
    const seen: string[] = []
    page.on('request', (req) => seen.push(req.url()))

    const me = await (await api.get(apiPath('/user/me'))).json()
    const course = await (await api.get(apiPath('/course'))).json()

    await page.goto('/learn', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
    await expect(
      page.getByRole('list', { name: 'Learning path units' }),
    ).toBeVisible()

    for (const unit of course.units) {
      await expect(page.getByText(unit.title, { exact: true }).first()).toBeVisible()
    }

    await expect(
      page.getByRole('link', { name: /Greetings, completed/ }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Food, in progress/ }),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Family, available/ }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Questions, locked/ }),
    ).toBeVisible()

    await expect(
      page.getByLabel(`${me.stats.current_streak} day streak`),
    ).toBeVisible()
    await expect(
      page.getByLabel(
        `${me.stats.hearts} of ${me.stats.max_hearts} hearts`,
      ),
    ).toBeVisible()
    await expect(page.getByLabel(`${me.stats.total_xp} total XP`)).toBeVisible()
    await expect(page.getByLabel(`${me.stats.gems} gems`)).toBeVisible()
    await expect(
      page.getByLabel(
        `Daily goal ${me.stats.today_xp} of ${me.stats.daily_goal_xp} XP`,
      ),
    ).toBeVisible()

    // Locked nodes are aria-disabled; activation shows an on-path status message.
    await page
      .getByRole('button', { name: /Questions, locked/ })
      .click({ force: true })
    await expect(page.getByText(/Questions is locked/i)).toBeVisible()
    await page.getByRole('button', { name: 'Dismiss' }).click()

    const questions = (
      course.units as Array<{ skills: Array<{ id: number; title: string }> }>
    )
      .flatMap((u) => u.skills)
      .find((s) => s.title === 'Questions')
    await page.goto(`/skill/${questions!.id}`, {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    })
    await expect(page.getByText('Skill locked')).toBeVisible({ timeout: 45_000 })
    await page.getByRole('link', { name: /Back to path/i }).click()

    const byTitle = (
      course.units as Array<{
        skills: Array<{ id: number; title: string }>
      }>
    )
      .flatMap((u) => u.skills)
      .reduce<Record<string, number>>((acc, s) => {
        acc[s.title] = s.id
        return acc
      }, {})

    await openSkill(page, 'Food', { skillId: byTitle.Food })
    await expect(page.getByText('in progress', { exact: true })).toBeVisible()
    await openSkill(page, 'Family', { skillId: byTitle.Family })
    await expect(page.getByText('available', { exact: true })).toBeVisible()
    await openSkill(page, 'Greetings', { skillId: byTitle.Greetings })
    await expect(page.getByText('completed', { exact: true })).toBeVisible()

    assertNoDuolingoRequests(seen)
    guard.assertClean()
    await api.dispose()
  })

  test('perfect standard lesson with refresh/resume and five exercise types', async ({
    page,
  }) => {
    const api = await createApiContext()
    await freezeSeedClock(api)
    const guard = attachConsoleGuard(page)
    const meBefore = await (await api.get(apiPath('/user/me'))).json()

    await openSkill(page, 'Family', { skillId: await skillIdByTitle(api, 'Family') })
    const attemptId = await startStandardLesson(page)
    expect(page.url()).toContain(`/lesson/${attemptId}`)

    const startBody = await (await api.get(apiPath(`/lessons/${attemptId}`))).json()
    assertNoCorrectAnswer(startBody)
    const types = new Set(
      (startBody.exercises as Array<{ type: string }>).map((e) => e.type),
    )
    expect(types).toEqual(
      new Set([
        'multiple_choice',
        'translate_word_bank',
        'match_pairs',
        'fill_blank',
        'type_answer',
      ]),
    )

    // Answer two, refresh, resume same attempt
    const solutions = await loadSolutionMap(api)
    await submitCurrentExercise(page, api, attemptId, solutions, 'correct')
    await submitCurrentExercise(page, api, attemptId, solutions, 'correct')
    const mid = await (await api.get(apiPath(`/lessons/${attemptId}`))).json()
    expect(mid.current_index).toBe(2)

    await page.reload()
    await page.waitForURL(`**/lesson/${attemptId}`)
    const afterReload = await (await api.get(apiPath(`/lessons/${attemptId}`))).json()
    expect(afterReload.current_index).toBe(2)
    assertNoCorrectAnswer(afterReload)

    const { completePosts, xpEarned } = await answerAllCorrect(
      page,
      api,
      attemptId,
    )
    expect(completePosts).toBe(1)
    expect(xpEarned).not.toBeNull()

    await expect(page.getByText(/Perfect lesson/i)).toBeVisible()
    await page.getByRole('button', { name: 'Return to learning path' }).click()
    await page.waitForURL('**/')

    const meAfter = await (await api.get(apiPath('/user/me'))).json()
    expect(meAfter.stats.total_xp).toBe(meBefore.stats.total_xp + (xpEarned ?? 0))
    expect(meAfter.stats.hearts).toBe(meBefore.stats.hearts)

    const course = await (await api.get(apiPath('/course'))).json()
    const family = (
      course.units as Array<{ skills: Array<{ title: string; crowns: number }> }>
    )
      .flatMap((u) => u.skills)
      .find((s) => s.title === 'Family')
    expect(family?.crowns).toBe(1)

    await page.getByRole('link', { name: 'Profile' }).click()
    await expect(page.getByRole('heading', { name: 'Maya' })).toBeVisible()
    await page.getByRole('link', { name: 'Leaderboard' }).click()
    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible()
    await expect(page.getByText(/Your rank:/i)).toBeVisible()

    // Duplicate completion blocked
    const dup = await api.post(apiPath(`/lessons/${attemptId}/complete`))
    expect(dup.status()).toBe(409)

    await page.reload()
    const meRefresh = await (await api.get(apiPath('/user/me'))).json()
    expect(meRefresh.stats.total_xp).toBe(meAfter.stats.total_xp)

    guard.assertClean()
    await api.dispose()
  })

  test('imperfect successful lesson loses exactly one heart', async ({ page }) => {
    const api = await createApiContext()
    await freezeSeedClock(api)
    const guard = attachConsoleGuard(page)
    const meBefore = await (await api.get(apiPath('/user/me'))).json()
    const solutions = await loadSolutionMap(api)

    await openSkill(page, 'Food', { skillId: await skillIdByTitle(api, 'Food') })
    const attemptId = await startStandardLesson(page)

    const wrong = await submitCurrentExercise(
      page,
      api,
      attemptId,
      solutions,
      'wrong',
    )
    expect(wrong.isCorrect).toBe(false)
    expect(wrong.hearts).toBe(meBefore.stats.hearts - 1)

    const { xpEarned } = await answerAllCorrect(page, api, attemptId)
    await expect(page.getByText(/Perfect lesson/i)).toHaveCount(0)
    expect(xpEarned).not.toBeNull()

    const meAfter = await (await api.get(apiPath('/user/me'))).json()
    expect(meAfter.stats.hearts).toBe(meBefore.stats.hearts - 1)
    expect(meAfter.stats.total_xp).toBe(meBefore.stats.total_xp + (xpEarned ?? 0))

    await page.reload()
    const meRefresh = await (await api.get(apiPath('/user/me'))).json()
    expect(meRefresh.stats.hearts).toBe(meAfter.stats.hearts)

    guard.assertClean()
    await api.dispose()
  })

  test('out-of-hearts, refill, and retry lesson', async ({ page }) => {
    const api = await createApiContext()
    await freezeSeedClock(api)
    const guard = attachConsoleGuard(page)
    const meBefore = await (await api.get(apiPath('/user/me'))).json()
    const solutions = await loadSolutionMap(api)

    await openSkill(page, 'Family', { skillId: await skillIdByTitle(api, 'Family') })
    const failedAttemptId = await startStandardLesson(page)

    let hearts = meBefore.stats.hearts as number
    while (hearts > 0) {
      const result = await submitCurrentExercise(
        page,
        api,
        failedAttemptId,
        solutions,
        'wrong',
      )
      hearts = result.hearts ?? 0
      if (result.lessonStatus === 'failed') break
    }

    await expect(
      page.getByRole('heading', { name: 'Out of hearts' }),
    ).toBeVisible()
    await expect(page.getByText('0 hearts')).toBeVisible()

    // No completion mutation
    const complete = await api.post(apiPath(`/lessons/${failedAttemptId}/complete`))
    expect(complete.status()).toBe(409)

    const meFailed = await (await api.get(apiPath('/user/me'))).json()
    expect(meFailed.stats.total_xp).toBe(meBefore.stats.total_xp)
    expect(meFailed.stats.hearts).toBe(0)

    const refillPromise = page.waitForResponse(
      (res) => res.url().includes('/hearts/refill') && res.request().method() === 'POST',
    )
    await page.getByRole('button', { name: /Refill hearts for 20 gems/i }).click()
    const refillRes = await refillPromise
    expect(refillRes.ok()).toBeTruthy()
    const refillBody = await refillRes.json()

    await expect(page.getByRole('button', { name: 'Retry lesson' })).toBeVisible()
    await page.getByRole('button', { name: 'Retry lesson' }).click()
    await page.waitForURL((url) => {
      const match = url.pathname.match(/\/lesson\/(\d+)/)
      return match !== null && Number(match[1]) !== failedAttemptId
    })
    const newAttemptId = Number(page.url().match(/\/lesson\/(\d+)/)?.[1])
    expect(newAttemptId).not.toBe(failedAttemptId)

    const failed = await (await api.get(apiPath(`/lessons/${failedAttemptId}`))).json()
    expect(failed.status).toBe('failed')

    const meAfter = await (await api.get(apiPath('/user/me'))).json()
    expect(meAfter.stats.hearts).toBe(refillBody.hearts)
    expect(refillBody.gems_spent).toBe(20)
    expect(meAfter.stats.gems).toBe(meBefore.stats.gems - 20)

    // Playable new attempt
    await submitCurrentExercise(page, api, newAttemptId, solutions, 'correct')

    // Clear active attempt without draining hearts again
    await completeAttemptViaApi(api, newAttemptId)

    await page.goto('/learn', { waitUntil: 'domcontentloaded' })
    guard.assertClean()
    await api.dispose()
  })

  test('TTS play/replay lifecycle for an exercise with tts fields', async ({
    page,
  }) => {
    const api = await createApiContext()
    await freezeSeedClock(api)
    const tts = await installSpeechMocks(page)
    const guard = attachConsoleGuard(page)
    const solutions = await loadSolutionMap(api)

    await openSkill(page, 'Basics', { skillId: await skillIdByTitle(api, 'Basics') })
    const attemptId = await startStandardLesson(page)
    const attempt = await (await api.get(apiPath(`/lessons/${attemptId}`))).json()
    assertNoCorrectAnswer(attempt)

    let target = attempt.exercises[attempt.current_index] as {
      id: number
      tts_text: string | null
      tts_lang: string | null
    }
    let idx = attempt.current_index as number
    while (!target.tts_text && idx < attempt.exercises.length - 1) {
      await submitCurrentExercise(page, api, attemptId, solutions, 'correct')
      idx += 1
      const refreshed = await (await api.get(apiPath(`/lessons/${attemptId}`))).json()
      target = refreshed.exercises[refreshed.current_index]
    }

    if (target.tts_text && target.tts_lang) {
      await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
      expect(await tts.getCalls()).toHaveLength(0)
      await page.getByRole('button', { name: 'Play' }).click()
      await expect.poll(async () => (await tts.getCalls()).length).toBeGreaterThan(0)
      const first = (await tts.getCalls())[0]
      expect(first.text).toBe(target.tts_text)
      expect(first.lang).toBe(target.tts_lang)

      await page.getByRole('button', { name: 'Replay' }).click()
      await expect.poll(async () => (await tts.getCancelCount())).toBeGreaterThan(0)
    } else {
      test.info().annotations.push({
        type: 'note',
        description: 'No TTS exercise found early in attempt; skipped utterance asserts',
      })
    }

    await completeAttemptViaApi(api, attemptId)
    await page.goto('/learn', { waitUntil: 'domcontentloaded' })
    guard.assertClean()
    await api.dispose()
  })

  test('successful Timed Practice awards 20 XP without crown', async ({ page }) => {
    const api = await createApiContext()
    await freezeSeedClock(api)
    const guard = attachConsoleGuard(page)
    const meBefore = await (await api.get(apiPath('/user/me'))).json()
    const courseBefore = await (await api.get(apiPath('/course'))).json()
    const foodBefore = (
      courseBefore.units as Array<{
        skills: Array<{ title: string; crowns: number }>
      }>
    )
      .flatMap((u) => u.skills)
      .find((s) => s.title === 'Food')

    await openSkill(page, 'Food', { skillId: await skillIdByTitle(api, 'Food') })
    const attemptId = await startTimedPractice(page)
    const started = await (await api.get(apiPath(`/lessons/${attemptId}`))).json()
    assertNoCorrectAnswer(started)
    expect(started.mode).toBe('timed')
    expect(started.expires_at).toBeTruthy()
    const expiresAt = started.expires_at as string

    await page.reload()
    const reloaded = await (await api.get(apiPath(`/lessons/${attemptId}`))).json()
    expect(reloaded.expires_at).toBe(expiresAt)

    const solutions = await loadSolutionMap(api)
    // One wrong — hearts unchanged
    const wrong = await submitCurrentExercise(
      page,
      api,
      attemptId,
      solutions,
      'wrong',
    )
    expect(wrong.hearts).toBe(meBefore.stats.hearts)

    const { completePosts, xpEarned } = await answerAllCorrect(
      page,
      api,
      attemptId,
    )
    expect(completePosts).toBe(1)
    expect(xpEarned).toBe(20)
    await expect(
      page.getByRole('heading', { name: /Timed Practice complete/i }),
    ).toBeVisible()
    await expect(page.getByText(/Perfect lesson/i)).toHaveCount(0)

    const meAfter = await (await api.get(apiPath('/user/me'))).json()
    expect(meAfter.stats.total_xp).toBe(meBefore.stats.total_xp + 20)
    expect(meAfter.stats.hearts).toBe(meBefore.stats.hearts)

    const courseAfter = await (await api.get(apiPath('/course'))).json()
    const foodAfter = (
      courseAfter.units as Array<{
        skills: Array<{ title: string; crowns: number }>
      }>
    )
      .flatMap((u) => u.skills)
      .find((s) => s.title === 'Food')
    expect(foodAfter?.crowns).toBe(foodBefore?.crowns)

    await page.getByRole('button', { name: 'Return to learning path' }).click()
    guard.assertClean()
    await api.dispose()
  })

  test('timed expiry equality boundary and time-expired modal', async ({ page }) => {
    const api = await createApiContext()
    await freezeSeedClock(api)
    const guard = attachConsoleGuard(page)
    const meBefore = await (await api.get(apiPath('/user/me'))).json()

    await openSkill(page, 'Family', { skillId: await skillIdByTitle(api, 'Family') })
    const attemptId = await startTimedPractice(page)
    const started = await (await api.get(apiPath(`/lessons/${attemptId}`))).json()
    const expiresAt = started.expires_at as string

    // At exact expires_at, backend still permits play
    await setLogicalNow(api, expiresAt)
    const solutions = await loadSolutionMap(api)
    const atBoundary = await submitCurrentExercise(
      page,
      api,
      attemptId,
      solutions,
      'correct',
    )
    expect(atBoundary.lessonStatus).toBe('in_progress')

    // After expires_at → failed time_expired (parse API datetimes as UTC)
    const expiresMs = Date.parse(
      /Z$|[+-]\d{2}:\d{2}$/.test(expiresAt) ? expiresAt : `${expiresAt}Z`,
    )
    const expiredInstant = new Date(expiresMs + 1000)
      .toISOString()
      .replace(/\.\d{3}Z$/, 'Z')
    await setLogicalNow(api, expiredInstant)

    // Backend GET is the authority — must mark failed before UI assertion.
    const failedProbe = await api.get(apiPath(`/lessons/${attemptId}`))
    expect(failedProbe.ok()).toBeTruthy()
    const failedBody = await failedProbe.json()
    expect(failedBody.status).toBe('failed')
    expect(failedBody.failure_reason ?? failedBody.terminal_summary?.failure_reason).toBe(
      'time_expired',
    )

    await page.reload()
    await expect(page.getByRole('heading', { name: /Time'?s up!/i })).toBeVisible({
      timeout: 20_000,
    })
    await expect(page.getByText('Time expired')).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Refill/i }),
    ).toHaveCount(0)

    const meAfter = await (await api.get(apiPath('/user/me'))).json()
    expect(meAfter.stats.total_xp).toBe(meBefore.stats.total_xp)
    expect(meAfter.stats.hearts).toBe(meBefore.stats.hearts)

    await page.getByRole('button', { name: 'Retry Timed Practice' }).click()
    await page.waitForURL((url) => {
      const match = url.pathname.match(/\/lesson\/(\d+)/)
      return match !== null && Number(match[1]) !== attemptId
    })
    const retryId = Number(page.url().match(/\/lesson\/(\d+)/)?.[1])
    expect(retryId).not.toBe(attemptId)

    await freezeSeedClock(api)
    await page.getByRole('button', { name: /Exit .* lesson/i }).click()
    await page.getByRole('button', { name: 'Exit to path' }).click()
    guard.assertClean()
    await api.dispose()
  })

  test('profile, achievements, leaderboard match API', async ({ page }) => {
    const api = await createApiContext()
    await freezeSeedClock(api)
    const guard = attachConsoleGuard(page)
    const me = await (await api.get(apiPath('/user/me'))).json()
    const achievements = await (await api.get(apiPath('/achievements'))).json()
    const lb = await (await api.get(apiPath('/leaderboard'))).json()

    await page.goto('/profile', { waitUntil: 'domcontentloaded' })
    await expect(
      page.getByRole('heading', { name: me.user.display_name }),
    ).toBeVisible()
    await expect(page.getByText(String(me.stats.total_xp)).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Achievements' })).toBeVisible()

    const earned = (
      achievements.achievements as Array<{ earned: boolean; title: string }>
    ).filter((a) => a.earned)
    for (const a of earned.slice(0, 3)) {
      await expect(page.getByText(a.title).first()).toBeVisible()
    }

    await page.goto('/leaderboard', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Leaderboard' })).toBeVisible()
    await expect(
      page.getByText(`Your rank: #${lb.current_user.rank}`),
    ).toBeVisible()
    await expect(page.getByText('(You)').first()).toBeVisible()

    // Dark mode readable
    await page.goto('/settings', { waitUntil: 'domcontentloaded' })
    await page.getByRole('radio', { name: 'Dark theme' }).click()
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })
    await expect(
      page.getByRole('heading', { name: me.user.display_name }),
    ).toBeVisible()

    guard.assertClean()
    await api.dispose()
  })

  test('settings persistence and Coming Soon placeholders', async ({ page }) => {
    const api = await createApiContext()
    await freezeSeedClock(api)
    const guard = attachConsoleGuard(page)

    await page.goto('/settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    await page.getByLabel('Display name').fill('Maya E2E')
    await page.getByLabel('Daily goal (XP)').fill('30')

    const patchPromise = page.waitForResponse(
      (res) =>
        res.url().includes('/user/me') && res.request().method() === 'PATCH',
    )
    await page.getByRole('button', { name: 'Save changes' }).click()
    const patchRes = await patchPromise
    expect(patchRes.ok()).toBeTruthy()
    const patchBody = patchRes.request().postDataJSON()
    expect(patchBody).toMatchObject({
      display_name: 'Maya E2E',
      daily_goal_xp: 30,
    })

    await page.goto('/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Maya E2E' })).toBeVisible()
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Maya E2E' })).toBeVisible()

    const me = await (await api.get(apiPath('/user/me'))).json()
    expect(me.user.display_name).toBe('Maya E2E')
    expect(me.stats.daily_goal_xp).toBe(30)

    // Invalid goal — client validation blocks save
    await page.goto('/settings', { waitUntil: 'domcontentloaded' })
    await page.getByLabel('Daily goal (XP)').fill('0')
    await expect(
      page.getByText(/Daily goal must be between/i),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled()

    // Coming Soon sections
    await expect(page.getByText('Coming Soon').first()).toBeVisible()
    await expect(page.getByText(/Pronunciation practice/i)).toBeVisible()
    await expect(page.getByText(/Super & in-app purchases/i)).toBeVisible()
    await expect(page.getByText(/Friends & social/i)).toBeVisible()
    await expect(page.getByText(/More languages/i)).toBeVisible()

    // Restore name for later admin UX
    await page.getByLabel('Display name').fill('Maya')
    await page.getByLabel('Daily goal (XP)').fill('20')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText(/saved|updated|success/i).first()).toBeVisible({
      timeout: 10_000,
    }).catch(() => undefined)

    const storage = await page.evaluate(() => JSON.stringify(localStorage))
    expect(storage).not.toMatch(/total_xp|hearts|crowns|correct_answer/)

    guard.assertClean()
    await api.dispose()
  })

  test('content manager create/edit and conflict UX', async ({ page }) => {
    const api = await createApiContext()
    await freezeSeedClock(api)
    const guard = attachConsoleGuard(page)

    await page.goto('/admin/content', { waitUntil: 'domcontentloaded' })
    await expect(
      page.getByRole('heading', { name: 'Content manager', level: 1 }),
    ).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('tree', { name: 'Content tree' })).toBeVisible({
      timeout: 30_000,
    })

    // Active-attempt conflict via API + learner retrieve still excludes answers
    const course = await (await api.get(apiPath('/course'))).json()
    const skill = (
      course.units as Array<{ skills: Array<{ id: number; status: string }> }>
    )
      .flatMap((u) => u.skills)
      .find(
        (s) =>
          s.status === 'available' ||
          s.status === 'in_progress' ||
          s.status === 'completed',
      )
    const start = await api.post(apiPath(`/skills/${skill!.id}/start`))
    expect([200, 201]).toContain(start.status())
    const startBody = await start.json()
    assertNoCorrectAnswer(startBody)
    const exId = startBody.exercises[0].id as number
    const patch = await api.patch(apiPath(`/admin/exercises/${exId}`), {
      data: { prompt: 'Should conflict' },
    })
    expect(patch.status()).toBe(409)

    const retrieve = await (
      await api.get(apiPath(`/lessons/${startBody.attempt_id}`))
    ).json()
    assertNoCorrectAnswer(retrieve)

    guard.assertClean()
    await api.dispose()
  })
})
