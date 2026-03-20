import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth, useUser, useOAuth } from '@clerk/clerk-expo'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { KnightPiece } from '../components/KnightPiece'
import { useAuthStore } from '../stores/authStore'
import { getOrCreateGuestUsername } from '../utils/guestUsername'

export default function WelcomeScreen() {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const { setUser, setGuest } = useAuthStore()
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' })

  const [guestLoading, setGuestLoading] = useState(false)
  const [signInLoading, setSignInLoading] = useState(false)

  // Auto-redirect if already signed in
  useEffect(() => {
    if (isSignedIn && user) {
      setUser(user.id ?? null, user.firstName ?? user.username ?? 'Player')
      router.replace('/mode')
    }
  }, [isSignedIn, user?.id])

  async function handleSignIn() {
    try {
      setSignInLoading(true)
      await startOAuthFlow()
      // AuthSync in _layout.tsx handles setUser + redirect after OAuth completes
    } catch {
      // User cancelled or OAuth failed — silently reset
    } finally {
      setSignInLoading(false)
    }
  }

  async function handleGuest() {
    try {
      setGuestLoading(true)
      const username = await getOrCreateGuestUsername()
      setGuest(username)
      router.replace('/mode')
    } finally {
      setGuestLoading(false)
    }
  }

  return (
    <View style={styles.bg}>
      <View style={styles.card}>
        {/* Hero pieces */}
        <View style={styles.heroRow}>
          <View style={styles.piece1}>
            <KnightPiece color="#facc15" size={120} />
          </View>
          <View style={styles.piece2}>
            <KnightPiece color="#8b5cf6" size={120} />
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>CAVATRAPI</Text>
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>KNIGHT TERRITORY · 2 PLAYERS</Text>

        {/* Sign In button */}
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]}
          onPress={handleSignIn}
          disabled={signInLoading || guestLoading}
          accessibilityLabel="Sign in"
          accessibilityRole="button"
        >
          {signInLoading ? (
            <ActivityIndicator size="small" color="#1e293b" />
          ) : (
            <MaterialCommunityIcons name="account" size={24} color="#1e293b" />
          )}
          <Text style={styles.btnPrimaryText}>SIGN IN</Text>
        </Pressable>

        {/* Play as Guest button */}
        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnSecondaryPressed]}
          onPress={handleGuest}
          disabled={guestLoading || signInLoading}
          accessibilityLabel="Play as guest"
          accessibilityRole="button"
        >
          {guestLoading ? (
            <ActivityIndicator size="small" color="#475569" />
          ) : (
            <MaterialCommunityIcons name="incognito" size={22} color="#475569" />
          )}
          <Text style={styles.btnSecondaryText}>PLAY AS GUEST</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#7dd3fc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 40,
    borderWidth: 5,
    borderColor: '#1e293b',
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      web: { boxShadow: '12px 12px 0px #1e293b' },
      default: {
        shadowColor: '#1e293b',
        shadowOffset: { width: 12, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 12,
      },
    }),
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  piece1: {
    transform: [{ rotate: '-8deg' }],
    marginBottom: 8,
  },
  piece2: {
    transform: [{ rotate: '6deg' }],
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontWeight: '900',
    fontSize: 48,
    color: '#facc15',
    letterSpacing: 4,
    ...Platform.select({
      web: { textShadow: '4px 4px 0 #1e293b', WebkitTextStroke: '2px #1e293b' },
      default: {},
    }),
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    letterSpacing: 2,
    marginBottom: 32,
    textAlign: 'center',
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ade80',
    borderRadius: 28,
    borderWidth: 4,
    borderColor: '#1e293b',
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    minHeight: 56,
    gap: 10,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 0px #1e293b, inset 0 -6px 0 rgba(0,0,0,0.15)',
        cursor: 'pointer',
      },
      default: {
        shadowColor: '#1e293b',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
      },
    }),
  },
  btnPressed: {
    transform: [{ translateX: 4 }, { translateY: 4 }],
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: {
        shadowOffset: { width: 0, height: 0 },
        elevation: 0,
      },
    }),
  },
  btnPrimaryText: {
    fontWeight: '900',
    fontSize: 20,
    color: '#1e293b',
    letterSpacing: 2,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    borderWidth: 4,
    borderColor: '#1e293b',
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    minHeight: 52,
    gap: 10,
    backgroundColor: '#f1f5f9',
    ...Platform.select({
      web: { boxShadow: '4px 4px 0px #1e293b', cursor: 'pointer' },
      default: {
        shadowColor: '#1e293b',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
      },
    }),
  },
  btnSecondaryPressed: {
    transform: [{ translateX: 4 }, { translateY: 4 }],
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: { shadowOffset: { width: 0, height: 0 }, elevation: 0 },
    }),
  },
  btnSecondaryText: {
    fontWeight: '800',
    fontSize: 18,
    color: '#475569',
    letterSpacing: 1,
  },
})
