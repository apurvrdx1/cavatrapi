import { create } from 'zustand'

interface AuthState {
  /** Clerk JWT token — refreshed before socket handshake */
  token: string | null
  /** Clerk user ID (sub claim) */
  userId: string | null
  /** Display name */
  username: string | null
  setToken: (token: string | null) => void
  setUser: (userId: string | null, username: string | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  username: null,
  setToken: (token) => set({ token }),
  setUser: (userId, username) => set({ userId, username }),
  clear: () => set({ token: null, userId: null, username: null }),
}))
