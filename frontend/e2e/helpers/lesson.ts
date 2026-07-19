/**
 * Browser lesson interaction helpers — roles/labels only.
 */
import { expect, type Page, type APIRequestContext } from '@playwright/test'
import {
  type AdminExercise,
  apiPath,
  correctPayload,
  loadSolutionMap,
  wrongPayload,
} from './api'

export async function openSkill(
  page: Page,
  title: string,
  opts?: { skillId?: number },
): Promise<void> {
  if (opts?.skillId == null) {
    throw new Error(
      `openSkill("${title}") requires skillId from the course API (avoid path-list races)`,
    )
  }
  // domcontentloaded avoids flaky full-load waits under Next.js compile pressure.
  await page.goto(`/skill/${opts.skillId}`, {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  })
  await page.getByRole('heading', { name: title, exact: true }).waitFor({
    timeout: 45_000,
  })
}

export async function startStandardLesson(page: Page): Promise<number> {
  const start = page.getByRole('button', { name: /^(Start|Resume) Lesson$/ })
  await expect(start).toBeEnabled()
  await start.click()
  await page.waitForURL(/\/lesson\/\d+/)
  const match = page.url().match(/\/lesson\/(\d+)/)
  if (!match) throw new Error(`No attempt id in URL: ${page.url()}`)
  return Number(match[1])
}

export async function startTimedPractice(page: Page): Promise<number> {
  await page.getByRole('button', { name: 'Timed Practice' }).click()
  await page.waitForURL(/\/lesson\/\d+/)
  const match = page.url().match(/\/lesson\/(\d+)/)
  if (!match) throw new Error(`No attempt id in URL: ${page.url()}`)
  return Number(match[1])
}

async function fillCorrectFromExercise(
  page: Page,
  exercise: AdminExercise,
): Promise<void> {
  const payload = correctPayload(exercise)
  switch (exercise.type) {
    case 'multiple_choice': {
      const options = exercise.options as Array<{ id: string; text: string }>
      const chosen = options.find((o) => o.id === payload.option_id)
      if (!chosen) throw new Error('MC option missing')
      await page.getByRole('radio', { name: chosen.text }).click()
      break
    }
    case 'translate_word_bank': {
      const ids = payload.ordered_ids as string[]
      const options = exercise.options as Array<{ id: string; text: string }>
      for (const id of ids) {
        const word = options.find((o) => o.id === id)
        if (!word) throw new Error(`Word ${id} missing`)
        await page.getByRole('button', { name: new RegExp(`^Add ${escapeRegExp(word.text)}`) }).click()
      }
      break
    }
    case 'match_pairs': {
      const pairs = payload.pairs as Array<{ left_id: string; right_id: string }>
      const opts = exercise.options as {
        left: Array<{ id: string; text: string }>
        right: Array<{ id: string; text: string }>
      }
      for (const pair of pairs) {
        const left = opts.left.find((l) => l.id === pair.left_id)
        const right = opts.right.find((r) => r.id === pair.right_id)
        if (!left || !right) throw new Error('Match pair text missing')
        await page
          .getByRole('button', { name: `${left.text}, left item` })
          .click()
        await page
          .getByRole('button', { name: `${right.text}, right item` })
          .click()
      }
      break
    }
    case 'fill_blank': {
      await page.getByLabel('Type the missing word').fill(String(payload.text))
      break
    }
    case 'type_answer': {
      await page.getByLabel('Type your answer').fill(String(payload.text))
      break
    }
  }
}

