import * as Sentry from '@sentry/react-native'
import { Stack } from 'expo-router'
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo'

// ─── Sentry — error tracking only ────────────────────────────────────────────
Sentry.init({
  dsn: process.env['EXPO_PUBLIC_SENTRY_DSN'],
  tracesSampleRate: 0,
  enabled: !!process.env['EXPO_PUBLIC_SENTRY_DSN'],
})
import * as SecureStore from 'expo-secure-store'
import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import Constants from 'expo-constants'

// ─── Clerk token cache (uses SecureStore on device, memory fallback on web) ───
const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key)
    } catch {
      return null
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value)
    } catch {
      // Web — SecureStore unavailable, token won't persist across sessions
    }
  },
}

const CLERK_PUBLISHABLE_KEY =
  (Constants.expoConfig?.extra as Record<string, string> | undefined)?.['clerkPublishableKey'] ??
  process.env['EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'] ??
  ''

// ─── Auth sync — keeps authStore in sync with Clerk session ──────────────────
function AuthSync() {
  const { getToken, isSignedIn } = useAuth()
  const { user } = useUser()
  const { setToken, setUser, clear } = useAuthStore()

  useEffect(() => {
    if (!isSignedIn) {
      clear()
      return
    }

    // Fetch token and sync user info
    void getToken().then((t) => {
      setToken(t)
      setUser(user?.id ?? null, user?.username ?? user?.firstName ?? null)
    })
  }, [isSignedIn, user?.id])

  return null
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <AuthSync />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="lobby/index" options={{ headerShown: false }} />
        <Stack.Screen name="game/[gameId]" options={{ headerShown: false }} />
        <Stack.Screen name="assets/index" options={{ title: 'Asset Pack' }} />
        <Stack.Screen name="profile/index" options={{ headerShown: false }} />
      </Stack>
    </ClerkProvider>
  )
}
