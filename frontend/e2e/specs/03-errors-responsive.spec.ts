/**
 * Phase 12 — Error recovery + baseline responsive checks.
 */
import { test, expect } from '@playwright/test'
import { createApiContext, freezeSeedClock } from '../helpers/api'
import { attachConsoleGuard } from '../helpers/console'
import { loadE2EState } from '../env'

test.describe('Phase 12 errors and responsive baseline', () => {
  test('unknown skill and unknown attempt show accessible errors', async ({
    page,
  }) => {
    const guard = attachConsoleGuard(page, {
      allowFailedUrls: [/\/skills\/99999/, /\/lessons\/999999/],
    })
    await page.goto('/skill/99999')
    await expect(page.getByText(/not found|unable|error|retry/i).first()).toBeVisible({
      timeout: 15_000,
    })

    await page.goto('/lesson/999999')
    await expect(page.getByText(/not found|unable|error|retry/i).first()).toBeVisible({
      timeout: 15_000,
    })
    guard.assertClean()
  })

  test('backend unavailable GET shows retry, then recovers', async ({ page }) => {
    const state = loadE2EState()
    const guard = attachConsoleGuard(page, {
      allowFailedUrls: [new RegExp(state.apiBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))],
    })

    await page.route('**/api/course', (route) => route.abort('failed'))
    await page.goto('/learn')
    await expect(page.getByText(/unable|error|retry|connection/i).first()).toBeVisible({
      timeout: 15_000,
    })
    await page.unroute('**/api/course')
    await page.getByRole('button', { name: /Retry/i }).click()
    await expect(
      page.getByRole('list', { name: 'Learning path units' }),
    ).toBeVisible({ timeout: 20_000 })
    guard.assertClean()
  })

  test('core screens usable at mobile 390×844', async ({ page }) => {
    const api = await createApiContext()
    await freezeSeedClock(api)
    await page.setViewportSize({ width: 390, height: 844 })
    const guard = attachConsoleGuard(page)

    for (const path of ['/', '/learn', '/profile', '/leaderboard', '/settings', '/admin/content']) {
      await page.goto(path)
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 2,
      )
      expect(overflow, `horizontal overflow on ${path}`).toBe(false)
    }

    await page.goto('/learn')
    await expect(
      page.getByRole('list', { name: 'Learning path units' }),
    ).toBeVisible()
    await page.getByRole('link', { name: /Family,/ }).click({ force: true })
    await expect(page.getByRole('heading', { name: 'Family' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(
      page.getByRole('button', { name: /Start Lesson|Resume Lesson|Timed Practice/i }).first(),
    ).toBeVisible()

    guard.assertClean()
    await api.dispose()
  })

  test('core screens usable at desktop 1440×900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const guard = attachConsoleGuard(page)
    await page.goto('/learn')
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 2,
    )
    expect(overflow).toBe(false)
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
    guard.assertClean()
  })
})
