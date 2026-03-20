import { vi } from 'vitest'

// Mock React Native so pure-logic modules (stores, utils) can be tested in Node
vi.mock('react-native', () => ({
  Platform: { OS: 'web', select: (spec: Record<string, unknown>) => spec.web ?? spec.default },
}))

// Suppress zustand persist rehydration calls in tests
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}))
