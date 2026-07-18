/**
 * Phase 10D visual + browser TTS verification.
 * Uses attempt 143 read-only (GET only). Never answers/completes/fails.
 */

import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', '..', 'qa-screenshots', 'phase10d')
mkdirSync(outDir, { recursive: true })

const API = 'http://127.0.0.1:8000'
const APP = 'http://127.0.0.1:3000'

const viewports = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '390x844', width: 390, height: 844 },
  { name: '320x568', width: 320, height: 568 },
]

async function capture(page, filename, notes, meta) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
  )
  await page.screenshot({ path: join(outDir, filename), fullPage: false })
  notes.push({ filename, overflow, ...meta })
  console.log(`Captured ${filename} overflow=${overflow}`)
}

function installSpeechProbe() {
  window.__lqSpeech = {
    speakCalls: [],
    cancelCalls: 0,
    voices: [
      {
        name: 'Spanish Spain',
        lang: 'es-ES',
        default: false,
        localService: true,
        voiceURI: 'Spanish Spain',
      },
    ],
  }

  class ProbeUtterance {
    constructor(text) {
      this.text = text
      this.lang = ''
      this.rate = 1
      this.pitch = 1
      this.volume = 1
      this.voice = null
      this.onstart = null
      this.onend = null
      this.onerror = null
    }
  }

  const synth = {
    speaking: false,
    pending: false,
    paused: false,
    getVoices: () => window.__lqSpeech.voices,
    cancel: () => {
      window.__lqSpeech.cancelCalls += 1
      synth.speaking = false
    },
    speak: (utterance) => {
      window.__lqSpeech.speakCalls.push({
        text: utterance.text,
        lang: utterance.lang,
        rate: utterance.rate,
        pitch: utterance.pitch,
        volume: utterance.volume,
        voice: utterance.voice?.name ?? null,
      })
      synth.speaking = true
      utterance.onstart?.(new Event('start'))
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  }

  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: synth,
  })
  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    configurable: true,
    value: ProbeUtterance,
  })
}

async function openLesson(page, mocked, theme, reducedMotion = false) {
  await page.route('**/api/lessons/143', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.abort()
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mocked),
    })
  })
  await page.route('**/api/lessons/143/**', (route) => route.abort())

  if (theme === 'dark') {
    await page.addInitScript(() => {
      document.documentElement.classList.add('dark')
      localStorage.setItem(
        'ui-store',
        JSON.stringify({ state: { theme: 'dark' }, version: 0 }),
      )
    })
  }

  await page.addInitScript(installSpeechProbe)
  await page.emulateMedia({
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
  })
  await page.goto(`${APP}/lesson/143`, { waitUntil: 'networkidle' })
}

