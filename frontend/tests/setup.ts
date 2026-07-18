import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8000/api'

afterEach(() => {
  cleanup()
})

class MockMatchMedia {
  matches: boolean
  media: string
  onchange: null
  constructor(query: string) {
    this.matches = false
    this.media = query
    this.onchange = null
  }
  addListener() {}
  removeListener() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true }
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => new MockMatchMedia(query),
})
