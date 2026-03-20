import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Platform } from 'react-native'
import type { AIDifficulty } from '@cavatrapi/ai'

// Platform-aware storage: localStorage on web, AsyncStorage on native
function buildStorage() {
  if (Platform.OS === 'web') {
    return createJSONStorage(() => localStorage)
  }
  // Lazy require to avoid bundling AsyncStorage on web
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AsyncStorage = require('@react-native-async-storage/async-storage').default
  return createJSONStorage(() => AsyncStorage)
}

interface SettingsState {
  clockSeconds: 15 | 30 | 45
  aiDifficulty: AIDifficulty
  setClockSeconds: (v: 15 | 30 | 45) => void
  setAIDifficulty: (v: AIDifficulty) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      clockSeconds: 30,
      aiDifficulty: 'MEDIUM',
      setClockSeconds: (clockSeconds) => set({ clockSeconds }),
      setAIDifficulty: (aiDifficulty) => set({ aiDifficulty }),
    }),
    {
      name: 'cavatrapi-settings',
      storage: buildStorage(),
    },
  ),
)
