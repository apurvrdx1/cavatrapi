import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock expo-secure-store ────────────────────────────────────────────────────
const mockGetItem = vi.fn<() => Promise<string | null>>()
const mockSetItem = vi.fn<() => Promise<void>>()

vi.mock('expo-secure-store', () => ({
  getItemAsync: mockGetItem,
  setItemAsync: mockSetItem,
}))

// ── Mock localStorage ─────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

// Dynamically import after mocks are registered
let getOrCreateGuestUsername: () => Promise<string>
beforeEach(async () => {
  vi.resetModules()
  localStorageMock.clear()
  const mod = await import('../../utils/guestUsername')
  getOrCreateGuestUsername = mod.getOrCreateGuestUsername
})

// ─────────────────────────────────────────────────────────────────────────────

describe('getOrCreateGuestUsername', () => {

  describe('when SecureStore has an existing username', () => {
    beforeEach(() => {
      mockGetItem.mockResolvedValue('Knight42')
      mockSetItem.mockResolvedValue(undefined)
    })

    it('returns the stored username', async () => {
      const result = await getOrCreateGuestUsername()
      expect(result).toBe('Knight42')
    })

    it('does not call setItemAsync', async () => {
      await getOrCreateGuestUsername()
      expect(mockSetItem).not.toHaveBeenCalled()
    })
  })

  describe('when SecureStore returns null (first visit)', () => {
    beforeEach(() => {
      mockGetItem.mockResolvedValue(null)
      mockSetItem.mockResolvedValue(undefined)
    })

    it('returns a generated username', async () => {
      const result = await getOrCreateGuestUsername()
      expect(result).toBeTruthy()
    })

    it('generated username matches pattern: ChessWord + 2-digit number', async () => {
      const result = await getOrCreateGuestUsername()
      expect(result).toMatch(/^(Knight|Bishop|Rook|Pawn|Castle|Queen|King|Gambit|Checkmate|Endgame)\d{2}$/)
    })

    it('saves the generated username to SecureStore', async () => {
      const result = await getOrCreateGuestUsername()
      expect(mockSetItem).toHaveBeenCalledWith('cavatrapi_guest_username', result)
    })
  })

  describe('when SecureStore.getItemAsync throws (web / unavailable)', () => {
    beforeEach(() => {
      mockGetItem.mockRejectedValue(new Error('SecureStore not available'))
      mockSetItem.mockRejectedValue(new Error('SecureStore not available'))
    })

    it('still returns a generated username', async () => {
      const result = await getOrCreateGuestUsername()
      expect(result).toMatch(/^(Knight|Bishop|Rook|Pawn|Castle|Queen|King|Gambit|Checkmate|Endgame)\d{2}$/)
    })

    it('falls back to localStorage', async () => {
      const result = await getOrCreateGuestUsername()
      expect(localStorageMock.getItem('cavatrapi_guest_username')).toBe(result)
    })
  })

  describe('when both SecureStore and localStorage fail', () => {
    beforeEach(() => {
      mockGetItem.mockRejectedValue(new Error('unavailable'))
      mockSetItem.mockRejectedValue(new Error('unavailable'))
      // Make localStorage.setItem throw
      vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
        throw new Error('storage quota exceeded')
      })
    })

    it('still returns a generated username without throwing', async () => {
      await expect(getOrCreateGuestUsername()).resolves.toMatch(
        /^(Knight|Bishop|Rook|Pawn|Castle|Queen|King|Gambit|Checkmate|Endgame)\d{2}$/
      )
    })
  })

  describe('username format invariants', () => {
    beforeEach(() => {
      mockGetItem.mockResolvedValue(null)
      mockSetItem.mockResolvedValue(undefined)
    })

    it('two-digit suffix is in range 10–99', async () => {
      for (let i = 0; i < 30; i++) {
        vi.resetModules()
        const mod = await import('../../utils/guestUsername')
        const result = await mod.getOrCreateGuestUsername()
        const num = parseInt(result.replace(/\D/g, ''), 10)
        expect(num).toBeGreaterThanOrEqual(10)
        expect(num).toBeLessThanOrEqual(99)
      }
    })
  })
})
