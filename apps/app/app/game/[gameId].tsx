import { useEffect, useRef, useCallback, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Platform, useWindowDimensions, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { usePostHog } from 'posthog-react-native'
import { useGameStore } from '../../stores/gameStore'
import { useNetworkGameStore } from '../../stores/networkGameStore'
import { useAuthStore } from '../../stores/authStore'
import { useSocket } from '../../hooks/useSocket'
import { Board } from '../../components/Board'
import { PlayerPanel } from '../../components/PlayerPanel'
import { SOCKET_EVENTS, SERVER_EVENTS } from '@cavatrapi/shared'
import type { GameMode, Player } from '@cavatrapi/shared'
import type { Square, BoardState } from '@cavatrapi/engine'
import { chooseBestMove, AI_DISPLAY_DELAY_MS } from '@cavatrapi/ai'
import type { AIDifficulty } from '@cavatrapi/ai'

// ─── Local game screen ────────────────────────────────────────────────────────

function LocalGameScreen({ mode, clock }: { mode: GameMode; clock: number }) {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const { board, validMoves, turnStartedAt, clockSeconds, gameOver, initGame, makeMove, tickTimer, resign } =
    useGameStore()
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const posthog = usePostHog()

  useEffect(() => {
    initGame(mode, clock as 15 | 30 | 45)
    posthog?.capture('game_started', { mode, clock_seconds: clock, game_type: 'local' })
  }, [])

  useEffect(() => {
    tickRef.current = setInterval(() => tickTimer(), 500)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [])

  useEffect(() => {
    if (!gameOver) return
    if (tickRef.current) clearInterval(tickRef.current)
    posthog?.capture('game_ended', {
      mode,
      winner: gameOver.winner,
      reason: gameOver.reason,
      game_type: 'local',
    })
  }, [gameOver])

  const cellSize = Math.floor((Math.min(width, 420) - 60) / 8)

  if (!board) {
    return (
      <View style={styles.bg}>
        <Text style={styles.loading}>Loading…</Text>
      </View>
    )
  }

  const activePlayer = board.currentTurn
  const p1Claimed = board.claimed.flat().filter((c) => c === 'P1').length
  const p2Claimed = board.claimed.flat().filter((c) => c === 'P2').length
  const p1Trapped = board.trappedOrder.includes('P1')
  const p2Trapped = board.trappedOrder.includes('P2')

  const fullMs = clockSeconds * 1000
  const activeTurnMs = Math.max(0, fullMs - (Date.now() - turnStartedAt))
  const liveP1 = activePlayer === 'P1' ? activeTurnMs : fullMs
  const liveP2 = activePlayer === 'P2' ? activeTurnMs : fullMs

  function handleResign() {
    if (!board) return
    if (Platform.OS === 'web') { resign(board.currentTurn); return }
    Alert.alert('Resign?', 'Forfeit this game?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Resign', style: 'destructive', onPress: () => resign(board.currentTurn) },
    ])
  }

  return (
    <GameLayout
      board={board}
      validMoves={gameOver ? [] : validMoves}
      cellSize={cellSize}
      onMove={(sq) => {
        posthog?.capture('move_made', { mode, move_count: board.moveCount + 1, game_type: 'local' })
        makeMove(sq)
      }}
      onResign={handleResign}
      p1={{ name: 'Player 1', isActive: activePlayer === 'P1' && !gameOver, timeLeftMs: liveP1, clockSeconds, claimedCount: p1Claimed, isTrapped: p1Trapped }}
      p2={{ name: 'Player 2', isActive: activePlayer === 'P2' && !gameOver, timeLeftMs: liveP2, clockSeconds, claimedCount: p2Claimed, isTrapped: p2Trapped }}
      gameOver={gameOver}
      onRematch={() => { useGameStore.getState().reset(); router.replace('/lobby') }}
      onMainMenu={() => { useGameStore.getState().reset(); router.replace('/') }}
    />
  )
}

// ─── Network game screen ──────────────────────────────────────────────────────

