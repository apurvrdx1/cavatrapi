import { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { KnightPiece } from '../../components/KnightPiece'
import { useSocket } from '../../hooks/useSocket'
import { useNetworkGameStore } from '../../stores/networkGameStore'
import { SOCKET_EVENTS, SERVER_EVENTS } from '@cavatrapi/shared'
import type { GameMode } from '@cavatrapi/shared'

const CLOCK_OPTIONS = [15, 30, 45] as const
type ClockSeconds = (typeof CLOCK_OPTIONS)[number]

export default function LobbyScreen() {
  const router = useRouter()
  const socket = useSocket()
  const { matchmakingStatus, setWaiting, setMatched, reset } = useNetworkGameStore()

  const [mode, setMode] = useState<GameMode>('SUDDEN_DEATH')
  const [clock, setClock] = useState<ClockSeconds>(30)

  const isWaiting = matchmakingStatus === 'waiting'

  // Listen for server match events
  useEffect(() => {
    function onGameCreated(payload: { gameId: string; yourRole: string; clockSeconds?: number }) {
      setMatched(payload.gameId, payload.yourRole as 'P1' | 'P2', clock)
      router.replace(`/game/${payload.gameId}`)
    }

    socket.on(SERVER_EVENTS.GAME_CREATED, onGameCreated)
    return () => { socket.off(SERVER_EVENTS.GAME_CREATED, onGameCreated) }
  }, [clock])

  const handleStart = useCallback(() => {
    reset()
    setWaiting()
    socket.emit(SOCKET_EVENTS.JOIN_GAME, { mode, clockSeconds: clock })
  }, [mode, clock])

  const handleCancel = useCallback(() => {
    socket.emit('leave_queue')
    reset()
  }, [])

  // Local play fallback
  const handleLocalPlay = useCallback(() => {
    reset()
    router.push({ pathname: '/game/local', params: { mode, clock: String(clock) } })
  }, [mode, clock])

  return (
    <View style={styles.bg}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => { handleCancel(); router.back() }}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#1e293b" />
          </Pressable>
          <Text style={styles.headerTitle}>MATCH SETUP</Text>
          <View style={styles.backBtn} />
        </View>

        {/* VS panel */}
        <View style={styles.vsPanel}>
          <View style={styles.playerSlot}>
            <View style={styles.avatarP1}>
              <KnightPiece color="#8b5cf6" size={72} />
            </View>
            <Text style={styles.playerLabel}>YOU</Text>
          </View>
          <Text style={styles.vsText}>VS</Text>
          <View style={styles.playerSlot}>
            <View style={styles.avatarP2}>
              {isWaiting
                ? <ActivityIndicator size="large" color="#64748b" />
                : <KnightPiece color="#facc15" size={72} />}
            </View>
            <Text style={styles.playerLabel}>{isWaiting ? 'FINDING...' : 'OPPONENT'}</Text>
          </View>
        </View>

        {/* Game Mode */}
        <View style={[styles.sectionBlock, isWaiting && styles.disabled]}>
          <Text style={styles.sectionLabel}>GAME MODE</Text>
          <View style={styles.pillRow}>
            {(['SUDDEN_DEATH', 'AREA_CONTROL'] as const).map((m) => (
              <Pressable
                key={m}
                style={[styles.pill, mode === m && styles.pillActive]}
                onPress={() => !isWaiting && setMode(m)}
              >
                <Text style={[styles.pillText, mode === m && styles.pillTextActive]}>
                  {m === 'SUDDEN_DEATH' ? 'Sudden Death' : 'Area Control'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Turn Clock */}
        <View style={[styles.sectionBlock, isWaiting && styles.disabled]}>
          <Text style={styles.sectionLabel}>TURN CLOCK</Text>
          <View style={styles.pillRow}>
            {CLOCK_OPTIONS.map((s) => (
              <Pressable
                key={s}
                style={[styles.pill, clock === s && styles.pillClockActive]}
                onPress={() => !isWaiting && setClock(s)}
              >
                <Text style={[styles.pillText, clock === s && styles.pillClockActiveText]}>{s}s</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* CTAs */}
        {isWaiting ? (
          <Pressable style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>CANCEL</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}
              onPress={handleStart}
            >
              <Text style={styles.startBtnText}>FIND MATCH</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#ffffff" />
            </Pressable>

            <Pressable style={styles.localBtn} onPress={handleLocalPlay}>
              <MaterialCommunityIcons name="account" size={16} color="#64748b" />
              <Text style={styles.localBtnText}>Local Play</Text>
            </Pressable>
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
    padding: 28,
    width: '100%',
    maxWidth: 380,
    gap: 20,
    ...Platform.select({
      web: { boxShadow: '12px 12px 0px #1e293b' },
      default: { shadowColor: '#1e293b', shadowOffset: { width: 12, height: 12 }, shadowOpacity: 1, shadowRadius: 0, elevation: 12 },
    }),
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: '#1e293b',
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontWeight: '900', fontSize: 18, color: '#1e293b', letterSpacing: 2 },
  vsPanel: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#f8fafc', borderRadius: 24, borderWidth: 3, borderColor: '#e2e8f0', padding: 20,
  },
  playerSlot: { alignItems: 'center', gap: 8 },
  avatarP1: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: '#ede9fe',
    borderWidth: 4, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ web: { boxShadow: '4px 4px 0px #1e293b' }, default: { shadowColor: '#1e293b', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 } }),
  },
  avatarP2: {
    width: 88, height: 88, borderRadius: 16, backgroundColor: '#fef9c3',
    borderWidth: 4, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ web: { boxShadow: '4px 4px 0px #1e293b' }, default: { shadowColor: '#1e293b', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 } }),
  },
  playerLabel: { fontWeight: '800', fontSize: 11, color: '#64748b', letterSpacing: 2 },
  vsText: {
    fontWeight: '900', fontSize: 32, color: '#ef4444', letterSpacing: 2,
    ...Platform.select({ web: { textShadow: '3px 3px 0 #1e293b' }, default: {} }),
  },
  sectionBlock: { gap: 10 },
  disabled: { opacity: 0.4 },
  sectionLabel: { fontWeight: '800', fontSize: 11, color: '#64748b', letterSpacing: 2 },
  pillRow: {
    flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 20,
    borderWidth: 3, borderColor: '#e2e8f0', padding: 4, gap: 4,
  },
  pill: { flex: 1, paddingVertical: 10, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pillActive: {
    backgroundColor: '#4ade80', borderWidth: 3, borderColor: '#1e293b',
    ...Platform.select({ web: { boxShadow: '3px 3px 0px #1e293b' }, default: { shadowColor: '#1e293b', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0 } }),
  },
  pillClockActive: {
    backgroundColor: '#60a5fa', borderWidth: 3, borderColor: '#1e293b',
    ...Platform.select({ web: { boxShadow: '3px 3px 0px #1e293b' }, default: { shadowColor: '#1e293b', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0 } }),
  },
  pillText: { fontWeight: '700', fontSize: 14, color: '#64748b' },
  pillTextActive: { fontWeight: '800', color: '#1e293b' },
  pillClockActiveText: { fontWeight: '800', color: '#ffffff' },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#8b5cf6', borderRadius: 28, borderWidth: 4, borderColor: '#1e293b',
    paddingVertical: 16, paddingHorizontal: 24, gap: 8, marginTop: 4,
    ...Platform.select({ web: { boxShadow: '4px 4px 0px #1e293b, inset 0 -6px 0 rgba(0,0,0,0.15)', cursor: 'pointer' }, default: { shadowColor: '#1e293b', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 } }),
  },
  startBtnPressed: {
    transform: [{ translateX: 4 }, { translateY: 4 }],
    ...Platform.select({ web: { boxShadow: 'none' }, default: { shadowOffset: { width: 0, height: 0 }, elevation: 0 } }),
  },
  startBtnText: { fontWeight: '900', fontSize: 18, color: '#ffffff', letterSpacing: 2 },
  cancelBtn: {
    alignItems: 'center', justifyContent: 'center', borderRadius: 24,
    borderWidth: 3, borderColor: '#ef4444', paddingVertical: 14,
    backgroundColor: '#fff1f2',
  },
  cancelBtnText: { fontWeight: '800', fontSize: 16, color: '#ef4444', letterSpacing: 2 },
  localBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8,
  },
  localBtnText: { fontWeight: '600', fontSize: 14, color: '#64748b' },
})