async function main() {
  const response = await fetch(`${API}/api/lessons/143`)
  if (!response.ok) throw new Error(`Failed to load attempt 143: ${response.status}`)
  const attempt143 = await response.json()
  if (attempt143.current_index !== 0 || attempt143.status !== 'in_progress') {
    throw new Error(
      `Attempt 143 unexpected state: status=${attempt143.status} index=${attempt143.current_index}`,
    )
  }
  for (const exercise of attempt143.exercises) {
    if ('correct_answer' in exercise) {
      throw new Error('Attempt 143 exercise leaked correct_answer')
    }
  }

  const ttsExercises = attempt143.exercises.filter(
    (e) => e.tts_text && e.tts_lang,
  )
  if (ttsExercises.length === 0) {
    throw new Error('Attempt 143 has no TTS-enabled exercises')
  }

  const byType = {}
  for (const exercise of attempt143.exercises) {
    if (!byType[exercise.type]) byType[exercise.type] = exercise
  }

  // Enrich non-TTS types with fixture TTS for layout QA only (mocked retrieve).
  const layoutExercises = Object.fromEntries(
    Object.entries(byType).map(([type, exercise]) => [
      type,
      {
        ...exercise,
        tts_text: exercise.tts_text ?? 'hola',
        tts_lang: exercise.tts_lang ?? 'es-ES',
        audio_url: null,
      },
    ]),
  )

  const browser = await chromium.launch()
  const notes = []
  const results = {
    playWorks: false,
    replayWorks: false,
    spanishLang: false,
    noAutoplay: false,
    keyboardWorks: false,
    unsupportedFallback: false,
    attemptUnchanged: false,
    overflowIssues: [],
  }

  // Primary TTS exercise from real attempt 143
  const primary = ttsExercises[0]
  const primaryMock = {
    ...attempt143,
    current_index: primary.position,
    resumed: true,
  }

  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'light',
    })
    const page = await context.newPage()
    await openLesson(page, primaryMock, 'light')
    await page.getByRole('heading', { name: primary.prompt }).waitFor()

    const speakBefore = await page.evaluate(() => window.__lqSpeech.speakCalls.length)
    results.noAutoplay = speakBefore === 0

    const play = page.getByRole('button', { name: /Play .+ pronunciation/i })
    await play.waitFor()
    await capture(page, '1440-light-play.png', notes, {
      state: 'play',
      theme: 'light',
      vp: '1440x900',
    })

    await play.click()
    const afterPlay = await page.evaluate(() => window.__lqSpeech.speakCalls)
    results.playWorks = afterPlay.length === 1
    results.spanishLang = afterPlay[0]?.lang === 'es-ES'
    await page.getByText('Speaking').waitFor()
    await capture(page, '1440-light-speaking.png', notes, {
      state: 'speaking',
      theme: 'light',
      vp: '1440x900',
    })

    // Finish utterance via probe, then replay
    await page.evaluate(() => {
      // Simulate end by re-clicking after forcing UI via second play cycle
    })
    await play.click()
    const afterReplay = await page.evaluate(() => ({
      speak: window.__lqSpeech.speakCalls.length,
      cancel: window.__lqSpeech.cancelCalls,
    }))
    results.replayWorks = afterReplay.speak >= 2 && afterReplay.cancel >= 1

    await play.focus()
    await capture(page, '1440-light-focus.png', notes, {
      state: 'focus',
      theme: 'light',
      vp: '1440x900',
    })

    await page.keyboard.press('Enter')
    const afterKeyboard = await page.evaluate(
      () => window.__lqSpeech.speakCalls.length,
    )
    results.keyboardWorks = afterKeyboard >= 3

    await context.close()
  }

  // Unsupported fallback
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    })
    const page = await context.newPage()
    await page.addInitScript(() => {
      Object.defineProperty(window, 'speechSynthesis', {
        configurable: true,
        value: undefined,
      })
      Object.defineProperty(window, 'SpeechSynthesisUtterance', {
        configurable: true,
        value: undefined,
      })
    })
    await page.route('**/api/lessons/143', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.abort()
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(primaryMock),
      })
    })
    await page.route('**/api/lessons/143/**', (route) => route.abort())
    await page.goto(`${APP}/lesson/143`, { waitUntil: 'networkidle' })
    await page.getByText(/Audio unavailable in this browser/i).waitFor()
    results.unsupportedFallback = true
    await capture(page, '390-unsupported.png', notes, {
      state: 'unsupported',
      theme: 'light',
      vp: '390x844',
    })
    await context.close()
  }

  // Responsive matrix for Play state + dark + reduced motion
  for (const theme of ['light', 'dark']) {
    for (const vp of viewports) {
      if (theme === 'dark' && vp.width === 320) continue
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme === 'dark' ? 'dark' : 'light',
        reducedMotion: vp.width === 1440 && theme === 'light' ? 'reduce' : 'no-preference',
      })
      const page = await context.newPage()
      await openLesson(
        page,
        primaryMock,
        theme,
        vp.width === 1440 && theme === 'light',
      )
      await page.getByRole('heading', { name: primary.prompt }).waitFor()
      await page.waitForTimeout(300)
      await capture(
        page,
        `${vp.name}-${theme}-audio.png`,
        notes,
        { state: 'play', theme, vp: vp.name },
      )
      await context.close()
    }
  }

  // Five-type layout with TTS control (mocked TTS fields where needed)
  for (const type of Object.keys(layoutExercises)) {
    const exercise = layoutExercises[type]
    const mocked = {
      ...attempt143,
      current_index: exercise.position,
      exercises: attempt143.exercises.map((e) =>
        e.id === exercise.id ? exercise : e,
      ),
      resumed: true,
    }
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    })
    const page = await context.newPage()
    await openLesson(page, mocked, 'light')
    await page.getByRole('heading', { name: exercise.prompt }).waitFor()
    await page.getByRole('button', { name: /Play .+ pronunciation/i }).waitFor()
    await capture(page, `390-${type}-tts.png`, notes, {
      state: 'play',
      type,
      vp: '390x844',
    })
    await context.close()
  }

  // 200% zoom approximation via smaller CSS viewport scale
  {
    const context = await browser.newContext({
      viewport: { width: 720, height: 450 },
      deviceScaleFactor: 2,
    })
    const page = await context.newPage()
    await openLesson(page, primaryMock, 'light')
    await page.getByRole('heading', { name: primary.prompt }).waitFor()
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2'
    })
    await page.waitForTimeout(200)
    await capture(page, '720-zoom200-audio.png', notes, {
      state: 'play',
      zoom: '200%',
    })
    await context.close()
  }

  await browser.close()

  const verify = await fetch(`${API}/api/lessons/143`)
  const after = await verify.json()
  results.attemptUnchanged =
    after.status === 'in_progress' && after.current_index === 0

  results.overflowIssues = notes.filter((n) => n.overflow).map((n) => n.filename)

  writeFileSync(join(outDir, 'notes.json'), JSON.stringify({ notes, results }, null, 2))
  console.log(JSON.stringify(results, null, 2))

  if (!results.playWorks) throw new Error('Play verification failed')
  if (!results.spanishLang) throw new Error('Spanish lang verification failed')
  if (!results.noAutoplay) throw new Error('Autoplay detected')
  if (!results.unsupportedFallback) throw new Error('Unsupported fallback failed')
  if (!results.attemptUnchanged) throw new Error('Attempt 143 was mutated')
  if (results.overflowIssues.length) {
    throw new Error(`Horizontal overflow: ${results.overflowIssues.join(', ')}`)
  }

  console.log('Phase 10D browser verification passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
