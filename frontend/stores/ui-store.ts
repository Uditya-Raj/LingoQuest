/**
 * UI-only preferences. Safe to persist.
 * Never store authoritative hearts, XP, streak, crowns, or attempt progress here.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'lingoquest-ui',
    },
  ),
)