function NetworkGameScreen({ gameId }: { gameId: string }) {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const socket = useSocket()
  const {
    board, validMoves, yourRole, clockSeconds, timeLeftMs, turnStartedAt,
    gameOver, applyServerState, setGameOver, reset,
  } = useNetworkGameStore()
  const posthog = usePostHog()
  const gameStartedRef = useRef(false)

  // Attach socket listeners for this game
  useEffect(() => {
    function onGameState(payload: {
      state: BoardState | null
      validMoves: Square[]
      timeLeftMs: Record<Player, number>
    }) {
      if (!payload.state) return
      applyServerState(payload.state, payload.validMoves, payload.timeLeftMs)
      // Capture game_started on first state arrival
      if (!gameStartedRef.current) {
        gameStartedRef.current = true
        posthog?.capture('game_started', {
          mode: payload.state.mode,
          clock_seconds: clockSeconds,
          game_type: 'network',
          your_role: yourRole,
        })
      }
    }

    function onGameOver(payload: { winner: Player | null; reason: string }) {
      type Reason = 'normal' | 'timeout' | 'resign' | 'opponent_disconnected'
      const reason = (payload.reason as Reason) ?? 'normal'
      const winner = (payload.winner ?? 'draw') as Player | 'draw'
      const result = { winner, reason }
      setGameOver(result)
      posthog?.capture('game_ended', {
        mode: board?.mode ?? null,
        winner: result.winner,
        reason: result.reason,
        did_win: result.winner === yourRole,
        move_count: board?.moveCount ?? null,
        game_type: 'network',
      })
    }

    socket.on(SERVER_EVENTS.GAME_STATE, onGameState)
    socket.on(SERVER_EVENTS.GAME_OVER, onGameOver)
    socket.on(SERVER_EVENTS.OPPONENT_DISCONNECTED, () => {
      // Game over event follows immediately from server; just surface a brief note
    })

    return () => {
      socket.off(SERVER_EVENTS.GAME_STATE, onGameState)
      socket.off(SERVER_EVENTS.GAME_OVER, onGameOver)
    }
  }, [gameId])

  const handleMove = useCallback((sq: Square) => {
    if (!board || !yourRole || board.currentTurn !== yourRole) return
    posthog?.capture('move_made', { mode: board.mode, move_count: board.moveCount + 1, game_type: 'network' })
    socket.emit(SOCKET_EVENTS.SUBMIT_MOVE, { gameId, to: sq })
  }, [board, yourRole, gameId])

  const handleResign = useCallback(() => {
    function doResign() { socket.emit(SOCKET_EVENTS.RESIGN, { gameId }) }
    if (Platform.OS === 'web') { doResign(); return }
    Alert.alert('Resign?', 'Forfeit this game?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Resign', style: 'destructive', onPress: doResign },
    ])
  }, [gameId])

  const cellSize = Math.floor((Math.min(width, 420) - 60) / 8)

  if (!board) {
    return (
      <View style={styles.bg}>
        <Text style={styles.loading}>Connecting…</Text>
      </View>
    )
  }

  const activePlayer = board.currentTurn
const p1Claimed = board.claimed.flat().filter((c) => c === 'P1').length
  const p2Claimed = board.claimed.flat().filter((c) => c === 'P2').length
  const p1Trapped = board.trappedOrder.includes('P1')
  const p2Trapped = board.trappedOrder.includes('P2')

  // Interpolate active player timer locally; inactive player shows last known value
  const activeMs = Math.max(0, timeLeftMs[activePlayer] - (Date.now() - turnStartedAt))
  const liveP1 = activePlayer === 'P1' ? activeMs : timeLeftMs.P1
  const liveP2 = activePlayer === 'P2' ? activeMs : timeLeftMs.P2

  // Only allow moves when it's your turn
  const myValidMoves = yourRole === activePlayer && !gameOver ? validMoves : []

  const youAreP1 = yourRole === 'P1'
  return (
    <GameLayout
      board={board}
      validMoves={myValidMoves}
      cellSize={cellSize}
      onMove={handleMove}
      onResign={handleResign}
      p1={{
        name: youAreP1 ? 'YOU' : 'OPPONENT',
        isActive: activePlayer === 'P1' && !gameOver,
        timeLeftMs: liveP1,
        clockSeconds,
        claimedCount: p1Claimed,
        isTrapped: p1Trapped,
        isYou: youAreP1,
      }}
      p2={{
        name: youAreP1 ? 'OPPONENT' : 'YOU',
        isActive: activePlayer === 'P2' && !gameOver,
        timeLeftMs: liveP2,
        clockSeconds,
        claimedCount: p2Claimed,
        isTrapped: p2Trapped,
        isYou: !youAreP1,
      }}
      gameOver={gameOver}
      onRematch={() => { reset(); router.replace('/lobby') }}
      onMainMenu={() => { reset(); router.replace('/') }}
      yourRole={yourRole}
    />
  )
}

// ─── AI game screen ───────────────────────────────────────────────────────────

