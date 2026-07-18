/**
 * Phase 10C visual QA — mocked answer/complete/refill only.
 * Never mutates real attempt 143.
 */

import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', '..', 'qa-screenshots', 'phase10c')
mkdirSync(outDir, { recursive: true })

const API = 'http://127.0.0.1:8000'
const APP = 'http://127.0.0.1:3000'

const viewports = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '390x844', width: 390, height: 844 },
  { name: '320x568', width: 320, height: 568 },
]

function mockAttempt(base, overrides = {}) {
  return { ...base, ...overrides }
}

async function capture(page, filename, notes, meta) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
  )
  await page.screenshot({ path: join(outDir, filename), fullPage: false })
  notes.push({ filename, overflow, ...meta })
  console.log(`Captured ${filename} overflow=${overflow}`)
}

async function withPage(browser, { width, height, theme, reducedMotion }, fn) {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme: theme === 'dark' ? 'dark' : 'light',
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
  })
  const page = await context.newPage()
  if (theme === 'dark') {
    await page.addInitScript(() => {
      document.documentElement.classList.add('dark')
      localStorage.setItem(
        'ui-store',
        JSON.stringify({ state: { theme: 'dark' }, version: 0 }),
      )
    })
  }
  try {
    await fn(page)
  } finally {
    await context.close()
  }
}

