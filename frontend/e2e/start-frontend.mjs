/**
 * Start Next.js dev server pointed at the isolated Phase 12 API.
 * Writes a temporary .env.local so NEXT_PUBLIC_* is inlined correctly (Windows-safe).
 */
import { spawn } from 'node:child_process'
import {
  readFileSync,
  existsSync,
  writeFileSync,
  renameSync,
  unlinkSync,
} from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const statePath = join(__dirname, '.e2e-stack.json')
const frontendDir = join(__dirname, '..')
const envLocal = join(frontendDir, '.env.local')
const envLocalBackup = join(frontendDir, '.env.local.e2e-backup')

if (!existsSync(statePath)) {
  console.error('Missing .e2e-stack.json — run global setup / prepare-db first')
  process.exit(1)
}

const state = JSON.parse(readFileSync(statePath, 'utf8'))

function restoreEnvLocal() {
  try {
    if (existsSync(envLocalBackup)) {
      if (existsSync(envLocal)) unlinkSync(envLocal)
      renameSync(envLocalBackup, envLocal)
    } else if (existsSync(envLocal)) {
      const contents = readFileSync(envLocal, 'utf8')
      if (contents.includes('LQ_E2E_GENERATED')) {
        unlinkSync(envLocal)
      }
    }
  } catch (err) {
    console.warn('[e2e] env.local restore warning:', err)
  }
}

if (existsSync(envLocal) && !existsSync(envLocalBackup)) {
  renameSync(envLocal, envLocalBackup)
}

writeFileSync(
  envLocal,
  [
    '# LQ_E2E_GENERATED — temporary file for Phase 12 Playwright stack',
    `NEXT_PUBLIC_API_BASE_URL=${state.apiBaseUrl}`,
    '',
  ].join('\n'),
  'utf8',
)

console.log('[e2e] frontend NEXT_PUBLIC_API_BASE_URL=', state.apiBaseUrl)

const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['next', 'dev', '-H', '127.0.0.1', '-p', String(state.frontendPort)],
  {
    cwd: frontendDir,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_BASE_URL: state.apiBaseUrl,
      PORT: String(state.frontendPort),
    },
    stdio: 'inherit',
    shell: true,
  },
)

const cleanup = () => {
  restoreEnvLocal()
}
child.on('exit', (code) => {
  cleanup()
  process.exit(code ?? 1)
})
process.on('SIGINT', () => {
  cleanup()
  child.kill('SIGINT')
})
process.on('SIGTERM', () => {
  cleanup()
  child.kill('SIGTERM')
})
