/**
 * Fail the suite on unexpected browser console / page errors.
 */
import type { ConsoleMessage, Page, Request } from '@playwright/test'

const ALLOWED_CONSOLE = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /webpack/i,
  // Expected intentional 404 / abort probes in error journeys
  /Failed to load resource: the server responded with a status of 404/i,
  /Failed to load resource: net::ERR_FAILED/i,
]

const ALLOWED_FAILED_URLS = [
  /\/api\/__e2e_down\b/, // intentional error-journey probe
]

export function attachConsoleGuard(
  page: Page,
  opts: { allowFailedUrls?: RegExp[] } = {},
): { assertClean: () => void } {
  const errors: string[] = []
  const allowFailed = [...ALLOWED_FAILED_URLS, ...(opts.allowFailedUrls ?? [])]

  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (ALLOWED_CONSOLE.some((re) => re.test(text))) return
    // Expected network failures during error journeys may surface as console errors.
    if (allowFailed.some((re) => re.test(text))) return
    errors.push(`console.error: ${text}`)
  })

  page.on('pageerror', (err) => {
    errors.push(`pageerror: ${err.message}`)
  })

  page.on('requestfailed', (req: Request) => {
    const url = req.url()
    if (allowFailed.some((re) => re.test(url))) return
    // Aborts from navigation are common; ignore.
    const failure = req.failure()?.errorText ?? ''
    if (/ERR_ABORTED|NS_BINDING_ABORTED/i.test(failure)) return
    errors.push(`requestfailed: ${req.method()} ${url} (${failure})`)
  })

  return {
    assertClean: () => {
      if (errors.length > 0) {
        throw new Error(`Browser console/network gate failed:\n${errors.join('\n')}`)
      }
    },
  }
}

export function assertNoDuolingoRequests(requests: string[]): void {
  const bad = requests.filter((u) => /duolingo/i.test(u))
  if (bad.length > 0) {
    throw new Error(`Duolingo asset requests detected:\n${bad.join('\n')}`)
  }
}
