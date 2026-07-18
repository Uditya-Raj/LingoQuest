import { vi } from 'vitest'

export interface MockVoice {
  name: string
  lang: string
  default: boolean
  localService: boolean
  voiceURI: string
}

export interface MockUtterance {
  text: string
  lang: string
  rate: number
  pitch: number
  volume: number
  voice: MockVoice | null
  onstart: ((ev: Event) => void) | null
  onend: ((ev: Event) => void) | null
  onerror: ((ev: Event) => void) | null
}

export interface MockSpeechSynthesis {
  speaking: boolean
  pending: boolean
  paused: boolean
  cancel: ReturnType<typeof vi.fn>
  speak: ReturnType<typeof vi.fn>
  getVoices: ReturnType<typeof vi.fn>
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  utterances: MockUtterance[]
  setVoices: (next: MockVoice[]) => void
  triggerVoicesChanged: () => void
  finishCurrent: () => void
  errorCurrent: () => void
}

export function createMockVoice(
  lang: string,
  name = `${lang} Voice`,
): MockVoice {
  return {
    name,
    lang,
    default: false,
    localService: true,
    voiceURI: name,
  }
}

/**
 * Install a focused speechSynthesis mock on window.
 * Does not produce real audio.
 */
export function installMockSpeechSynthesis(
  initialVoices: MockVoice[] = [],
): MockSpeechSynthesis {
  let voices = [...initialVoices]
  const utterances: MockUtterance[] = []
  const voiceListeners = new Set<() => void>()

  const mock: MockSpeechSynthesis = {
    speaking: false,
    pending: false,
    paused: false,
    utterances,
    cancel: vi.fn(() => {
      mock.speaking = false
      mock.pending = false
    }),
    speak: vi.fn((utterance: MockUtterance) => {
      utterances.push(utterance)
      mock.speaking = true
      mock.pending = false
      utterance.onstart?.(new Event('start'))
    }),
    getVoices: vi.fn(() => voices),
    addEventListener: vi.fn((type: string, listener: () => void) => {
      if (type === 'voiceschanged') voiceListeners.add(listener)
    }),
    removeEventListener: vi.fn((type: string, listener: () => void) => {
      if (type === 'voiceschanged') voiceListeners.delete(listener)
    }),
    setVoices(next: MockVoice[]) {
      voices = [...next]
      mock.getVoices.mockImplementation(() => voices)
      mock.triggerVoicesChanged()
    },
    triggerVoicesChanged() {
      for (const listener of voiceListeners) listener()
    },
    finishCurrent() {
      const current = utterances[utterances.length - 1]
      mock.speaking = false
      current?.onend?.(new Event('end'))
    },
    errorCurrent() {
      const current = utterances[utterances.length - 1]
      mock.speaking = false
      current?.onerror?.(new Event('error'))
    },
  }

  class MockSpeechSynthesisUtterance {
    text: string
    lang = ''
    rate = 1
    pitch = 1
    volume = 1
    voice: MockVoice | null = null
    onstart: ((ev: Event) => void) | null = null
    onend: ((ev: Event) => void) | null = null
    onerror: ((ev: Event) => void) | null = null

    constructor(text: string) {
      this.text = text
    }
  }

  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    writable: true,
    value: mock,
  })

  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    configurable: true,
    writable: true,
    value: MockSpeechSynthesisUtterance,
  })

  return mock
}

export function removeSpeechSynthesisMock() {
  Reflect.deleteProperty(window, 'speechSynthesis')
  Reflect.deleteProperty(window, 'SpeechSynthesisUtterance')
}

export function installUnsupportedSpeechSynthesis() {
  Reflect.deleteProperty(window, 'speechSynthesis')
  Reflect.deleteProperty(window, 'SpeechSynthesisUtterance')
}
