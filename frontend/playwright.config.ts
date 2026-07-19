import { defineConfig, devices } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const STATE_PATH = join(__dirname, 'e2e/.e2e-stack.json')

/** Defaults used before prepare-db writes the state file (webServer + first boot). */
const DEFAULT_API = 'http://127.0.0.1:18080/api'
const DEFAULT_WEB = 'http://127.0.0.1:13000'

function readState(): { apiBaseUrl: string; frontendBaseUrl: string; dbUrl: string } {
  if (!existsSync(STATE_PATH)) {
    return {
      apiBaseUrl: DEFAULT_API,
      frontendBaseUrl: DEFAULT_WEB,
      dbUrl: '',
    }
  }
  return JSON.parse(readFileSync(STATE_PATH, 'utf8'))
}

const state = readState()

/**
 * Phase 12 browser E2E — isolated full stack.
 *
 * Journey specs that mutate learner state run serially (workers=1).
 * Seed/security checks are order-independent but share the same DB.
 */
export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    baseURL: state.frontendBaseUrl || DEFAULT_WEB,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 15_000,
    navigationTimeout: 90_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: [
    {
      command: 'node e2e/start-backend.mjs',
      url: `${(state.apiBaseUrl || DEFAULT_API).replace(/\/$/, '')}/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'node e2e/start-frontend.mjs',
      url: state.frontendBaseUrl || DEFAULT_WEB,
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
})
