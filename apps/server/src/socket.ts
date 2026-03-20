import type { Server, Socket } from 'socket.io'
import { SOCKET_EVENTS, SERVER_EVENTS } from '@cavatrapi/shared'
import type { GameMode, Player } from '@cavatrapi/shared'
import { applyMove, getValidMoves } from '@cavatrapi/engine'
import type { Square } from '@cavatrapi/engine'
import { chooseBestMove } from '@cavatrapi/ai'
import type { AIDifficulty } from '@cavatrapi/ai'
import { saveGameSession, upsertPlayer } from './db.js'
import type { VerifiedUser } from './auth.js'
import {
  tryMatch,
  leaveQueue,
  createSession,
  getSessionBySocket,
  removeSession,
  commitTurnTime,
  currentPlayerTimeLeft,
  type GameSession,
} from './session.js'

// ─── Payload types ────────────────────────────────────────────────────────────

interface JoinGamePayload {
  mode: GameMode
  clockSeconds: 15 | 30 | 45
}

interface SubmitMovePayload {
  gameId: string
  to: Square
}

interface ResignPayload {
  gameId: string
}

interface RequestAIMovePayload {
  gameId: string
  difficulty?: AIDifficulty
}

// ─── Auth registry ────────────────────────────────────────────────────────────
// Maps socketId → VerifiedUser so we can look up both players at match time.
const socketUsers = new Map<string, VerifiedUser>()

// ─── Pending private rooms ────────────────────────────────────────────────────
interface PendingRoom {
  socketId: string
  mode: GameMode
  clockSeconds: number
  expiresAt: number
}
const pendingRooms = new Map<string, PendingRoom>()

// Expire rooms older than 10 minutes
setInterval(() => {
  const now = Date.now()
  pendingRooms.forEach((room, code) => {
    if (room.expiresAt < now) pendingRooms.delete(code)
  })
}, 5 * 60 * 1000)

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fire-and-forget: persist a completed game to Supabase.
 * Only runs when both player Clerk IDs are available (populated in Phase 5).
 * Errors are logged but never surfaced to the client.
 */
function persistGame(session: GameSession, winnerId: string | null): void {
  if (!session.playerIds) return
  const durationSeconds = Math.round((Date.now() - session.startedAt) / 1000)
  saveGameSession({
    mode: session.mode,
    p1Id: session.playerIds.P1,
    p2Id: session.playerIds.P2,
    winnerId,
    moveCount: session.state.moveCount,
    durationSeconds,
  }).catch((err: unknown) => {
    console.error('[db] saveGameSession failed:', err)
  })
}

function playerRole(session: GameSession, socketId: string): Player | null {
  if (session.socketIds.P1 === socketId) return 'P1'
  if (session.socketIds.P2 === socketId) return 'P2'
  return null
}

function broadcastState(io: Server, session: GameSession): void {
  const { gameId, state, timeLeftMs, socketIds } = session

  // Each player receives the full state + their own time context
  for (const [role, socketId] of Object.entries(socketIds) as [Player, string][]) {
    const timeLeft = role === state.currentTurn
      ? currentPlayerTimeLeft(session)
      : timeLeftMs[role === 'P1' ? 'P2' : 'P1']

    io.to(socketId).emit(SERVER_EVENTS.GAME_STATE, {
      gameId,
      state,
      validMoves: state.currentTurn === role ? getValidMoves(state, role) : [],
      yourRole: role,
      timeLeftMs: {
        P1: role === 'P1' ? timeLeft : timeLeftMs.P1,
        P2: role === 'P2' ? timeLeft : timeLeftMs.P2,
      },
    })
  }
}

function startTurnTimer(io: Server, session: GameSession): void {
  if (session.tickInterval) clearInterval(session.tickInterval)

  session.tickInterval = setInterval(() => {
    const remaining = currentPlayerTimeLeft(session)

    if (remaining <= 0) {
      // Time expired — current player loses
      clearInterval(session.tickInterval!)
      session.tickInterval = null

      const loser = session.state.currentTurn
      const winner: Player = loser === 'P1' ? 'P2' : 'P1'
      const status = winner === 'P1' ? 'P1_WINS' : 'P2_WINS'

      session.state = { ...session.state, status }

      io.to(session.socketIds.P1).emit(SERVER_EVENTS.GAME_OVER, {
        gameId: session.gameId,
        winner,
        reason: 'timeout',
        state: session.state,
      })
      io.to(session.socketIds.P2).emit(SERVER_EVENTS.GAME_OVER, {
        gameId: session.gameId,
        winner,
        reason: 'timeout',
        state: session.state,
      })

      persistGame(session, session.playerIds?.[winner] ?? null)
      removeSession(session.gameId)
    }
  }, 500)
}