function AIGameScreen({ mode, clock, difficulty }: { mode: GameMode; clock: number; difficulty: AIDifficulty }) {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const { board, validMoves, turnStartedAt, clockSeconds, gameOver, initGame, makeMove, tickTimer, resign } =
    useGameStore()
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const posthog = usePostHog()
  const [isAIThinking, setIsAIThinking] = useState(false)
  const displayName = useAuthStore((s) => s.displayName)

  useEffect(() => {
    initGame(mode, clock as 15 | 30 | 45)
    posthog?.capture('game_started', { mode, clock_seconds: clock, game_type: 'ai', difficulty })
  }, [])

  useEffect(() => {
    tickRef.current = setInterval(() => tickTimer(), 500)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [])

  useEffect(() => {
    if (!gameOver) return
    if (tickRef.current) clearInterval(tickRef.current)
    posthog?.capture('game_ended', {
      game_type: 'ai',
      difficulty,
      winner: gameOver.winner,
      reason: gameOver.reason,
      move_count: board?.moveCount ?? null,
    })
  }, [gameOver])

  // AI turn effect
  useEffect(() => {
    if (!board || board.status !== 'IN_PROGRESS') return
    if (board.currentTurn !== 'P2') return
    if (isAIThinking) return

    setIsAIThinking(true)
    const timer = setTimeout(() => {
      const result = chooseBestMove(board, 'P2', difficulty)
      if (result) makeMove(result.move)
      setIsAIThinking(false)
    }, AI_DISPLAY_DELAY_MS)

    return () => clearTimeout(timer)
  }, [board?.currentTurn, board?.moveCount])

  const cellSize = Math.floor((Math.min(width, 420) - 60) / 8)

  function handleResign() {
    if (!board) return
    if (Platform.OS === 'web') { resign('P1'); return }
    Alert.alert('Resign?', 'Forfeit this game?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Resign', style: 'destructive', onPress: () => resign('P1') },
    ])
  }

  if (!board) {
    return (
      <View style={styles.bg}>
        <Text style={styles.loading}>Loading…</Text>
      </View>
    )
  }

  const activePlayer = board.currentTurn
  const p1Claimed = board.claimed.flat().filter((c) => c === 'P1').length
  const p2Claimed = board.claimed.flat().filter((c) => c === 'P2').length
  const p1Trapped = board.trappedOrder.includes('P1')
  const p2Trapped = board.trappedOrder.includes('P2')

  const fullMs = clockSeconds * 1000
  const activeTurnMs = Math.max(0, fullMs - (Date.now() - turnStartedAt))
  const liveP1 = activePlayer === 'P1' ? activeTurnMs : fullMs
  const liveP2 = activePlayer === 'P2' ? activeTurnMs : fullMs

  // For AI, only show valid moves when it's P1's turn
  const myValidMoves = activePlayer === 'P1' && !gameOver ? validMoves : []

  return (
    <GameLayout
      board={board}
      validMoves={myValidMoves}
      cellSize={cellSize}
      onMove={(sq) => {
        posthog?.capture('move_made', { mode, move_count: board.moveCount + 1, game_type: 'ai' })
        makeMove(sq)
      }}
      onResign={handleResign}
      p1={{ name: displayName ?? 'YOU', isActive: activePlayer === 'P1' && !gameOver, timeLeftMs: liveP1, clockSeconds, claimedCount: p1Claimed, isTrapped: p1Trapped, isYou: true }}
      p2={{ name: isAIThinking ? 'THINKING...' : 'AI', isActive: activePlayer === 'P2' && !gameOver, timeLeftMs: liveP2, clockSeconds, claimedCount: p2Claimed, isTrapped: p2Trapped }}
      gameOver={gameOver}
      onRematch={() => { useGameStore.getState().reset(); router.replace('/') }}
      onMainMenu={() => { useGameStore.getState().reset(); router.replace('/') }}
    />
  )
}

// ─── Shared layout ────────────────────────────────────────────────────────────

interface PanelInfo {
  name: string
  isActive: boolean
  timeLeftMs: number
  clockSeconds: number
  claimedCount: number
  isTrapped: boolean
  isYou?: boolean
}

interface GameOverResult {
  winner: Player | 'draw'
  reason: string
}