async function fillWrongFromExercise(
  page: Page,
  exercise: AdminExercise,
): Promise<void> {
  const payload = wrongPayload(exercise)
  switch (exercise.type) {
    case 'multiple_choice': {
      const options = exercise.options as Array<{ id: string; text: string }>
      const chosen = options.find((o) => o.id === payload.option_id)
      if (!chosen) throw new Error('Wrong MC option missing')
      await page.getByRole('radio', { name: chosen.text }).click()
      break
    }
    case 'translate_word_bank': {
      const ids = payload.ordered_ids as string[]
      const options = exercise.options as Array<{ id: string; text: string }>
      for (const id of ids) {
        const word = options.find((o) => o.id === id)
        if (!word) throw new Error(`Word ${id} missing`)
        await page
          .getByRole('button', { name: new RegExp(`^Add ${escapeRegExp(word.text)}`) })
          .click()
      }
      break
    }
    case 'match_pairs': {
      const pairs = payload.pairs as Array<{ left_id: string; right_id: string }>
      const opts = exercise.options as {
        left: Array<{ id: string; text: string }>
        right: Array<{ id: string; text: string }>
      }
      for (const pair of pairs) {
        const left = opts.left.find((l) => l.id === pair.left_id)
        const right = opts.right.find((r) => r.id === pair.right_id)
        if (!left || !right) throw new Error('Match pair text missing')
        await page
          .getByRole('button', { name: `${left.text}, left item` })
          .click()
        await page
          .getByRole('button', { name: `${right.text}, right item` })
          .click()
      }
      break
    }
    case 'fill_blank': {
      await page.getByLabel('Type the missing word').fill(String(payload.text))
      break
    }
    case 'type_answer': {
      await page.getByLabel('Type your answer').fill(String(payload.text))
      break
    }
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function submitCurrentExercise(
  page: Page,
  api: APIRequestContext,
  attemptId: number,
  solutions: Map<number, AdminExercise>,
  mode: 'correct' | 'wrong' = 'correct',
): Promise<{ isCorrect: boolean; hearts: number | null; lessonStatus: string }> {
  const attempt = await (await api.get(apiPath(`/lessons/${attemptId}`))).json()
  const index = attempt.current_index as number
  const exerciseMeta = attempt.exercises[index] as { id: number; type: string }
  const adminEx = solutions.get(exerciseMeta.id)
  if (!adminEx) {
    throw new Error(`No admin solution for exercise ${exerciseMeta.id}`)
  }

  if (mode === 'correct') {
    await fillCorrectFromExercise(page, adminEx)
  } else {
    await fillWrongFromExercise(page, adminEx)
  }

  const answerPromise = page.waitForResponse(
    (res) =>
      res.url().includes(`/lessons/${attemptId}/answer`) &&
      res.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Check' }).click()
  const answerRes = await answerPromise
  const body = await answerRes.json()
  const lessonStatus = String(body.lesson_status ?? '')

  if (lessonStatus === 'failed') {
    // Out-of-hearts / time-expired: terminal surface replaces Continue feedback.
    await expect(
      page.getByRole('heading', { name: /Out of hearts|Time's up!/i }),
    ).toBeVisible({ timeout: 15_000 })
    return {
      isCorrect: Boolean(body.is_correct),
      hearts:
        typeof body.hearts_remaining === 'number' ? body.hearts_remaining : null,
      lessonStatus,
    }
  }

  if (mode === 'correct') {
    await expect(
      page
        .getByText(
          /Nailed it!|You're on fire!|Perfect quest move!|Exactly right!|Sharp thinking!/i,
        )
        .first(),
    ).toBeVisible({ timeout: 10_000 })
  } else {
    await expect(
      page
        .getByText(/Not quite|Almost there!|Close one!|Good try!/i)
        .first(),
    ).toBeVisible({ timeout: 10_000 })
    await expect(
      page.getByText(/Correct answer:|Correct pairs/i).first(),
    ).toBeVisible({ timeout: 10_000 })
  }

  const continueBtn = page.getByRole('button', {
    name: /^(Continue|Finish lesson)$/,
  })
  await expect(continueBtn).toBeEnabled()
  await continueBtn.click()
  // Wait until feedback clears / next exercise loads (or completion surface).
  await expect(continueBtn).toBeHidden({ timeout: 15_000 }).catch(() => undefined)

  return {
    isCorrect: Boolean(body.is_correct),
    hearts:
      typeof body.hearts_remaining === 'number' ? body.hearts_remaining : null,
    lessonStatus,
  }
}

export async function completeRemainingExercises(
  page: Page,
  api: APIRequestContext,
  attemptId: number,
  solutions?: Map<number, AdminExercise>,
): Promise<void> {
  const map = solutions ?? (await loadSolutionMap(api))
  for (;;) {
    const attemptRes = await api.get(apiPath(`/lessons/${attemptId}`))
    const attempt = await attemptRes.json()
    if (attempt.status === 'completed' || attempt.status === 'failed') break
    if (attempt.can_complete) {
      break
    }
    const index = attempt.current_index as number
    if (index >= (attempt.exercises as unknown[]).length) break
    await submitCurrentExercise(page, api, attemptId, map, 'correct')
    const completeVisible = await page
      .getByRole('heading', { name: /Lesson complete|Timed Practice complete/i })
      .isVisible()
      .catch(() => false)
    if (completeVisible) break
  }
}

export async function answerAllCorrect(
  page: Page,
  api: APIRequestContext,
  attemptId: number,
): Promise<{ completePosts: number; xpEarned: number | null }> {
  const solutions = await loadSolutionMap(api)
  let completePosts = 0
  const onComplete = (res: {
    url: () => string
    request: () => { method: () => string }
  }) => {
    if (
      res.url().includes(`/lessons/${attemptId}/complete`) &&
      res.request().method() === 'POST'
    ) {
      completePosts += 1
    }
  }
  page.on('response', onComplete)

  try {
    for (let guard = 0; guard < 20; guard++) {
      const heading = page.getByRole('heading', {
        name: /Lesson complete|Timed Practice complete/i,
      })
      if (await heading.isVisible().catch(() => false)) break

      const attempt = await (await api.get(apiPath(`/lessons/${attemptId}`))).json()
      if (attempt.status === 'completed' || attempt.status === 'failed') break
      if (attempt.status !== 'in_progress') break
      if (attempt.can_complete) {
        // Last Continue should already have fired completion; wait for results.
        await expect(heading).toBeVisible({ timeout: 20_000 })
        break
      }
      const index = attempt.current_index as number
      if (
        !Array.isArray(attempt.exercises) ||
        index < 0 ||
        index >= attempt.exercises.length
      ) {
        await expect(heading).toBeVisible({ timeout: 20_000 })
        break
      }

      await submitCurrentExercise(page, api, attemptId, solutions, 'correct')
    }

    await expect(
      page.getByRole('heading', {
        name: /Lesson complete|Timed Practice complete/i,
      }),
    ).toBeVisible({ timeout: 20_000 })

    const finished = await (await api.get(apiPath(`/lessons/${attemptId}`))).json()
    const summary = finished.terminal_summary as
      | { xp_earned?: number }
      | null
      | undefined
    const xpEarned =
      typeof summary?.xp_earned === 'number'
        ? summary.xp_earned
        : typeof finished.xp_earned === 'number'
          ? finished.xp_earned
          : null
    return {
      completePosts,
      xpEarned,
    }
  } finally {
    page.off('response', onComplete)
  }
}

/** Complete an in-progress attempt via API (no extra heart loss) to clear active state. */
export async function completeAttemptViaApi(
  api: APIRequestContext,
  attemptId: number,
): Promise<void> {
  const solutions = await loadSolutionMap(api)
  for (let i = 0; i < 20; i++) {
    const attempt = await (await api.get(apiPath(`/lessons/${attemptId}`))).json()
    if (attempt.status === 'completed' || attempt.status === 'failed') return
    if (attempt.can_complete) {
      const complete = await api.post(apiPath(`/lessons/${attemptId}/complete`))
      if (!complete.ok() && complete.status() !== 409) {
        throw new Error(
          `complete failed: ${complete.status()} ${await complete.text()}`,
        )
      }
      return
    }
    const index = attempt.current_index as number
    const ex = attempt.exercises[index] as { id: number }
    const admin = solutions.get(ex.id)
    if (!admin) throw new Error(`No solution for ${ex.id}`)
    const res = await api.post(apiPath(`/lessons/${attemptId}/answer`), {
      data: {
        exercise_id: ex.id,
        position: index,
        answer: correctPayload(admin),
      },
    })
    if (!res.ok()) {
      throw new Error(`answer failed: ${res.status()} ${await res.text()}`)
    }
    const body = await res.json()
    if (body.can_complete) {
      const complete = await api.post(apiPath(`/lessons/${attemptId}/complete`))
      if (!complete.ok() && complete.status() !== 409) {
        throw new Error(
          `complete failed: ${complete.status()} ${await complete.text()}`,
        )
      }
      return
    }
  }
}

export async function installSpeechMocks(page: Page): Promise<{
  getCalls: () => Promise<Array<{ text: string; lang: string }>>
  getCancelCount: () => Promise<number>
}> {
  await page.addInitScript(() => {
    const store = window as unknown as {
      __lqTtsCalls?: Array<{ text: string; lang: string }>
      __lqTtsCancels?: number
    }
    store.__lqTtsCalls = []
    store.__lqTtsCancels = 0
    class MockUtterance {
      text: string
      lang = ''
      onend: ((ev: Event) => void) | null = null
      onerror: ((ev: Event) => void) | null = null
      constructor(text: string) {
        this.text = text
      }
    }
    const synth = {
      speaking: false,
      pending: false,
      paused: false,
      speak(u: MockUtterance) {
        store.__lqTtsCalls!.push({ text: u.text, lang: u.lang })
        this.speaking = true
        queueMicrotask(() => {
          this.speaking = false
          u.onend?.(new Event('end'))
        })
      },
      cancel() {
        store.__lqTtsCancels = (store.__lqTtsCancels ?? 0) + 1
        this.speaking = false
      },
      pause() {},
      resume() {},
      getVoices() {
        return []
      },
    }
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: synth,
    })
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: MockUtterance,
    })
  })
  return {
    getCalls: () =>
      page.evaluate(() => {
        return (
          (window as unknown as { __lqTtsCalls?: Array<{ text: string; lang: string }> })
            .__lqTtsCalls ?? []
        )
      }),
    getCancelCount: () =>
      page.evaluate(() => {
        return (
          (window as unknown as { __lqTtsCancels?: number }).__lqTtsCancels ?? 0
        )
      }),
  }
}
