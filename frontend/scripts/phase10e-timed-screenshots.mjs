/**
 * Phase 10E timed-practice visual QA via Playwright route mocks.
 * Does not mutate the live backend or attempt 143.
 */

import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', '..', 'qa-screenshots', 'phase10e')
mkdirSync(outDir, { recursive: true })

const APP = 'http://127.0.0.1:3000'
const notes = []

const baseExercise = {
  id: 501,
  position: 0,
  type: 'multiple_choice',
  prompt: 'Select hello',
  audio_url: null,
  tts_text: 'hola',
  tts_lang: 'es-ES',
  metadata: null,
  options: [
    { id: 'a', text: 'Hello' },
    { id: 'b', text: 'Goodbye' },
  ],
}

function timedAttempt(overrides = {}) {
  const remaining = overrides.remaining_seconds ?? 90
  return {
    attempt_id: 9100,
    skill_id: 3,
    lesson_id: 3,
    skill_title: 'Food',
    status: 'in_progress',
    mode: 'timed',
    expires_at: new Date(Date.now() + remaining * 1000).toISOString(),
    remaining_seconds: remaining,
    resumed: false,
    started_at: new Date().toISOString(),
    completed_at: null,
    current_index: 0,
    total_exercises: 2,
    hearts: 5,
    max_hearts: 5,
    next_heart_at: null,
    mistakes_count: 0,
    exercises: [baseExercise, { ...baseExercise, id: 502, position: 1 }],
    terminal_summary: null,
    ...overrides,
  }
}

async function capture(page, filename, meta = {}) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
  )
  await page.screenshot({ path: join(outDir, filename), fullPage: false })
  notes.push({ filename, overflow, ...meta })
  console.log(`Captured ${filename} overflow=${overflow}`)
}

