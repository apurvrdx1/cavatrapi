import { Stack, usePathname } from 'expo-router'
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo'
import { PostHogProvider, usePostHog } from 'posthog-react-native'
import * as SecureStore from 'expo-secure-store'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { useAuthStore } from '../stores/authStore'
import Constants from 'expo-constants'
import { initSentry } from '../utils/sentry'

// ─── Sentry — platform-specific module handles native vs web SDK ──────────────
initSentry(process.env['EXPO_PUBLIC_SENTRY_DSN'])

// ─── Clerk token cache ────────────────────────────────────────────────────────
const tokenCache = {
  async getToken(key: string) {
    try { return await SecureStore.getItemAsync(key) } catch { return null }
  },
  async saveToken(key: string, value: string) {
    try { await SecureStore.setItemAsync(key, value) } catch { /* web fallback */ }
  },
}

const CLERK_PUBLISHABLE_KEY =
  (Constants.expoConfig?.extra as Record<string, string> | undefined)?.['clerkPublishableKey'] ??
  process.env['EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'] ??
  ''

const POSTHOG_API_KEY = process.env['EXPO_PUBLIC_POSTHOG_API_KEY'] ?? ''
const POSTHOG_HOST = process.env['EXPO_PUBLIC_POSTHOG_HOST'] ?? 'https://us.i.posthog.com'

// ─── PostHog storage — localStorage on web, default (AsyncStorage) on native ─
const postHogOptions = {
  host: POSTHOG_HOST,
  ...(Platform.OS === 'web' && {
    storage: {
      getItem: (key: string) => localStorage.getItem(key),
      setItem: (key: string, value: string) => localStorage.setItem(key, value),
      removeItem: (key: string) => localStorage.removeItem(key),
    },
  }),
}

// ─── Auth sync — keeps authStore in sync with Clerk + identifies PostHog user ─
function AuthSync() {
  const { getToken, isSignedIn } = useAuth()
  const { user } = useUser()
  const { setToken, setUser, clear } = useAuthStore()
  const posthog = usePostHog()

  useEffect(() => {
    if (!isSignedIn) {
      clear()
      posthog?.reset()
      return
    }

    void getToken().then((t) => {
      setToken(t)
      const username = user?.username ?? user?.firstName ?? null
      setUser(user?.id ?? null, username)
      if (user?.id) {
        posthog?.identify(user.id, username ? { username } : {})
      }
    })
  }, [isSignedIn, user?.id])

  return null
}

// ─── Screen tracker — captures $screen_view on each route change ──────────────
function ScreenTracker() {
  const pathname = usePathname()
  const posthog = usePostHog()

  useEffect(() => {
    posthog?.screen(pathname)
  }, [pathname])

  return null
}

export default function RootLayout() {
  return (
    <PostHogProvider apiKey={POSTHOG_API_KEY} options={postHogOptions} autocapture={false}>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <AuthSync />
        <ScreenTracker />
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="lobby/index" options={{ headerShown: false }} />
          <Stack.Screen name="game/[gameId]" options={{ headerShown: false }} />
          <Stack.Screen name="assets/index" options={{ title: 'Asset Pack' }} />
          <Stack.Screen name="profile/index" options={{ headerShown: false }} />
        </Stack>
      </ClerkProvider>
    </PostHogProvider>
  )
}