function GameLayout({
  board,
  validMoves,
  cellSize,
  onMove,
  onResign,
  p1,
  p2,
  gameOver,
  onRematch,
  onMainMenu,
  yourRole,
}: {
  board: BoardState
  validMoves: Square[]
  cellSize: number
  onMove: (sq: Square) => void
  onResign: () => void
  p1: PanelInfo
  p2: PanelInfo
  gameOver: GameOverResult | null
  onRematch: () => void
  onMainMenu: () => void
  yourRole?: Player | null
}) {
  return (
    <View style={styles.bg}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerMove}>MOVE {board.moveCount + 1}</Text>
        <Text style={styles.headerMode}>
          {board.mode === 'SUDDEN_DEATH' ? 'SUDDEN DEATH' : 'AREA CONTROL'}
        </Text>
        <Pressable style={styles.resignBtn} onPress={onResign}>
          <MaterialCommunityIcons name="flag-outline" size={16} color="#ef4444" />
          <Text style={styles.resignText}>RESIGN</Text>
        </Pressable>
      </View>

      {/* P1 panel */}
      <View style={styles.panelRow}>
        <PlayerPanel
          player="P1"
          name={p1.name}
          isActive={p1.isActive}
          timeLeftMs={p1.timeLeftMs}
          clockSeconds={p1.clockSeconds}
          claimedCount={p1.claimedCount}
          isTrapped={p1.isTrapped}
        />
      </View>

      {/* Board */}
      <View style={styles.boardWrapper}>
        <Board
          state={board}
          validMoves={gameOver ? [] : validMoves}
          onMove={onMove}
          cellSize={cellSize}
        />
      </View>

      {/* P2 panel */}
      <View style={styles.panelRow}>
        <PlayerPanel
          player="P2"
          name={p2.name}
          isActive={p2.isActive}
          timeLeftMs={p2.timeLeftMs}
          clockSeconds={p2.clockSeconds}
          claimedCount={p2.claimedCount}
          isTrapped={p2.isTrapped}
        />
      </View>

      {/* Game Over overlay */}
      {gameOver && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <Text style={styles.overlayTitle}>
              {gameOver.winner === 'draw'
                ? 'DRAW!'
                : yourRole
                  ? gameOver.winner === yourRole ? 'YOU WIN!' : 'YOU LOSE'
                  : `${gameOver.winner} WINS!`}
            </Text>
            <Text style={styles.overlayReason}>
              {gameOver.reason === 'timeout' ? 'Time expired'
                : gameOver.reason === 'resign' ? 'Player resigned'
                : gameOver.reason === 'opponent_disconnected' ? 'Opponent disconnected'
                : 'No moves left'}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.overlayBtn, pressed && styles.overlayBtnPressed]}
              onPress={onRematch}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#1e293b" />
              <Text style={styles.overlayBtnText}>REMATCH</Text>
            </Pressable>
            <Pressable style={styles.overlaySecondary} onPress={onMainMenu}>
              <Text style={styles.overlaySecondaryText}>Main Menu</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  )
}

// ─── Route entry ─────────────────────────────────────────────────────────────

export default function GameScreen() {
  const { gameId, mode, clock, difficulty } = useLocalSearchParams<{
    gameId: string
    mode: string
    clock: string
    difficulty: string
  }>()

  if (gameId === 'local') {
    return (
      <LocalGameScreen
        mode={(mode as GameMode) ?? 'SUDDEN_DEATH'}
        clock={Number(clock ?? 30)}
      />
    )
  }

  if (gameId === 'ai') {
    return (
      <AIGameScreen
        mode={(mode as GameMode) ?? 'SUDDEN_DEATH'}
        clock={Number(clock ?? 30)}
        difficulty={(difficulty as AIDifficulty) ?? 'MEDIUM'}
      />
    )
  }

  return <NetworkGameScreen gameId={gameId} />
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#7dd3fc',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
    gap: 12,
  },
  loading: {
    fontWeight: '800',
    fontSize: 18,
    color: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerMove: {
    fontWeight: '900',
    fontSize: 14,
    color: '#1e293b',
    letterSpacing: 1,
  },
  headerMode: {
    fontWeight: '800',
    fontSize: 11,
    color: '#64748b',
    letterSpacing: 1.5,
  },
  resignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: '#ef4444',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  resignText: {
    fontWeight: '800',
    fontSize: 11,
    color: '#ef4444',
    letterSpacing: 1,
  },
  panelRow: {
    width: '100%',
  },
  boardWrapper: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#1e293b',
    padding: 10,
    ...Platform.select({
      web: { boxShadow: '8px 8px 0px #1e293b' },
      default: {
        shadowColor: '#1e293b',
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 8,
      },
    }),
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  overlayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    borderWidth: 5,
    borderColor: '#1e293b',
    padding: 32,
    alignItems: 'center',
    gap: 12,
    width: 280,
    ...Platform.select({
      web: { boxShadow: '8px 8px 0px #1e293b' },
      default: {
        shadowColor: '#1e293b',
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
    }),
  },
  overlayTitle: {
    fontWeight: '900',
    fontSize: 36,
    color: '#4ade80',
    letterSpacing: 2,
    ...Platform.select({
      web: { textShadow: '4px 4px 0 #1e293b' },
      default: {},
    }),
  },
  overlayReason: {
    fontWeight: '600',
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  overlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4ade80',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#1e293b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '4px 4px 0px #1e293b', cursor: 'pointer' },
      default: {
        shadowColor: '#1e293b',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
    }),
  },
  overlayBtnPressed: {
    transform: [{ translateX: 4 }, { translateY: 4 }],
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: { shadowOffset: { width: 0, height: 0 }, elevation: 0 },
    }),
  },
  overlayBtnText: {
    fontWeight: '900',
    fontSize: 16,
    color: '#1e293b',
    letterSpacing: 2,
  },
  overlaySecondary: { paddingVertical: 8 },
  overlaySecondaryText: {
    fontWeight: '700',
    fontSize: 14,
    color: '#64748b',
  },
})
