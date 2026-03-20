import { create } from 'zustand'

interface AuthState {
  /** Clerk JWT token — refreshed before socket handshake */
  token: string | null
  /** Clerk user ID (sub claim) */
  userId: string | null
  /** Clerk display name (signed-in users) */
  username: string | null
  /** Guest mode — user chose Play as Guest */
  isGuest: boolean
  /** Guest username (chess-based, stored in SecureStore) */
  guestUsername: string | null
  /** Derived display name: username ?? guestUsername */
  displayName: string | null

  setToken: (token: string | null) => void
  setUser: (userId: string | null, username: string | null) => void
  setGuest: (guestUsername: string) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  username: null,
  isGuest: false,
  guestUsername: null,
  displayName: null,
  setToken: (token) => set({ token }),
  setUser: (userId, username) => set({ userId, username, displayName: username }),
  setGuest: (guestUsername) => set({ isGuest: true, guestUsername, displayName: guestUsername }),
  clear: () =>
    set({
      token: null,
      userId: null,
      username: null,
      isGuest: false,
      guestUsername: null,
      displayName: null,
    }),
}))