async function mockAttempt(page, attempt) {
  await page.route('**/api/lessons/**', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(attempt),
      })
      return
    }
    await route.continue()
  })
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const results = { ok: true, issues: [] }

  try {
    // Normal countdown desktop light
    {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        colorScheme: 'light',
      })
      const page = await context.newPage()
      await mockAttempt(page, timedAttempt({ remaining_seconds: 95 }))
      await page.goto(`${APP}/lesson/9100`, { waitUntil: 'networkidle' })
      await page.getByText('Timed Practice').first().waitFor()
      await capture(page, 'timed-normal-1280-light.png', { state: 'normal' })
      await context.close()
    }

    // Warning + critical via remaining_seconds
    for (const [label, remaining, width, scheme] of [
      ['warning', 25, 390, 'light'],
      ['critical', 8, 320, 'dark'],
      ['checking', 0, 1280, 'light'],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height: 844 },
        colorScheme: scheme,
      })
      const page = await context.newPage()
      await mockAttempt(
        page,
        timedAttempt({
          remaining_seconds: remaining,
          status: remaining === 0 ? 'in_progress' : 'in_progress',
        }),
      )
      // For checking: GET at 0 may stay in_progress; UI shows checking briefly.
      await page.goto(`${APP}/lesson/9100`, { waitUntil: 'networkidle' })
      await page.getByText('Timed Practice').first().waitFor({ timeout: 8000 })
      await page.waitForTimeout(400)
      await capture(page, `timed-${label}-${width}-${scheme}.png`, {
        state: label,
      })
      await context.close()
    }

    // Time-expired modal
    {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        colorScheme: 'light',
      })
      const page = await context.newPage()
      await mockAttempt(
        page,
        timedAttempt({
          status: 'failed',
          remaining_seconds: 0,
          terminal_summary: {
            outcome: 'failed',
            xp_earned: 0,
            perfect: false,
            failure_reason: 'time_expired',
            completed_at: new Date().toISOString(),
          },
        }),
      )
      await page.goto(`${APP}/lesson/9100`, { waitUntil: 'networkidle' })
      await page.getByRole('heading', { name: /Time's up/i }).waitFor()
      await capture(page, 'timed-expired-modal-390.png', { state: 'expired' })
      await context.close()
    }

    // Timed success
    {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        colorScheme: 'light',
      })
      const page = await context.newPage()
      let stage = 'ready'
      await page.route('**/api/lessons/**', async (route) => {
        const url = route.request().url()
        const method = route.request().method()
        if (method === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(
              timedAttempt({
                remaining_seconds: 70,
                total_exercises: 1,
                exercises: [baseExercise],
              }),
            ),
          })
          return
        }
        if (method === 'POST' && url.includes('/answer')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              attempt_id: 9100,
              exercise_id: 501,
              position: 0,
              is_correct: true,
              correct_answer: { option_id: 'a' },
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
          stage = 'answered'
          return
        }
        if (method === 'POST' && url.includes('/complete')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              attempt_id: 9100,
              skill: {
                id: 3,
                title: 'Food',
                new_crowns: 1,
                max_level: 5,
                status: 'in_progress',
              },
              xp: { base: 20, perfect_bonus: 0, earned: 20, perfect: false },
              streak: {
                current: 7,
                longest: 11,
                extended_today: true,
                activity_date: '2026-07-19',
              },
              daily_goal: {
                today_xp: 40,
                goal_xp: 20,
                progress: 1,
                reached: true,
              },
              unlocked_skill_ids: [],
              achievements_unlocked: [
                {
                  key: 'speed_star',
                  title: 'Speed Star',
                  description: 'Finish a Timed Practice',
                  icon: 'timer',
                },
              ],
              user_totals: {
                total_xp: 375,
                hearts: 5,
                max_hearts: 5,
                gems: 100,
              },
              completed_at: new Date().toISOString(),
            }),
          })
          stage = 'completed'
          return
        }
        await route.continue()
      })
      await page.goto(`${APP}/lesson/9100`, { waitUntil: 'networkidle' })
      await page.getByRole('radio', { name: 'Hello' }).click()
      await page.getByRole('button', { name: 'Check' }).click()
      await page.getByRole('button', { name: /Finish lesson/i }).click()
      await page
        .getByRole('heading', { name: 'Timed Practice complete' })
        .waitFor()
      await capture(page, 'timed-success-achievement-1280.png', {
        state: 'success',
        stage,
      })
      await context.close()
    }

    // Reduced motion critical
    {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        colorScheme: 'light',
        reducedMotion: 'reduce',
      })
      const page = await context.newPage()
      await mockAttempt(page, timedAttempt({ remaining_seconds: 5 }))
      await page.goto(`${APP}/lesson/9100`, { waitUntil: 'networkidle' })
      await page.getByText('Timed Practice').first().waitFor()
      await capture(page, 'timed-critical-reduced-motion-390.png', {
        state: 'critical-reduced',
      })
      await context.close()
    }

    // 200% zoom approx via smaller CSS pixels / larger layout
    {
      const context = await browser.newContext({
        viewport: { width: 360, height: 640 },
        deviceScaleFactor: 2,
      })
      const page = await context.newPage()
      await page.addInitScript(() => {
        document.documentElement.style.zoom = '2'
      })
      await mockAttempt(page, timedAttempt({ remaining_seconds: 40 }))
      await page.goto(`${APP}/lesson/9100`, { waitUntil: 'networkidle' })
      await page.getByText('Timed Practice').first().waitFor()
      await capture(page, 'timed-200pct-zoom-360.png', { state: 'zoom' })
      const overflow = notes[notes.length - 1]?.overflow
      if (overflow) {
        results.ok = false
        results.issues.push('horizontal overflow at 200% zoom capture')
      }
      await context.close()
    }
  } catch (err) {
    results.ok = false
    results.issues.push(String(err))
    console.error(err)
  } finally {
    await browser.close()
  }

  writeFileSync(join(outDir, 'notes.json'), JSON.stringify({ notes, results }, null, 2))
  console.log(JSON.stringify(results, null, 2))
  if (!results.ok) process.exit(1)
}

main()
