/**
 * Phase 12 teardown: assert dev DB untouched, remove temp DB directory.
 * Playwright stops webServer processes; we only clean the temp database.
 */
import { existsSync, rmSync, statSync, unlinkSync } from 'node:fs'
import { E2E_STATE_PATH, loadE2EState } from './env'

export default async function globalTeardown(): Promise<void> {
  if (!existsSync(E2E_STATE_PATH)) {
    console.log('[e2e] No state file — nothing to tear down')
    return
  }

  const state = loadE2EState() as ReturnType<typeof loadE2EState> & {
    devDbPath?: string
    devDbBefore?: { size: number; mtimeMs: number } | null
    tempDir?: string
  }

  if (state.devDbBefore && state.devDbPath && existsSync(state.devDbPath)) {
    const st = statSync(state.devDbPath)
    if (
      st.size !== state.devDbBefore.size ||
      st.mtimeMs !== state.devDbBefore.mtimeMs
    ) {
      console.error(
        '[e2e] WARNING: development lingopath.db mtime/size changed during E2E',
      )
    } else {
      console.log('[e2e] Development DB untouched')
    }
  }

  if (state.tempDir && existsSync(state.tempDir)) {
    try {
      rmSync(state.tempDir, { recursive: true, force: false })
      console.log('[e2e] Removed temp DB dir', state.tempDir)
    } catch (err) {
      console.warn('[e2e] Could not remove temp dir (non-fatal):', err)
    }
  }

  try {
    unlinkSync(E2E_STATE_PATH)
  } catch {
    // ignore
  }
}
