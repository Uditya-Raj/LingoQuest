/**
 * Start isolated FastAPI for Phase 12 using the prepared temp database.
 */
import { spawn } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const statePath = join(__dirname, '.e2e-stack.json')
const backendDir = join(__dirname, '../../backend')

if (!existsSync(statePath)) {
  console.error('Missing .e2e-stack.json — run global setup / prepare-db first')
  process.exit(1)
}

const state = JSON.parse(readFileSync(statePath, 'utf8'))
const py = process.platform === 'win32' ? 'python' : 'python3'

const child = spawn(
  py,
  [
    '-m',
    'uvicorn',
    'app.main:app',
    '--host',
    '127.0.0.1',
    '--port',
    String(state.backendPort),
  ],
  {
    cwd: backendDir,
    env: {
      ...process.env,
      DATABASE_URL: state.dbUrl,
      DEBUG_CLOCK_ENABLED: 'true',
      CORS_ORIGINS: state.frontendBaseUrl,
    },
    stdio: 'inherit',
    shell: true,
  },
)

child.on('exit', (code) => process.exit(code ?? 1))
process.on('SIGINT', () => child.kill('SIGINT'))
process.on('SIGTERM', () => child.kill('SIGTERM'))
