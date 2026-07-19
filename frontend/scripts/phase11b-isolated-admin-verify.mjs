/**
 * Phase 11B isolated-backend verification.
 * Uses a temporary migrated/seeded SQLite DB. Does not mutate the development DB.
 * Does not touch attempt 143.
 *
 * Usage (from repo root, with backend venv available):
 *   node frontend/scripts/phase11b-isolated-admin-verify.mjs
 */

import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '../..')
const backendDir = join(repoRoot, 'backend')
const tempDir = mkdtempSync(join(tmpdir(), 'lq-11b-'))
const dbPath = join(tempDir, 'phase11b.db').replace(/\\/g, '/')

const VALID = {
  multiple_choice: {
    type: 'multiple_choice',
    prompt: '11B MC',
    options: [
      { id: 'a', text: 'Yes' },
      { id: 'b', text: 'No' },
    ],
    correct_answer: { option_id: 'a' },
    metadata: { hint: 'mc' },
  },
  translate_word_bank: {
    type: 'translate_word_bank',
    prompt: '11B WB',
    options: [
      { id: 'w1', text: 'I' },
      { id: 'w2', text: 'eat' },
      { id: 'w3', text: 'bread' },
    ],
    correct_answer: { ordered_ids: ['w1', 'w2', 'w3'] },
    metadata: null,
  },
  match_pairs: {
    type: 'match_pairs',
    prompt: '11B MP',
    options: {
      left: [
        { id: 'l1', text: 'agua' },
        { id: 'l2', text: 'pan' },
      ],
      right: [
        { id: 'r1', text: 'water' },
        { id: 'r2', text: 'bread' },
      ],
    },
    correct_answer: {
      pairs: [
        { left_id: 'l1', right_id: 'r1' },
        { left_id: 'l2', right_id: 'r2' },
      ],
    },
    metadata: null,
  },
  fill_blank: {
    type: 'fill_blank',
    prompt: 'Ella ___ estudiante.',
    options: null,
    correct_answer: { text: 'es' },
    metadata: { hint: 'ser' },
  },
  type_answer: {
    type: 'type_answer',
    prompt: 'Hello in Spanish',
    options: null,
    correct_answer: { accepted: ['hola', 'hello'] },
    metadata: null,
  },
}

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

async function waitForHealth(base, attempts = 40) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${base}/api/health`)
      if (res.ok) return
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('Server did not become healthy')
}

async function main() {
  const results = []
  const py = process.platform === 'win32' ? 'python' : 'python3'
  const dbUrl = `sqlite+aiosqlite:///${dbPath}`

  console.log('Temp DB:', dbPath)

  await run(py, ['-m', 'alembic', 'upgrade', 'head'], {
    env: { DATABASE_URL: dbUrl },
  })
  results.push('migrate: ok')

  await run(py, ['-m', 'app.seed.seed_data'], {
    env: { DATABASE_URL: dbUrl },
  })
  results.push('seed: ok')

  const server = spawn(
    py,
    ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8011'],
    {
      cwd: backendDir,
      env: {
        ...process.env,
        DATABASE_URL: dbUrl,
        DEBUG_TIME_TRAVEL: 'false',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    },
  )

  const base = 'http://127.0.0.1:8011'
  try {
    await waitForHealth(base)
    results.push('server: ok')

    const tree = await fetch(`${base}/api/admin/content/tree`)
    if (!tree.ok) throw new Error(`tree ${tree.status}`)
    const treeBody = await tree.json()
    if (!treeBody.courses?.length) throw new Error('empty tree')
    results.push(`tree: ${treeBody.courses[0].title}`)

    const createdIds = []
    let order = 500
    for (const [etype, payload] of Object.entries(VALID)) {
      const body = {
        lesson_id: 3,
        order_index: order++,
        audio_url: null,
        is_active: true,
        ...payload,
      }
      if (etype === 'type_answer') {
        body.tts_text = 'hola'
        body.tts_lang = 'es-ES'
      }
      const res = await fetch(`${base}/api/admin/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.status !== 201) {
        throw new Error(`create ${etype}: ${res.status} ${await res.text()}`)
      }
      const data = await res.json()
      if (data.correct_answer === undefined) {
        throw new Error(`${etype} missing correct_answer in admin response`)
      }
      createdIds.push(data.id)

      const patch = await fetch(`${base}/api/admin/exercises/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `${payload.prompt} edited` }),
      })
      if (!patch.ok) {
        throw new Error(`patch ${etype}: ${patch.status} ${await patch.text()}`)
      }
      const patched = await patch.json()
      if (patched.type !== etype) {
        throw new Error(`merged PATCH lost type for ${etype}`)
      }
      if (JSON.stringify(patched.correct_answer) !== JSON.stringify(payload.correct_answer)) {
        throw new Error(`merged PATCH lost correct_answer for ${etype}`)
      }
    }
    results.push(`create+edit five types: ${createdIds.join(',')}`)

    const partial = await fetch(`${base}/api/admin/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lesson_id: 3,
        order_index: order++,
        type: 'type_answer',
        prompt: 'partial tts',
        options: null,
        correct_answer: { accepted: ['hola'] },
        tts_text: 'hola',
        is_active: true,
      }),
    })
    if (partial.status !== 400) {
      throw new Error(`expected partial TTS 400, got ${partial.status}`)
    }
    const partialBody = await partial.json()
    if (partialBody.error?.code !== 'INVALID_EXERCISE_CONTRACT') {
      throw new Error('partial TTS wrong code')
    }
    results.push('partial TTS rejected')

    // Active-attempt protection on a freshly started attempt (not 143)
    await fetch(`${base}/api/user/me`) // warm
    const start = await fetch(`${base}/api/skills/3/start`, { method: 'POST' })
    if (![200, 201].includes(start.status)) {
      throw new Error(`start skill 3: ${start.status} ${await start.text()}`)
    }
    const attempt = await start.json()
    const exerciseId = attempt.exercises[0].id
    const attemptId = attempt.attempt_id ?? attempt.id
    const protectedPatch = await fetch(`${base}/api/admin/exercises/${exerciseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Should not apply' }),
    })
    if (protectedPatch.status !== 409) {
      throw new Error(`expected 409, got ${protectedPatch.status}`)
    }
    const conflict = await protectedPatch.json()
    if (conflict.error?.code !== 'CONTENT_IN_ACTIVE_ATTEMPT') {
      throw new Error('wrong conflict code')
    }

    const retrieve = await fetch(`${base}/api/lessons/${attemptId}`)
    if (!retrieve.ok) throw new Error(`retrieve ${retrieve.status}`)
    const retrieved = await retrieve.json()
    if (retrieved.status !== 'in_progress') {
      throw new Error('active attempt not intact')
    }
    for (const ex of retrieved.exercises) {
      if ('correct_answer' in ex) {
        throw new Error('learner retrieve leaked correct_answer')
      }
    }
    results.push(`active-attempt protection ok (attempt ${attemptId})`)

    writeFileSync(
      join(tempDir, 'results.json'),
      JSON.stringify({ ok: true, results, createdIds }, null, 2),
    )
    console.log('PASS')
    for (const line of results) console.log(' -', line)
  } finally {
    if (!server.killed) {
      server.kill('SIGKILL')
    }
    // Give Windows time to release the SQLite file handle.
    await new Promise((r) => setTimeout(r, 500))
    try {
      rmSync(tempDir, { recursive: true, force: true })
    } catch {
      // ignore cleanup errors on Windows if server still releasing file
    }
    process.exit(0)
  }
}

main().catch((err) => {
  console.error('FAIL', err)
  process.exit(1)
})
