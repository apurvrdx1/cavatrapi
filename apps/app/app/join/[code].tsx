import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSocket } from '../../hooks/useSocket'
import { useNetworkGameStore } from '../../stores/networkGameStore'
import { SOCKET_EVENTS, SERVER_EVENTS } from '@cavatrapi/shared'

export default function JoinScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const socket = useSocket()
  const { setMatched, reset } = useNetworkGameStore()
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!code) {
      setError(true)
      return
    }

    reset()
    socket.emit(SOCKET_EVENTS.JOIN_PRIVATE_GAME, { code })

    function onGameCreated(payload: { gameId: string; yourRole: string; clockSeconds?: number }) {
      setMatched(payload.gameId, payload.yourRole as 'P1' | 'P2', payload.clockSeconds ?? 30)
      router.replace('/game/' + payload.gameId)
    }

    function onPrivateGameError() {
      setError(true)
    }

    socket.on(SERVER_EVENTS.GAME_CREATED, onGameCreated)
    socket.on(SERVER_EVENTS.PRIVATE_GAME_ERROR, onPrivateGameError)
    return () => {
      socket.off(SERVER_EVENTS.GAME_CREATED, onGameCreated)
      socket.off(SERVER_EVENTS.PRIVATE_GAME_ERROR, onPrivateGameError)
    }
  }, [code])

  return (
    <View style={styles.bg}>
      <View style={styles.card}>
        {error ? (
          <>
            <Text style={styles.errorTitle}>INVITE INVALID</Text>
            <Text style={styles.errorBody}>
              This invite has expired or is invalid.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.homeBtn, pressed && styles.homeBtnPressed]}
              onPress={() => router.replace('/')}
            >
              <Text style={styles.homeBtnText}>GO HOME</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.joiningTitle}>JOINING GAME...</Text>
            <ActivityIndicator size="large" color="#8b5cf6" />
            {code ? (
              <View style={styles.codePill}>
                <Text style={styles.codePillText}>{code}</Text>
              </View>
            ) : null}
          </>
        )}
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
    padding: 40,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: 24,
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
  joiningTitle: {
    fontWeight: '900',
    fontSize: 22,
    color: '#1e293b',
    letterSpacing: 2,
    textAlign: 'center',
  },
  codePill: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  codePillText: {
    fontWeight: '800',
    fontSize: 18,
    color: '#475569',
    letterSpacing: 4,
    textAlign: 'center',
  },
  errorTitle: {
    fontWeight: '900',
    fontSize: 22,
    color: '#ef4444',
    letterSpacing: 2,
    textAlign: 'center',
  },
  errorBody: {
    fontWeight: '600',
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
  },
  homeBtn: {
    backgroundColor: '#4ade80',
    borderRadius: 28,
    borderWidth: 4,
    borderColor: '#1e293b',
    paddingVertical: 14,
    paddingHorizontal: 32,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
  homeBtnPressed: {
    transform: [{ translateX: 4 }, { translateY: 4 }],
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: { shadowOffset: { width: 0, height: 0 }, elevation: 0 },
    }),
  },
  homeBtnText: {
    fontWeight: '900',
    fontSize: 16,
    color: '#1e293b',
    letterSpacing: 2,
  },
})
