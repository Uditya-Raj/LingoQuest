/**
 * Prepare isolated SQLite for Phase 12 E2E (migrate + seed + verify).
 * Never touches backend/lingopath.db.
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '../..')
const backendDir = join(repoRoot, 'backend')
const DEV_DB = join(backendDir, 'lingopath.db')
const STATE_PATH = join(__dirname, '.e2e-stack.json')

export const E2E_BACKEND_PORT = 18080
export const E2E_FRONTEND_PORT = 13000
export const SEED_REFERENCE_DATE = '2026-07-18'
export const SEED_LOGICAL_NOW = '2026-07-18T00:05:00Z'
export const ALEMBIC_HEAD = 'c8a1f4e2b9d0'

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd ?? backendDir,
      env: { ...process.env, ...opts.env },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => {
      stdout += d.toString()
    })
    child.stderr.on('data', (d) => {
      stderr += d.toString()
    })
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr })
      else reject(new Error(`${cmd} ${args.join(' ')}\n${stderr || stdout}`))
    })
  })
}

async function verifySeed(dbPath, py) {
  const script = `
import sqlite3, sys
db = sys.argv[1]
conn = sqlite3.connect(db)
conn.execute("PRAGMA foreign_keys=ON")
cur = conn.cursor()
rev = cur.execute("SELECT version_num FROM alembic_version").fetchone()[0]
assert rev == "${ALEMBIC_HEAD}", rev
counts = {
  "courses": cur.execute("SELECT COUNT(*) FROM courses").fetchone()[0],
  "units": cur.execute("SELECT COUNT(*) FROM units").fetchone()[0],
  "skills": cur.execute("SELECT COUNT(*) FROM skills").fetchone()[0],
  "lessons": cur.execute("SELECT COUNT(*) FROM lessons").fetchone()[0],
  "exercises": cur.execute("SELECT COUNT(*) FROM exercises").fetchone()[0],
  "users": cur.execute("SELECT COUNT(*) FROM users").fetchone()[0],
  "usp": cur.execute("SELECT COUNT(*) FROM user_skill_progress").fetchone()[0],
  "attempts": cur.execute("SELECT COUNT(*) FROM lesson_attempts").fetchone()[0],
  "answers": cur.execute("SELECT COUNT(*) FROM exercise_answers").fetchone()[0],
  "achievements": cur.execute("SELECT COUNT(*) FROM achievements").fetchone()[0],
  "active": cur.execute("SELECT COUNT(*) FROM lesson_attempts WHERE status='in_progress'").fetchone()[0],
}
expected = {
  "courses": 1, "units": 3, "skills": 5, "lessons": 5, "exercises": 60,
  "users": 5, "usp": 25, "attempts": 142, "answers": 1420, "achievements": 6, "active": 0,
}
for k, v in expected.items():
  assert counts[k] == v, f"{k}: {counts[k]} != {v}"
assert cur.execute("PRAGMA foreign_key_check").fetchall() == []
types = {r[0] for r in cur.execute("SELECT DISTINCT type FROM exercises")}
assert types == {"multiple_choice","translate_word_bank","match_pairs","fill_blank","type_answer"}, types
for sid, in cur.execute("SELECT id FROM skills"):
  n = cur.execute(
    "SELECT COUNT(*) FROM exercises e JOIN lessons l ON e.lesson_id=l.id "
    "WHERE l.skill_id=? AND e.tts_text IS NOT NULL AND e.tts_lang IS NOT NULL",
    (sid,),
  ).fetchone()[0]
  assert n >= 3, f"skill {sid} TTS={n}"
maya = cur.execute("SELECT id, total_xp FROM users WHERE username='maya_demo'").fetchone()
sum_xp = cur.execute(
  "SELECT COALESCE(SUM(xp_earned),0) FROM lesson_attempts WHERE user_id=? AND status='completed'",
  (maya[0],),
).fetchone()[0]
assert maya[1] == sum_xp, f"Maya XP {maya[1]} != history {sum_xp}"
print("OK", counts)
conn.close()
`
  const tmpPy = join(dirname(dbPath), '_verify_seed.py')
  writeFileSync(tmpPy, script, 'utf8')
  await run(py, [tmpPy, dbPath.replace(/\\/g, '/')])
}

export async function prepareDatabase() {
  const py = process.platform === 'win32' ? 'python' : 'python3'
  const tempDir = mkdtempSync(join(tmpdir(), 'lq-e2e-'))
  const dbPath = join(tempDir, 'phase12.db')
  const dbUrl = `sqlite+aiosqlite:///${dbPath.replace(/\\/g, '/')}`

  if (
    existsSync(DEV_DB) &&
    dbPath.replace(/\\/g, '/').toLowerCase() ===
      DEV_DB.replace(/\\/g, '/').toLowerCase()
  ) {
    throw new Error('Refusing to use development database for E2E')
  }

  let devDbBefore = null
  if (existsSync(DEV_DB)) {
    const st = statSync(DEV_DB)
    devDbBefore = { size: st.size, mtimeMs: st.mtimeMs }
  }

  console.log('[e2e] Temp DB:', dbPath)

  await run(py, ['-m', 'alembic', 'upgrade', 'head'], {
    env: { DATABASE_URL: dbUrl },
  })
  await run(
    py,
    ['-m', 'app.seed.seed_data', '--reference-date', SEED_REFERENCE_DATE],
    { env: { DATABASE_URL: dbUrl } },
  )
  await run(
    py,
    ['-m', 'app.seed.seed_data', '--reference-date', SEED_REFERENCE_DATE],
    { env: { DATABASE_URL: dbUrl } },
  )
  await verifySeed(dbPath, py)

  const state = {
    tempDir,
    dbPath,
    dbUrl,
    backendPort: E2E_BACKEND_PORT,
    frontendPort: E2E_FRONTEND_PORT,
    apiBaseUrl: `http://127.0.0.1:${E2E_BACKEND_PORT}/api`,
    frontendBaseUrl: `http://127.0.0.1:${E2E_FRONTEND_PORT}`,
    seedReferenceDate: SEED_REFERENCE_DATE,
    seedLogicalNow: SEED_LOGICAL_NOW,
    openApiTitle: 'LingoQuest API',
    devDbPath: DEV_DB,
    devDbBefore,
  }
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8')
  return state
}

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith('prepare-db.mjs') ||
    process.argv[1].endsWith('prepare-db'))

if (isMain) {
  prepareDatabase()
    .then(() => {
      console.log('[e2e] prepare-db done')
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