async function main() {
  const response = await fetch(`${API}/api/lessons/143`)
  if (!response.ok) throw new Error(`Failed to load attempt 143: ${response.status}`)
  const attempt143 = await response.json()
  if (attempt143.current_index !== 0 || attempt143.status !== 'in_progress') {
    throw new Error(
      `Attempt 143 unexpected state: status=${attempt143.status} index=${attempt143.current_index}`,
    )
  }
  for (const exercise of attempt143.exercises) {
    if ('correct_answer' in exercise) {
      throw new Error('Attempt 143 exercise leaked correct_answer')
    }
  }

  const browser = await chromium.launch()
  const notes = []
  const first = attempt143.exercises[0]
  const mcExercise = attempt143.exercises.find((e) => e.type === 'multiple_choice')
  if (!mcExercise) throw new Error('No multiple_choice exercise in attempt 143')

  // Ready state + exit modal cancel (read-only against 143)
  await withPage(
    browser,
    { width: 390, height: 844, theme: 'light', reducedMotion: false },
    async (page) => {
      await page.route('**/api/lessons/143', async (route) => {
        if (route.request().method() !== 'GET') {
          await route.abort()
          return
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(attempt143),
        })
      })
      await page.route('**/api/lessons/143/**', (route) => route.abort())
      await page.goto(`${APP}/lesson/143`, { waitUntil: 'networkidle' })
      await page.getByRole('heading', { name: first.prompt }).waitFor()
      await capture(page, '390x844-light_ready.png', notes, {
        state: 'ready',
      })
      await page.getByRole('button', { name: /Exit/i }).click()
      await page.getByRole('dialog').waitFor()
      await capture(page, '390x844-light_exit-modal.png', notes, {
        state: 'exit-modal',
      })
      await page.getByRole('button', { name: /Keep learning/i }).click()
    },
  )

  // Correct / incorrect feedback via mocked attempt id 9201
  const demoAttempt = mockAttempt(attempt143, {
    attempt_id: 9201,
    skill_title: 'Food',
    hearts: 3,
    max_hearts: 5,
    current_index: mcExercise.position,
    exercises: attempt143.exercises,
  })

  for (const theme of ['light', 'dark']) {
    for (const vp of viewports) {
      if (theme === 'dark' && vp.width === 320) continue
      await withPage(
        browser,
        { ...vp, theme, reducedMotion: false },
        async (page) => {
          await page.route('**/api/lessons/9201', async (route) => {
            if (route.request().method() !== 'GET') return route.abort()
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(demoAttempt),
            })
          })
          await page.route('**/api/lessons/9201/answer', async (route) => {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                attempt_id: 9201,
                exercise_id: mcExercise.id,
                position: mcExercise.position,
                is_correct: true,
                correct_answer: { option_id: mcExercise.options[0].id },
                current_index: mcExercise.position + 1,
                total_exercises: demoAttempt.total_exercises,
                mistakes_count: 0,
                hearts_remaining: 3,
                max_hearts: 5,
                next_heart_at: null,
                lesson_status: 'in_progress',
                can_complete: false,
              }),
            })
          })

          await page.goto(`${APP}/lesson/9201`, { waitUntil: 'networkidle' })
          await page.getByRole('heading', { name: mcExercise.prompt }).waitFor()
          await page.getByRole('radio').nth(0).click()
          await page.getByRole('button', { name: 'Check' }).click()
          await page.getByRole('button', { name: 'Continue' }).waitFor()
          await page.waitForTimeout(450)
          await capture(
            page,
            `${vp.name}-${theme}_correct-feedback.png`,
            notes,
            { state: 'correct-feedback', theme, viewport: vp.name },
          )
        },
      )

      await withPage(
        browser,
        { ...vp, theme, reducedMotion: false },
        async (page) => {
          await page.route('**/api/lessons/9201', async (route) => {
            if (route.request().method() !== 'GET') return route.abort()
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ ...demoAttempt, hearts: 1 }),
            })
          })
          await page.route('**/api/lessons/9201/answer', async (route) => {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                attempt_id: 9201,
                exercise_id: mcExercise.id,
                position: mcExercise.position,
                is_correct: false,
                correct_answer: { option_id: mcExercise.options[0].id },
                current_index: mcExercise.position,
                total_exercises: demoAttempt.total_exercises,
                mistakes_count: 1,
                hearts_remaining: 0,
                max_hearts: 5,
                next_heart_at: null,
                lesson_status: 'failed',
                can_complete: false,
              }),
            })
          })
          await page.route('**/api/hearts/refill', async (route) => {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                hearts: 5,
                max_hearts: 5,
                gems: 80,
                gems_spent: 20,
                next_heart_at: null,
              }),
            })
          })

          await page.goto(`${APP}/lesson/9201`, { waitUntil: 'networkidle' })
          await page.getByRole('heading', { name: mcExercise.prompt }).waitFor()
          await page.getByRole('radio').nth(1).click()
          await page.getByRole('button', { name: 'Check' }).click()
          await page.getByRole('heading', { name: 'Out of hearts' }).waitFor()
          await capture(
            page,
            `${vp.name}-${theme}_out-of-hearts.png`,
            notes,
            { state: 'out-of-hearts', theme, viewport: vp.name },
          )
        },
      )
    }
  }

  // Long incorrect solution at mobile
  await withPage(
    browser,
    { width: 390, height: 844, theme: 'light', reducedMotion: false },
    async (page) => {
      const longMc = {
        id: 99001,
        position: 0,
        type: 'multiple_choice',
        prompt: 'Choose the longest translation for this quest line',
        audio_url: null,
        tts_text: null,
        tts_lang: null,
        metadata: null,
        options: [
          {
            id: 'a',
            text: 'A very long correct solution that wraps across multiple lines on a narrow phone so learners can still read it',
          },
          { id: 'b', text: 'Short wrong' },
        ],
      }
      const longAttempt = {
        ...demoAttempt,
        hearts: 4,
        current_index: 0,
        total_exercises: 1,
        exercises: [longMc],
      }
      await page.route('**/api/lessons/9202', async (route) => {
        if (route.request().method() !== 'GET') return route.abort()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...longAttempt, attempt_id: 9202 }),
        })
      })
      await page.route('**/api/lessons/9202/answer', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            attempt_id: 9202,
            exercise_id: longMc.id,
            position: 0,
            is_correct: false,
            correct_answer: { option_id: 'a' },
            current_index: 0,
            total_exercises: 1,
            mistakes_count: 1,
            hearts_remaining: 3,
            max_hearts: 5,
            next_heart_at: null,
            lesson_status: 'in_progress',
            can_complete: false,
          }),
        })
      })
      await page.goto(`${APP}/lesson/9202`, { waitUntil: 'networkidle' })
      await page.getByRole('radio', { name: 'Short wrong' }).click()
      await page.getByRole('button', { name: 'Check' }).click()
      await page.getByRole('button', { name: 'Continue' }).waitFor()
      await page.waitForTimeout(450)
      await capture(page, '390x844-light_incorrect-long-solution.png', notes, {
        state: 'incorrect-long',
      })
    },
  )

  // Completion results (perfect + achievements)
  for (const theme of ['light', 'dark']) {
    for (const reducedMotion of [false, true]) {
      if (theme === 'dark' && reducedMotion) continue
      await withPage(
        browser,
        { width: 390, height: 844, theme, reducedMotion },
        async (page) => {
          const completed = mockAttempt(attempt143, {
            attempt_id: 9203,
            status: 'completed',
            current_index: attempt143.total_exercises,
            terminal_summary: null,
          })
          await page.route('**/api/lessons/9203', async (route) => {
            if (route.request().method() !== 'GET') return route.abort()
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                ...completed,
                status: 'in_progress',
                current_index: completed.total_exercises - 1,
              }),
            })
          })
          const last = completed.exercises[completed.exercises.length - 1]
          await page.route('**/api/lessons/9203/answer', async (route) => {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                attempt_id: 9203,
                exercise_id: last.id,
                position: last.position,
                is_correct: true,
                correct_answer:
                  last.type === 'type_answer'
                    ? { accepted: ['ok'] }
                    : last.type === 'fill_blank'
                      ? { text: 'ok' }
                      : last.type === 'multiple_choice'
                        ? { option_id: last.options[0].id }
                        : last.type === 'translate_word_bank'
                          ? { ordered_ids: last.options.slice(0, 2).map((o) => o.id) }
                          : {
                              pairs: last.options.left.map((l, i) => ({
                                left_id: l.id,
                                right_id: last.options.right[i].id,
                              })),
                            },
                current_index: completed.total_exercises,
                total_exercises: completed.total_exercises,
                mistakes_count: 0,
                hearts_remaining: 5,
                max_hearts: 5,
                next_heart_at: null,
                lesson_status: 'in_progress',
                can_complete: true,
              }),
            })
          })
          await page.route('**/api/lessons/9203/complete', async (route) => {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                attempt_id: 9203,
                skill: {
                  id: 3,
                  title: 'Food',
                  new_crowns: 2,
                  max_level: 5,
                  status: 'in_progress',
                },
                xp: {
                  base: 10,
                  perfect_bonus: 5,
                  earned: 15,
                  perfect: true,
                },
                streak: {
                  current: 7,
                  longest: 11,
                  extended_today: true,
                  activity_date: '2026-07-19',
                },
                daily_goal: {
                  today_xp: 25,
                  goal_xp: 20,
                  progress: 1,
                  reached: true,
                },
                unlocked_skill_ids: [],
                achievements_unlocked: [
                  {
                    key: 'first_lesson',
                    title: 'First Steps',
                    description: 'Complete your first lesson',
                    icon: 'star',
                  },
                ],
                user_totals: {
                  total_xp: 355,
                  hearts: 5,
                  max_hearts: 5,
                  gems: 100,
                },
                completed_at: '2026-07-19T12:00:00Z',
              }),
            })
          })

          // Load completed surface directly via terminal retrieve for reliable capture
          await page.unroute('**/api/lessons/9203')
          await page.route('**/api/lessons/9203', async (route) => {
            if (route.request().method() !== 'GET') return route.abort()
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                ...completed,
                status: 'completed',
                terminal_summary: {
                  outcome: 'completed',
                  xp_earned: 15,
                  perfect: true,
                  completed_at: '2026-07-19T12:00:00Z',
                },
              }),
            })
          })

          await page.goto(`${APP}/lesson/9203`, { waitUntil: 'networkidle' })
          await page
            .getByRole('heading', { name: 'Lesson complete!' })
            .waitFor({ timeout: 10_000 })
          const suffix = reducedMotion ? 'reduced-motion' : theme
          await capture(
            page,
            `390x844-${suffix}_results.png`,
            notes,
            { state: 'results', theme, reducedMotion },
          )
        },
      )
    }
  }

  // Fresh completion with full stats (inject via answer path using single-exercise attempt)
  await withPage(
    browser,
    { width: 1440, height: 900, theme: 'light', reducedMotion: false },
    async (page) => {
      const single = {
        ...demoAttempt,
        attempt_id: 9204,
        current_index: 0,
        total_exercises: 1,
        exercises: [{ ...mcExercise, position: 0 }],
      }
      await page.route('**/api/lessons/9204', async (route) => {
        if (route.request().method() !== 'GET') return route.abort()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(single),
        })
      })
      await page.route('**/api/lessons/9204/answer', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            attempt_id: 9204,
            exercise_id: mcExercise.id,
            position: 0,
            is_correct: true,
            correct_answer: { option_id: mcExercise.options[0].id },
            current_index: 1,
            total_exercises: 1,
            mistakes_count: 0,
            hearts_remaining: 5,
            max_hearts: 5,
            next_heart_at: null,
            lesson_status: 'in_progress',
            can_complete: true,
          }),
        })
      })
      await page.route('**/api/lessons/9204/complete', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            attempt_id: 9204,
            skill: {
              id: 3,
              title: 'Food',
              new_crowns: 1,
              max_level: 5,
              status: 'in_progress',
            },
            xp: { base: 10, perfect_bonus: 5, earned: 15, perfect: true },
            streak: {
              current: 7,
              longest: 11,
              extended_today: true,
              activity_date: '2026-07-19',
            },
            daily_goal: {
              today_xp: 25,
              goal_xp: 20,
              progress: 1,
              reached: true,
            },
            unlocked_skill_ids: [],
            achievements_unlocked: [
              {
                key: 'first_lesson',
                title: 'First Steps',
                description: 'Complete your first lesson',
                icon: 'star',
              },
              {
                key: 'streak_3',
                title: 'On a Roll',
                description: 'Keep a 3-day streak',
                icon: 'flame',
              },
            ],
            user_totals: {
              total_xp: 355,
              hearts: 5,
              max_hearts: 5,
              gems: 100,
            },
            completed_at: '2026-07-19T12:00:00Z',
          }),
        })
      })
      await page.goto(`${APP}/lesson/9204`, { waitUntil: 'networkidle' })
      await page.getByRole('radio').nth(0).click()
      await page.getByRole('button', { name: 'Check' }).click()
      await page.getByRole('button', { name: 'Finish lesson' }).click()
      await page.getByRole('heading', { name: 'Lesson complete!' }).waitFor()
      await page.waitForTimeout(500)
      await capture(page, '1440x900-light_perfect-results.png', notes, {
        state: 'perfect-results',
      })
      await page.setViewportSize({ width: 390, height: 844 })
      await capture(page, '390x844-light_perfect-results-achievements.png', notes, {
        state: 'perfect-results-mobile',
      })
    },
  )

  // 200% zoom approximation via smaller CSS viewport
  await withPage(
    browser,
    { width: 720, height: 450, theme: 'light', reducedMotion: false },
    async (page) => {
      await page.route('**/api/lessons/9205', async (route) => {
        if (route.request().method() !== 'GET') return route.abort()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...demoAttempt,
            attempt_id: 9205,
            status: 'failed',
            hearts: 0,
            terminal_summary: {
              outcome: 'failed',
              xp_earned: 0,
              perfect: false,
              failure_reason: 'out_of_hearts',
              completed_at: '2026-07-19T11:00:00Z',
            },
          }),
        })
      })
      await page.goto(`${APP}/lesson/9205`, { waitUntil: 'networkidle' })
      await page.getByRole('heading', { name: 'Out of hearts' }).waitFor()
      await page.evaluate(() => {
        document.body.style.zoom = '2'
      })
      await capture(page, '720x450-light_out-of-hearts-200pct.png', notes, {
        state: 'out-of-hearts-200pct',
      })
    },
  )

  const verify = await fetch(`${API}/api/lessons/143`).then((r) => r.json())
  writeFileSync(
    join(outDir, 'summary.json'),
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        attempt143: {
          status: verify.status,
          current_index: verify.current_index,
          unchanged:
            verify.status === 'in_progress' && verify.current_index === 0,
        },
        notes,
      },
      null,
      2,
    ),
  )

  await browser.close()
  console.log(
    `Done. Attempt 143 unchanged=${verify.status === 'in_progress' && verify.current_index === 0}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
