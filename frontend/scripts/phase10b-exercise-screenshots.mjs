/**
 * Phase 10B visual sanity — renders each exercise type from attempt 143 public
 * data via mocked retrieve responses. Never POSTs answers.
 */

import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', '..', 'qa-screenshots', 'phase10b')
mkdirSync(outDir, { recursive: true })

const API = 'http://127.0.0.1:8000'
const APP = 'http://127.0.0.1:3000'

const viewports = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '390x844', width: 390, height: 844 },
  { name: '320x568', width: 320, height: 568 },
]

async function main() {
  const response = await fetch(`${API}/api/lessons/143`)
  if (!response.ok) throw new Error(`Failed to load attempt 143: ${response.status}`)
  const attempt = await response.json()
  if (attempt.current_index !== 0 || attempt.status !== 'in_progress') {
    throw new Error(
      `Attempt 143 unexpected state: status=${attempt.status} index=${attempt.current_index}`,
    )
  }

  const byType = {}
  for (const exercise of attempt.exercises) {
    if (!byType[exercise.type]) byType[exercise.type] = exercise
  }
  const types = [
    'multiple_choice',
    'translate_word_bank',
    'match_pairs',
    'fill_blank',
    'type_answer',
  ]
  for (const type of types) {
    if (!byType[type]) throw new Error(`Missing type ${type} in attempt 143`)
  }

  const browser = await chromium.launch()
  const notes = []

  for (const type of types) {
    const exercise = byType[type]
    const mocked = {
      ...attempt,
      current_index: exercise.position,
      resumed: true,
    }

    for (const theme of ['light', 'dark']) {
      for (const vp of viewports) {
        // Skip dark at 320 to keep the pass bounded
        if (theme === 'dark' && vp.width === 320) continue

        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          colorScheme: theme === 'dark' ? 'dark' : 'light',
        })
        const page = await context.newPage()

        await page.route('**/api/lessons/143', async (route) => {
          if (route.request().method() !== 'GET') {
            await route.abort()
            return
          }
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mocked),
          })
        })
        await page.route('**/api/lessons/143/**', (route) => route.abort())

        if (theme === 'dark') {
          await page.addInitScript(() => {
            document.documentElement.classList.add('dark')
            localStorage.setItem(
              'ui-store',
              JSON.stringify({ state: { theme: 'dark' }, version: 0 }),
            )
          })
        }

        await page.goto(`${APP}/lesson/143`, { waitUntil: 'networkidle' })
        await page.getByRole('heading', { name: exercise.prompt }).waitFor({
          timeout: 10_000,
        })
        await page.waitForTimeout(400)

        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
        })

        const filename = `${vp.name}-${theme}_${type}.png`
        await page.screenshot({
          path: join(outDir, filename),
          fullPage: false,
        })
        notes.push({ filename, type, overflow, theme, viewport: vp.name })
        console.log(`Captured ${filename} overflow=${overflow}`)
        await context.close()
      }
    }
  }

  // Confirm real attempt unchanged
  const verify = await fetch(`${API}/api/lessons/143`).then((r) => r.json())
  writeFileSync(
    join(outDir, 'summary.json'),
    JSON.stringify(
      {
        notes,
        attemptAfter: {
          status: verify.status,
          current_index: verify.current_index,
          attempt_id: verify.attempt_id,
        },
      },
      null,
      2,
    ),
  )

  await browser.close()
  console.log(
    `Done. Attempt 143 after screenshots: status=${verify.status} index=${verify.current_index}`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