// ─── Handler registration ─────────────────────────────────────────────────────

export function registerSocketHandlers(io: Server, socket: Socket, user: VerifiedUser | null): void {
  // Register this socket's verified identity (may be null for guests)
  if (user) {
    socketUsers.set(socket.id, user)
    // Fire-and-forget: ensure player row exists in Supabase
    upsertPlayer({ id: user.userId, username: user.username ?? 'Player', avatar_url: null })
      .catch((err: unknown) => console.error('[db] upsertPlayer failed:', err))
  }

  // ── JOIN_GAME ──────────────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.JOIN_GAME, (payload: JoinGamePayload) => {
    const { mode, clockSeconds } = payload
    const matched = tryMatch(socket.id, mode, clockSeconds)

    if (!matched) {
      // Waiting for an opponent
      socket.emit('waiting_for_opponent', { mode, clockSeconds })
      return
    }

    // Pair found — create session
    const session = createSession(matched.socketId, socket.id, mode, clockSeconds)
    const { gameId, socketIds } = session

    // Populate playerIds if both sockets are authenticated
    const p1User = socketUsers.get(socketIds.P1)
    const p2User = socketUsers.get(socketIds.P2)
    if (p1User && p2User) {
      session.playerIds = { P1: p1User.userId, P2: p2User.userId }
    }

    // Join socket rooms
    io.sockets.sockets.get(socketIds.P1)?.join(gameId)
    io.sockets.sockets.get(socketIds.P2)?.join(gameId)

    // Notify both players
    io.to(socketIds.P1).emit(SERVER_EVENTS.GAME_CREATED, {
      gameId,
      yourRole: 'P1',
      opponentSocketId: socketIds.P2,
    })
    io.to(socketIds.P2).emit(SERVER_EVENTS.GAME_CREATED, {
      gameId,
      yourRole: 'P2',
      opponentSocketId: socketIds.P1,
    })

    broadcastState(io, session)
    startTurnTimer(io, session)
  })

  // ── CREATE_PRIVATE_GAME ────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.CREATE_PRIVATE_GAME, (payload: { mode: GameMode; clockSeconds: number }) => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    pendingRooms.set(code, {
      socketId: socket.id,
      mode: payload.mode,
      clockSeconds: payload.clockSeconds,
      expiresAt: Date.now() + 10 * 60 * 1000,
    })
    socket.emit(SERVER_EVENTS.PRIVATE_GAME_CREATED, { code })
  })

  // ── JOIN_PRIVATE_GAME ──────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.JOIN_PRIVATE_GAME, async (payload: { code: string }) => {
    const room = pendingRooms.get(payload.code)
    if (!room) {
      socket.emit(SERVER_EVENTS.PRIVATE_GAME_ERROR, { reason: 'not_found' })
      return
    }
    if (room.expiresAt < Date.now()) {
      pendingRooms.delete(payload.code)
      socket.emit(SERVER_EVENTS.PRIVATE_GAME_ERROR, { reason: 'expired' })
      return
    }

    const hostSocket = io.sockets.sockets.get(room.socketId)
    if (!hostSocket) {
      pendingRooms.delete(payload.code)
      socket.emit(SERVER_EVENTS.PRIVATE_GAME_ERROR, { reason: 'host_left' })
      return
    }

    pendingRooms.delete(payload.code)

    // Create game session — same pattern as JOIN_GAME matchmaking
    // P1 = host (room.socketId), P2 = joiner (socket.id)
    const session = createSession(room.socketId, socket.id, room.mode, room.clockSeconds)
    const { gameId, socketIds } = session

    // Populate playerIds if both sockets are authenticated
    const p1User = socketUsers.get(socketIds.P1)
    const p2User = socketUsers.get(socketIds.P2)
    if (p1User && p2User) {
      session.playerIds = { P1: p1User.userId, P2: p2User.userId }
    }

    // Join socket rooms
    io.sockets.sockets.get(socketIds.P1)?.join(gameId)
    io.sockets.sockets.get(socketIds.P2)?.join(gameId)

    // Notify both players
    io.to(socketIds.P1).emit(SERVER_EVENTS.GAME_CREATED, {
      gameId,
      yourRole: 'P1',
      opponentSocketId: socketIds.P2,
    })
    io.to(socketIds.P2).emit(SERVER_EVENTS.GAME_CREATED, {
      gameId,
      yourRole: 'P2',
      opponentSocketId: socketIds.P1,
    })

    broadcastState(io, session)
    startTurnTimer(io, session)
  })

  // ── SUBMIT_MOVE ────────────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.SUBMIT_MOVE, (payload: SubmitMovePayload) => {
    const session = getSessionBySocket(socket.id)
    if (!session || session.gameId !== payload.gameId) {
      socket.emit(SERVER_EVENTS.MOVE_REJECTED, { reason: 'game_not_found' })
      return
    }

    const role = playerRole(session, socket.id)
    if (!role) {
      socket.emit(SERVER_EVENTS.MOVE_REJECTED, { reason: 'not_a_player' })
      return
    }

    try {
      commitTurnTime(session)
      const result = applyMove(session.state, role, payload.to)
      session.state = result.nextState
      session.turnStartedAt = Date.now()

      socket.emit(SERVER_EVENTS.MOVE_ACCEPTED, { gameId: session.gameId, to: payload.to })

      if (result.isGameOver) {
        if (session.tickInterval) clearInterval(session.tickInterval)

        io.to(session.gameId).emit(SERVER_EVENTS.GAME_OVER, {
          gameId: session.gameId,
          winner: result.winner,
          reason: 'normal',
          state: session.state,
        })

        const winnerPlayerId = (result.winner === 'P1' || result.winner === 'P2')
          ? (session.playerIds?.[result.winner] ?? null)
          : null
        persistGame(session, winnerPlayerId)
        removeSession(session.gameId)
      } else {
        broadcastState(io, session)
        startTurnTimer(io, session)

        io.to(session.gameId).emit(SERVER_EVENTS.TURN_STARTED, {
          gameId: session.gameId,
          currentTurn: session.state.currentTurn,
        })
      }
    } catch (err: unknown) {
      socket.emit(SERVER_EVENTS.MOVE_REJECTED, {
        reason: 'invalid_move',
        detail: err instanceof Error ? err.message : String(err),
      })
    }
  })

  // ── RESIGN ─────────────────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.RESIGN, (payload: ResignPayload) => {
    const session = getSessionBySocket(socket.id)
    if (!session || session.gameId !== payload.gameId) return

    const role = playerRole(session, socket.id)
    if (!role) return

    const winner: Player = role === 'P1' ? 'P2' : 'P1'
    const status = winner === 'P1' ? 'P1_WINS' : 'P2_WINS'

    session.state = { ...session.state, status }

    if (session.tickInterval) clearInterval(session.tickInterval)

    io.to(session.gameId).emit(SERVER_EVENTS.GAME_OVER, {
      gameId: session.gameId,
      winner,
      reason: 'resign',
      state: session.state,
    })

    persistGame(session, session.playerIds?.[winner] ?? null)
    removeSession(session.gameId)
  })

  // ── REQUEST_AI_MOVE ────────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.REQUEST_AI_MOVE, (payload: RequestAIMovePayload) => {
    const session = getSessionBySocket(socket.id)
    if (!session || session.gameId !== payload.gameId) return

    const role = playerRole(session, socket.id)
    if (!role || session.state.currentTurn !== role) return

    const validMoves = getValidMoves(session.state, role)
    if (validMoves.length === 0) return

    const difficulty = payload.difficulty ?? 'MEDIUM'
    const { move } = chooseBestMove(session.state, role, difficulty)
    const gameId = session.gameId

    // 500ms display delay before emitting so the move feels deliberate
    setTimeout(() => {
      const current = getSessionBySocket(socket.id)
      if (!current || current.gameId !== gameId) return
      socket.emit(SOCKET_EVENTS.SUBMIT_MOVE, { gameId, to: move })
    }, 500)
  })

  // ── DISCONNECT ─────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    socketUsers.delete(socket.id)
    leaveQueue(socket.id)

    const session = getSessionBySocket(socket.id)
    if (!session) return

    const role = playerRole(session, socket.id)
    if (!role) return

    const opponentSocketId = session.socketIds[role === 'P1' ? 'P2' : 'P1']

    io.to(opponentSocketId).emit(SERVER_EVENTS.OPPONENT_DISCONNECTED, {
      gameId: session.gameId,
    })

    // Give opponent 30s to reconnect — for now, just end the game
    // TODO: implement reconnection window
    const winner: Player = role === 'P1' ? 'P2' : 'P1'
    const status = winner === 'P1' ? 'P1_WINS' : 'P2_WINS'

    session.state = { ...session.state, status }
    if (session.tickInterval) clearInterval(session.tickInterval)

    io.to(opponentSocketId).emit(SERVER_EVENTS.GAME_OVER, {
      gameId: session.gameId,
      winner,
      reason: 'opponent_disconnected',
      state: session.state,
    })

    removeSession(session.gameId)
  })
}
