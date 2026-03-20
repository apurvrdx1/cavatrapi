import { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { useSocket } from '../../hooks/useSocket'
import { useNetworkGameStore } from '../../stores/networkGameStore'
import { useAuthStore } from '../../stores/authStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { SOCKET_EVENTS, SERVER_EVENTS } from '@cavatrapi/shared'
import type { GameMode } from '@cavatrapi/shared'

export default function OnlineScreen() {
  const { mode, invite } = useLocalSearchParams<{ mode: string; invite?: string }>()
  const isInviteMode = invite === 'true'

  const socket = useSocket()
  const { setMatched, reset } = useNetworkGameStore()
  const displayName = useAuthStore((s) => s.displayName)
  const settingsStore = useSettingsStore()

  const [cancelled, setCancelled] = useState(false)
  const [code, setCode] = useState<string | null>(null)

  const gameMode = (mode ?? 'SUDDEN_DEATH') as GameMode
  const clockSeconds = settingsStore.clockSeconds

  // ── Find Match flow ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isInviteMode) return

    reset()
    socket.emit(SOCKET_EVENTS.JOIN_GAME, { mode: gameMode, clockSeconds })

    function onGameCreated(payload: { gameId: string; yourRole: string; clockSeconds?: number }) {
      setMatched(payload.gameId, payload.yourRole as 'P1' | 'P2', clockSeconds)
      router.replace('/game/' + payload.gameId)
    }

    socket.on(SERVER_EVENTS.GAME_CREATED, onGameCreated)
    return () => {
      socket.off(SERVER_EVENTS.GAME_CREATED, onGameCreated)
    }
  }, [isInviteMode, gameMode, clockSeconds])

  // ── Invite flow ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isInviteMode) return

    reset()
    socket.emit(SOCKET_EVENTS.CREATE_PRIVATE_GAME, { mode: gameMode, clockSeconds })

    function onPrivateGameCreated(payload: { code: string }) {
      setCode(payload.code)
    }

    function onGameCreated(payload: { gameId: string; yourRole: string; clockSeconds?: number }) {
      setMatched(payload.gameId, payload.yourRole as 'P1' | 'P2', clockSeconds)
      router.replace('/game/' + payload.gameId)
    }

    socket.on(SERVER_EVENTS.PRIVATE_GAME_CREATED, onPrivateGameCreated)
    socket.on(SERVER_EVENTS.GAME_CREATED, onGameCreated)
    return () => {
      socket.off(SERVER_EVENTS.PRIVATE_GAME_CREATED, onPrivateGameCreated)
      socket.off(SERVER_EVENTS.GAME_CREATED, onGameCreated)
    }
  }, [isInviteMode, gameMode, clockSeconds])

  const handleCancel = useCallback(() => {
    socket.emit(SOCKET_EVENTS.LEAVE_QUEUE)
    reset()
    router.back()
  }, [socket, reset])

  const handleCopyLink = useCallback(async () => {
    if (!code) return
    // Use the same base URL the socket connects to in production
    const baseUrl = __DEV__ ? 'http://localhost:8081' : 'https://cavatrapi-server.vercel.app'
    const link = baseUrl + '/join/' + code
    await Clipboard.setStringAsync(link)
  }, [code])

  const modeLabelText =
    gameMode === 'SUDDEN_DEATH' ? 'SUDDEN DEATH' : 'AREA CONTROL'

  // ── FIND MATCH screen ────────────────────────────────────────────────────────
  if (!isInviteMode) {
    return (
      <View style={styles.bg}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => { socket.emit(SOCKET_EVENTS.LEAVE_QUEUE); reset(); router.back() }}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color="#1e293b" />
            </Pressable>
            <Text style={styles.headerTitle}>FIND MATCH</Text>
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.push('/how-to-play')}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="help-circle-outline" size={20} color="#1e293b" />
            </Pressable>
          </View>

          {/* VS panel */}
          <View style={styles.vsPanel}>
            <View style={styles.playerSlot}>
              <View style={[styles.playerPill, styles.playerPillP1]}>
                <Text style={styles.playerPillLabel}>YOU</Text>
              </View>
              <Text style={styles.playerName} numberOfLines={1}>
                {displayName ?? 'PLAYER'}
              </Text>
            </View>

            <Text style={styles.vsText}>VS</Text>

            <View style={styles.playerSlot}>
              <View style={[styles.playerPill, styles.playerPillP2]}>
                <Text style={[styles.playerPillLabel, styles.playerPillLabelP2]}>OPPONENT</Text>
              </View>
              <ActivityIndicator size="small" color="#facc15" />
            </View>
          </View>

          {/* Mode badge */}
          <View style={styles.modeBadgeRow}>
            <View style={styles.modeBadge}>
              <Text style={styles.modeBadgeText}>{modeLabelText}</Text>
            </View>
          </View>

          {/* Action button */}
          {!cancelled ? (
            <Pressable
              style={[styles.searchingBtn]}
              onPress={() => { setCancelled(true); handleCancel() }}
            >
              <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.searchingBtnText}>SEARCHING...</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </Pressable>
          )}
        </View>
      </View>
    )
  }

  // ── INVITE screen ────────────────────────────────────────────────────────────
  return (
    <View style={styles.bg}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.iconBtn}
            onPress={handleCancel}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#1e293b" />
          </Pressable>
          <Text style={styles.headerTitle}>INVITE FRIEND</Text>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push('/how-to-play')}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="help-circle-outline" size={20} color="#1e293b" />
          </Pressable>
        </View>

        {/* Subtitle */}
        <Text style={styles.waitingSubtitle}>WAITING FOR FRIEND</Text>

        {/* Code display */}
        {code ? (
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{code}</Text>
          </View>
        ) : (
          <View style={styles.codeBox}>
            <ActivityIndicator size="large" color="#8b5cf6" />
          </View>
        )}

        {/* Mode badge */}
        <View style={styles.modeBadgeRow}>
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>{modeLabelText}</Text>
          </View>
        </View>

        {/* Copy link button */}
        <Pressable
          style={({ pressed }) => [styles.copyBtn, pressed && styles.copyBtnPressed, !code && styles.copyBtnDisabled]}
          onPress={handleCopyLink}
          disabled={!code}
        >
          <MaterialCommunityIcons name="content-copy" size={18} color="#1e293b" />
          <Text style={styles.copyBtnText}>COPY INVITE LINK</Text>
        </Pressable>

        {/* Cancel button */}
        <Pressable style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>CANCEL</Text>
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
    padding: 28,
    width: '100%',
    maxWidth: 380,
    gap: 20,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#1e293b',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '900',
    fontSize: 18,
    color: '#1e293b',
    letterSpacing: 2,
  },
  vsPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#e2e8f0',
    padding: 20,
  },
  playerSlot: {
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  playerPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#1e293b',
    minWidth: 60,
    alignItems: 'center',
  },
  playerPillP1: {
    backgroundColor: '#8b5cf6',
  },
  playerPillP2: {
    backgroundColor: '#facc15',
  },
  playerPillLabel: {
    fontWeight: '800',
    fontSize: 11,
    color: '#ffffff',
    letterSpacing: 2,
  },
  playerPillLabelP2: {
    color: '#1e293b',
  },
  playerName: {
    fontWeight: '800',
    fontSize: 13,
    color: '#1e293b',
    letterSpacing: 1,
    maxWidth: 100,
    textAlign: 'center',
  },
  vsText: {
    fontWeight: '900',
    fontSize: 32,
    color: '#ef4444',
    letterSpacing: 2,
    ...Platform.select({
      web: { textShadow: '3px 3px 0 #1e293b' },
      default: {},
    }),
  },
  modeBadgeRow: {
    alignItems: 'center',
  },
  modeBadge: {
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modeBadgeText: {
    fontWeight: '800',
    fontSize: 11,
    color: '#475569',
    letterSpacing: 2,
  },
  searchingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 28,
    borderWidth: 4,
    borderColor: '#1e293b',
    paddingVertical: 16,
    paddingHorizontal: 24,
    opacity: 0.85,
  },
  searchingBtnText: {
    fontWeight: '900',
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 2,
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#ef4444',
    paddingVertical: 14,
    backgroundColor: '#fff1f2',
    minHeight: 44,
  },
  cancelBtnText: {
    fontWeight: '800',
    fontSize: 16,
    color: '#ef4444',
    letterSpacing: 2,
  },
  waitingSubtitle: {
    fontWeight: '800',
    fontSize: 13,
    color: '#475569',
    letterSpacing: 2,
    textAlign: 'center',
  },
  codeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#1e293b',
    backgroundColor: '#f8fafc',
    paddingVertical: 28,
    paddingHorizontal: 20,
    minHeight: 100,
  },
  codeText: {
    fontWeight: '900',
    fontSize: 48,
    color: '#1e293b',
    letterSpacing: 8,
    textAlign: 'center',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4ade80',
    borderRadius: 28,
    borderWidth: 4,
    borderColor: '#1e293b',
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 44,
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
  copyBtnPressed: {
    transform: [{ translateX: 4 }, { translateY: 4 }],
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: { shadowOffset: { width: 0, height: 0 }, elevation: 0 },
    }),
  },
  copyBtnDisabled: {
    opacity: 0.5,
  },
  copyBtnText: {
    fontWeight: '900',
    fontSize: 16,
    color: '#1e293b',
    letterSpacing: 2,
  },
})
