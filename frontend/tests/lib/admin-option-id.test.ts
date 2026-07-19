import { describe, expect, it, beforeEach } from 'vitest'

import {
  createOptionId,
  ensureUniqueOptionId,
  resetOptionIdCounter,
} from '@/lib/admin/option-id'

describe('admin option ID helper', () => {
  beforeEach(() => {
    resetOptionIdCounter()
  })

  it('generates unique IDs independent of visible text', () => {
    const a = createOptionId('mc')
    const b = createOptionId('mc')
    expect(a).not.toBe(b)
    expect(a).toMatch(/^mc_/)
    expect(a).not.toContain('Hello')
  })

  it('does not use array indices as IDs', () => {
    const ids = [0, 1, 2].map(() => createOptionId('wb'))
    expect(ids).not.toEqual(['0', '1', '2'])
    expect(new Set(ids).size).toBe(3)
  })

  it('ensureUniqueOptionId keeps distinct candidates and mints when needed', () => {
    const existing = new Set(['opt_a'])
    expect(ensureUniqueOptionId('opt_b', existing)).toBe('opt_b')
    const minted = ensureUniqueOptionId('opt_a', existing)
    expect(minted).not.toBe('opt_a')
    expect(existing.has(minted)).toBe(false)
  })
})
