import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '@/stores/ui-store'

describe('UIStore', () => {
  beforeEach(() => {
    useUIStore.setState({ theme: 'light' })
    document.documentElement.classList.remove('dark')
  })

  it('defaults to light theme', () => {
    expect(useUIStore.getState().theme).toBe('light')
  })

  it('sets dark theme', () => {
    useUIStore.getState().setTheme('dark')
    expect(useUIStore.getState().theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('sets light theme and removes dark class', () => {
    useUIStore.getState().setTheme('dark')
    useUIStore.getState().setTheme('light')
    expect(useUIStore.getState().theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('sets system theme', () => {
    useUIStore.getState().setTheme('system')
    expect(useUIStore.getState().theme).toBe('system')
  })

  it('does not store hearts, XP, streak, crowns, or gems', () => {
    const state = useUIStore.getState()
    const keys = Object.keys(state)
    const forbidden = ['hearts', 'xp', 'streak', 'crowns', 'gems', 'total_xp']
    for (const key of forbidden) {
      expect(keys).not.toContain(key)
    }
  })
})
