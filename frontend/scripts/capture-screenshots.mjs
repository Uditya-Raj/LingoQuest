import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', '..', 'qa-screenshots', 'final')
mkdirSync(outDir, { recursive: true })

const BASE = 'http://localhost:3000'

const viewports = [
  { name: '1440x900-light', width: 1440, height: 900, dark: false },
  { name: '1440x900-dark', width: 1440, height: 900, dark: true },
  { name: '768x1024-light', width: 768, height: 1024, dark: false },
  { name: '390x844-light', width: 390, height: 844, dark: false },
  { name: '390x844-dark', width: 390, height: 844, dark: true },
  { name: '320x568-light', width: 320, height: 568, dark: false },
]

const pages = [
  { name: 'path', url: '/' },
  { name: 'skill-food', url: '/skill/3' }, // Food — in_progress, attempt 143
  { name: 'skill-available', url: '/skill/4' }, // Family — available
  { name: 'skill-locked', url: '/skill/5' }, // Questions — locked
]

async function run() {
  const browser = await chromium.launch()

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      colorScheme: vp.dark ? 'dark' : 'light',
    })

    for (const pg of pages) {
      const page = await context.newPage()

      if (vp.dark) {
        await page.addInitScript(() => {
          document.documentElement.classList.add('dark')
          localStorage.setItem('ui-store', JSON.stringify({ state: { theme: 'dark' }, version: 0 }))
        })
      }

      await page.goto(`${BASE}${pg.url}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(1500)

      if (vp.dark) {
        await page.evaluate(() => document.documentElement.classList.add('dark'))
        await page.waitForTimeout(300)
      }

      if (pg.name === 'path') {
        await page.evaluate(() => {
          const node = document.getElementById('current-skill-node')
          if (node) node.scrollIntoView({ block: 'center', behavior: 'instant' })
        })
        await page.waitForTimeout(500)
      }

      const filename = `${vp.name}_${pg.name}.png`
      // Viewport capture for path (avoids sticky-header mid-page artifacts from fullPage)
      await page.screenshot({ path: join(outDir, filename), fullPage: false })
      console.log(`Captured: ${filename}`)
      await page.close()
    }

    await context.close()
  }

  await browser.close()
  console.log(`Done! ${viewports.length * pages.length} screenshots saved to ${outDir}`)
}

run().catch(console.error)
