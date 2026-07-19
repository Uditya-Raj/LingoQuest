/**
 * Phase 11A profile / leaderboard / settings visual QA.
 * Live GET routes are read-only. Error/empty fixtures use route mocks.
 * Does not PATCH the development user or mutate attempt 143.
 */

import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', '..', 'qa-screenshots', 'phase11a')
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
    localStorage.setItem('lingoquest-ui', JSON.stringify({ state: { theme: value }, version: 0 }))
    const dark =
      value === 'dark' ||
      (value === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
  }, theme)
}

async function waitReady(page, text) {
  await page.getByRole('heading', { name: text }).waitFor({ timeout: 15000 })
}

async function main() {
  const browser = await chromium.launch()

  // Profile desktop light
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })
    const page = await context.newPage()
    await setTheme(page, 'light')
    await page.goto(`${APP}/profile`, { waitUntil: 'networkidle' })
    await waitReady(page, 'Maya')
    await capture(page, 'profile-desktop-light.png', { route: '/profile', theme: 'light' })
    await page.locator('#achievements-heading').scrollIntoViewIfNeeded()
    await capture(page, 'profile-achievements-desktop-light.png', {
      route: '/profile#achievements',
    })
    await context.close()
  }

  // Profile desktop dark
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })
    const page = await context.newPage()
    await setTheme(page, 'dark')
    await page.goto(`${APP}/profile`, { waitUntil: 'networkidle' })
    await waitReady(page, 'Maya')
    await capture(page, 'profile-desktop-dark.png', { route: '/profile', theme: 'dark' })
    await context.close()
  }

  // Profile mobile light/dark
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
    })
    const page = await context.newPage()
    await setTheme(page, theme)
    await page.goto(`${APP}/profile`, { waitUntil: 'networkidle' })
    await waitReady(page, 'Maya')
    await capture(page, `profile-mobile-${theme}.png`, { route: '/profile', theme })
    await context.close()
  }

  // Profile long-name + error fixtures (mocked)
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
    })
    const page = await context.newPage()
    await setTheme(page, 'light')
    await page.route('**/api/user/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 3,
            username: 'maya_demo_with_a_very_long_username_value',
            display_name: 'Maya Extremely-Long-Explorer-Name-For-Wrapping',
            email: null,
            joined_at: '2026-06-01T08:00:00Z',
            active_course: { id: 1, title: 'Spanish', icon: 'spanish-course' },
          },
          stats: {
            total_xp: 1234567,
            today_xp: 10,
            daily_goal_xp: 20,
            daily_goal_progress: 0.5,
            current_streak: 999,
            longest_streak: 999,
            hearts: 4,
            max_hearts: 5,
            gems: 100,
            skills_completed: 2,
            lessons_completed: 24,
            perfect_lessons: 6,
          },
          achievements: [],
        }),
      })
    })
    await page.route('**/api/achievements', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ achievements: [] }),
      })
    })
    await page.goto(`${APP}/profile`, { waitUntil: 'networkidle' })
    await waitReady(page, 'Maya Extremely-Long-Explorer-Name-For-Wrapping')
    await capture(page, 'profile-long-name-mobile.png', { fixture: 'long-name' })
    await context.close()
  }

  {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    })
    const page = await context.newPage()
    await setTheme(page, 'light')
    await page.route('**/api/user/me', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'SERVICE_UNAVAILABLE', message: 'Profile temporarily unavailable.' },
        }),
      })
    })
    await page.goto(`${APP}/profile`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'Could not load profile' }).waitFor()
    await capture(page, 'profile-error-tablet.png', { fixture: 'error' })
    await context.close()
  }

  // Leaderboard desktop/mobile/dark + empty
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })
    const page = await context.newPage()
    await setTheme(page, 'light')
    await page.goto(`${APP}/leaderboard`, { waitUntil: 'networkidle' })
    await waitReady(page, 'Leaderboard')
    await capture(page, 'leaderboard-desktop-light.png', { route: '/leaderboard' })
    await context.close()
  }

  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
    })
    const page = await context.newPage()
    await setTheme(page, 'dark')
    await page.goto(`${APP}/leaderboard`, { waitUntil: 'networkidle' })
    await waitReady(page, 'Leaderboard')
    await capture(page, 'leaderboard-mobile-dark.png', { route: '/leaderboard', theme: 'dark' })
    await context.close()
  }

  {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    })
    const page = await context.newPage()
    await setTheme(page, 'light')
    await page.route('**/api/leaderboard**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ranking_basis: 'total_xp',
          entries: [],
          current_user: {
            rank: 1,
            user_id: 3,
            display_name: 'Maya',
            total_xp: 0,
            current_streak: 0,
            is_current_user: true,
          },
        }),
      })
    })
    await page.goto(`${APP}/leaderboard`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'No rankings yet' }).waitFor()
    await capture(page, 'leaderboard-empty.png', { fixture: 'empty' })
    await context.close()
  }

  // Settings desktop/mobile, dirty, coming soon, zoom
  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })
    const page = await context.newPage()
    await setTheme(page, 'light')
    await page.goto(`${APP}/settings`, { waitUntil: 'networkidle' })
    await waitReady(page, 'Settings')
    await capture(page, 'settings-desktop-light.png', { route: '/settings' })
    await page.getByLabel('Display name').fill('Maya Quest Draft')
    await capture(page, 'settings-dirty-desktop.png', { state: 'dirty' })
    await page.getByLabel('Daily goal (XP)').fill('2')
    await capture(page, 'settings-validation-desktop.png', { state: 'validation' })
    await page.locator('#coming-soon-heading').scrollIntoViewIfNeeded()
    await capture(page, 'settings-coming-soon-desktop.png', { section: 'coming-soon' })
    await context.close()
  }

  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
    })
    const page = await context.newPage()
    await setTheme(page, 'dark')
    await page.goto(`${APP}/settings`, { waitUntil: 'networkidle' })
    await waitReady(page, 'Settings')
    await capture(page, 'settings-mobile-dark.png', { route: '/settings', theme: 'dark' })
    await context.close()
  }

  {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    })
    const page = await context.newPage()
    await setTheme(page, 'light')
    await page.goto(`${APP}/settings`, { waitUntil: 'networkidle' })
    await waitReady(page, 'Settings')
    await page.evaluate(() => {
      document.body.style.zoom = '2'
    })
    await capture(page, 'settings-200pct-zoom.png', { zoom: '200%' })
    await context.close()
  }

  // Narrow 320 profile
  {
    const context = await browser.newContext({
      viewport: { width: 320, height: 720 },
      isMobile: true,
    })
    const page = await context.newPage()
    await setTheme(page, 'light')
    await page.goto(`${APP}/profile`, { waitUntil: 'networkidle' })
    await waitReady(page, 'Maya')
    await capture(page, 'profile-320-light.png', { width: 320 })
    await context.close()
  }

  writeFileSync(join(outDir, 'notes.json'), JSON.stringify(notes, null, 2))
  console.log(`Wrote ${notes.length} captures to ${outDir}`)
  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
