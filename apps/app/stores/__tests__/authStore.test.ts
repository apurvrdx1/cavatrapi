import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../authStore'

// Reset store to initial state between tests
function resetStore() {
  useAuthStore.setState({
    token: null,
    userId: null,
    username: null,
    isGuest: false,
    guestUsername: null,
    displayName: null,
  })
}

describe('authStore', () => {
  beforeEach(resetStore)

  // ── Initial state ──────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('starts with all fields null / false', () => {
      const s = useAuthStore.getState()
      expect(s.token).toBeNull()
      expect(s.userId).toBeNull()
      expect(s.username).toBeNull()
      expect(s.isGuest).toBe(false)
      expect(s.guestUsername).toBeNull()
      expect(s.displayName).toBeNull()
    })
  })

  // ── setToken ───────────────────────────────────────────────────────────────

  describe('setToken', () => {
    it('sets the token', () => {
      useAuthStore.getState().setToken('tok-123')
      expect(useAuthStore.getState().token).toBe('tok-123')
    })

    it('clears the token when passed null', () => {
      useAuthStore.getState().setToken('tok-123')
      useAuthStore.getState().setToken(null)
      expect(useAuthStore.getState().token).toBeNull()
    })
  })

  // ── setUser ────────────────────────────────────────────────────────────────

  describe('setUser', () => {
    it('sets userId and username', () => {
      useAuthStore.getState().setUser('user-1', 'Alice')
      const s = useAuthStore.getState()
      expect(s.userId).toBe('user-1')
      expect(s.username).toBe('Alice')
    })

    it('derives displayName from username', () => {
      useAuthStore.getState().setUser('user-1', 'Alice')
      expect(useAuthStore.getState().displayName).toBe('Alice')
    })

    it('accepts null userId and username', () => {
      useAuthStore.getState().setUser(null, null)
      const s = useAuthStore.getState()
      expect(s.userId).toBeNull()
      expect(s.username).toBeNull()
      expect(s.displayName).toBeNull()
    })

    it('does not affect isGuest or guestUsername', () => {
      useAuthStore.getState().setUser('user-1', 'Alice')
      const s = useAuthStore.getState()
      expect(s.isGuest).toBe(false)
      expect(s.guestUsername).toBeNull()
    })
  })

  // ── setGuest ───────────────────────────────────────────────────────────────

  describe('setGuest', () => {
    it('sets isGuest to true and stores the guest username', () => {
      useAuthStore.getState().setGuest('Knight42')
      const s = useAuthStore.getState()
      expect(s.isGuest).toBe(true)
      expect(s.guestUsername).toBe('Knight42')
    })

    it('derives displayName from guestUsername', () => {
      useAuthStore.getState().setGuest('Bishop17')
      expect(useAuthStore.getState().displayName).toBe('Bishop17')
    })

    it('does not set userId or username', () => {
      useAuthStore.getState().setGuest('Rook99')
      const s = useAuthStore.getState()
      expect(s.userId).toBeNull()
      expect(s.username).toBeNull()
    })
  })

  // ── clear ──────────────────────────────────────────────────────────────────

  describe('clear', () => {
    it('resets all fields after a signed-in session', () => {
      useAuthStore.getState().setToken('tok')
      useAuthStore.getState().setUser('u1', 'Alice')
      useAuthStore.getState().clear()
      const s = useAuthStore.getState()
      expect(s.token).toBeNull()
      expect(s.userId).toBeNull()
      expect(s.username).toBeNull()
      expect(s.displayName).toBeNull()
      expect(s.isGuest).toBe(false)
    })

    it('resets all fields after a guest session', () => {
      useAuthStore.getState().setGuest('Knight42')
      useAuthStore.getState().clear()
      const s = useAuthStore.getState()
      expect(s.isGuest).toBe(false)
      expect(s.guestUsername).toBeNull()
      expect(s.displayName).toBeNull()
    })

    it('is idempotent on an already-cleared store', () => {
      useAuthStore.getState().clear()
      useAuthStore.getState().clear()
      const s = useAuthStore.getState()
      expect(s.token).toBeNull()
      expect(s.isGuest).toBe(false)
    })
  })

  // ── displayName precedence ─────────────────────────────────────────────────

  describe('displayName derivation', () => {
    it('is null before any identity is set', () => {
      expect(useAuthStore.getState().displayName).toBeNull()
    })

    it('equals username after setUser', () => {
      useAuthStore.getState().setUser('u', 'Charlie')
      expect(useAuthStore.getState().displayName).toBe('Charlie')
    })

    it('equals guestUsername after setGuest', () => {
      useAuthStore.getState().setGuest('Gambit55')
      expect(useAuthStore.getState().displayName).toBe('Gambit55')
    })

    it('becomes null after clear', () => {
      useAuthStore.getState().setUser('u', 'Charlie')
      useAuthStore.getState().clear()
      expect(useAuthStore.getState().displayName).toBeNull()
    })
  })
})
