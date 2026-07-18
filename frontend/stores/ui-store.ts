/**
 * UI-only preferences. Safe to persist in localStorage.
 * Never store authoritative hearts, XP, streak, crowns, or attempt progress here.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'light' | 'dark' | 'system'

interface UIState {
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => void
}

function applyTheme(theme: ThemePreference): void {
  if (typeof document === 'undefined') return

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  document.documentElement.classList.toggle('dark', isDark)
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },
    }),
    {
      name: 'lingoquest-ui',
    },
  ),
)
