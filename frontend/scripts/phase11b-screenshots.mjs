/**
 * Phase 11B content manager visual QA (read-only against live API).
 * Does not POST/PATCH exercises. Does not mutate attempt 143.
 */

import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', '..', 'qa-screenshots', 'phase11b')
mkdirSync(outDir, { recursive: true })

const APP = 'http://127.0.0.1:3000'
const notes = []

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

async function setTheme(page, theme) {
  await page.addInitScript((value) => {
    localStorage.setItem(
      'lingoquest-ui',
      JSON.stringify({ state: { theme: value }, version: 0 }),
    )
    const dark =
      value === 'dark' ||
      (value === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
  }, theme)
}

async function openExercise(page, label) {
  await page.getByRole('treeitem', { name: label }).first().click()
  await page.getByRole('heading', { name: /Exercise #/ }).waitFor({
    timeout: 10000,
  })
}

async function main() {
  const browser = await chromium.launch()

  // Desktop light tree+editor
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })
    const page = await context.newPage()
    await setTheme(page, 'light')
    await page.goto(`${APP}/admin/content`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'Content manager' }).waitFor({
      timeout: 20000,
    })
    await capture(page, 'admin-desktop-tree-light.png', {
      route: '/admin/content',
      theme: 'light',
    })

    await openExercise(page, /Multiple choice/i)
    await capture(page, 'admin-mc-editor-desktop-light.png', {
      editor: 'multiple_choice',
    })

    await openExercise(page, /Word bank/i)
    await capture(page, 'admin-wb-editor-desktop-light.png', {
      editor: 'translate_word_bank',
    })

    await openExercise(page, /Match pairs/i)
    await capture(page, 'admin-mp-editor-desktop-light.png', {
      editor: 'match_pairs',
    })

    await openExercise(page, /Fill blank/i)
    await capture(page, 'admin-fb-editor-desktop-light.png', {
      editor: 'fill_blank',
    })

    await openExercise(page, /Type answer/i)
    await page.getByLabel('TTS text').scrollIntoViewIfNeeded()
    await capture(page, 'admin-ta-tts-desktop-light.png', {
      editor: 'type_answer',
      focus: 'tts',
    })

    // Unsaved modal
    await page.getByLabel('Prompt').fill('Unsaved draft for QA')
    await page.getByRole('treeitem', { name: /Multiple choice/i }).first().click()
    await page.getByRole('heading', { name: 'Discard unsaved changes?' }).waitFor()
    await capture(page, 'admin-unsaved-modal-desktop-light.png', {
      state: 'unsaved-guard',
    })
    await page.getByRole('button', { name: 'Keep editing' }).click()

    await context.close()
  }

  // Desktop dark
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })
    const page = await context.newPage()
    await setTheme(page, 'dark')
    await page.goto(`${APP}/admin/content`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'Content manager' }).waitFor()
    await openExercise(page, /Multiple choice/i)
    await capture(page, 'admin-desktop-dark.png', { theme: 'dark' })
    await context.close()
  }

  // Mobile list/detail 320
  {
    const context = await browser.newContext({
      viewport: { width: 320, height: 720 },
    })
    const page = await context.newPage()
    await setTheme(page, 'light')
    await page.goto(`${APP}/admin/content`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'Content manager' }).waitFor()
    await capture(page, 'admin-mobile-320-tree.png', { viewport: 320 })
    await page.getByRole('treeitem', { name: /Lesson 1,/i }).first().click()
    await page.getByRole('button', { name: 'Editor' }).click()
    await page.getByRole('heading', { name: 'Lesson exercises' }).waitFor()
    await capture(page, 'admin-mobile-320-lesson-detail.png', { viewport: 320 })
    await page.getByRole('button', { name: 'Content tree' }).click()
    await openExercise(page, /Multiple choice/i)
    await page.getByRole('heading', { name: /Exercise #/ }).waitFor()
    await capture(page, 'admin-mobile-320-mc.png', { viewport: 320 })
    await context.close()
  }

  // 200% zoom approx via smaller CSS viewport / deviceScale
  {
    const context = await browser.newContext({
      viewport: { width: 720, height: 450 },
      deviceScaleFactor: 2,
    })
    const page = await context.newPage()
    await setTheme(page, 'light')
    await page.goto(`${APP}/admin/content`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'Content manager' }).waitFor()
    await openExercise(page, /Match pairs/i)
    await capture(page, 'admin-zoom-200-match-pairs.png', { zoom: '200%' })
    await context.close()
  }

  // Forbidden state via route mock
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })
    const page = await context.newPage()
    await page.route('**/api/admin/content/tree', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'CONTENT_ADMIN_REQUIRED',
            message: 'Content administration requires admin permission',
          },
        }),
      })
    })
    await setTheme(page, 'light')
    await page.goto(`${APP}/admin/content`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'Access denied' }).waitFor()
    await capture(page, 'admin-access-denied.png', { state: 'forbidden' })
    await context.close()
  }

  // Active-attempt conflict mock while editing
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })
    const page = await context.newPage()
    await page.route('**/api/admin/exercises/*', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'CONTENT_IN_ACTIVE_ATTEMPT',
              message: 'Cannot edit an exercise referenced by an active attempt',
              details: { exercise_id: 1 },
            },
          }),
        })
        return
      }
      await route.continue()
    })
    await setTheme(page, 'light')
    await page.goto(`${APP}/admin/content`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'Content manager' }).waitFor()
    await openExercise(page, /Multiple choice/i)
    await page.getByLabel('Prompt').fill('Conflict draft QA')
    await page.getByRole('button', { name: 'Save changes' }).click()
    await page.getByRole('heading', { name: 'Active-attempt conflict' }).waitFor()
    await capture(page, 'admin-active-attempt-conflict.png', {
      state: 'conflict',
    })
    await context.close()
  }

  writeFileSync(join(outDir, 'notes.json'), JSON.stringify(notes, null, 2))
  console.log('Wrote', notes.length, 'screenshots to', outDir)
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
