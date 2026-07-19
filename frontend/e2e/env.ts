/**
 * Shared Phase 12 E2E environment metadata written by global-setup.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export const E2E_STATE_PATH = join(__dirname, '.e2e-stack.json')

export interface E2EStackState {
  tempDir: string
  dbPath: string
  dbUrl?: string
  backendPort: number
  frontendPort: number
  apiBaseUrl: string
  frontendBaseUrl: string
  backendPid?: number
  frontendPid?: number
  seedReferenceDate: string
  seedLogicalNow: string
  openApiTitle: string
  devDbPath?: string
  devDbBefore?: { size: number; mtimeMs: number } | null
}

export function loadE2EState(): E2EStackState {
  if (!existsSync(E2E_STATE_PATH)) {
    throw new Error(
      `Missing ${E2E_STATE_PATH}. Run Playwright with globalSetup so the isolated stack starts.`,
    )
  }
  return JSON.parse(readFileSync(E2E_STATE_PATH, 'utf8')) as E2EStackState
}
