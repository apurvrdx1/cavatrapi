import type { GameMode, Player } from '@cavatrapi/shared'
import type { BoardState } from '@cavatrapi/engine'
import { createInitialBoard } from '@cavatrapi/engine'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GameSession {
  gameId: string
  mode: GameMode
  /** Seconds per turn for each player */
  clockSeconds: number
  state: BoardState
  /** Map player role → socket id */
  socketIds: Record<Player, string>
  /** Remaining clock in ms for each player */
  timeLeftMs: Record<Player, number>
  /** When the current turn started (Date.now()) */
  turnStartedAt: number
  /** When the game started (Date.now()) — used for duration_seconds on save */
  startedAt: number
  tickInterval: ReturnType<typeof setInterval> | null
  /** Clerk user IDs — populated after JWT auth (Phase 5). Null until then. */
  playerIds: Record<Player, string> | null
}

export interface QueueEntry {
  socketId: string
  mode: GameMode
  clockSeconds: number
  joinedAt: number
}

// ─── Store ────────────────────────────────────────────────────────────────────

const sessions = new Map<string, GameSession>()
/** socketId → gameId (for quick reverse lookup on disconnect) */
const socketToGame = new Map<string, string>()
/** Waiting players, keyed by `${mode}:${clockSeconds}` */
const queues = new Map<string, QueueEntry>()

// ─── Session CRUD ─────────────────────────────────────────────────────────────

let nextId = 1

export function createSession(
  p1SocketId: string,
  p2SocketId: string,
  mode: GameMode,
  clockSeconds: number,
): GameSession {
  const gameId = `game-${nextId++}`
  const timeLeftMs = clockSeconds * 1000

  const session: GameSession = {
    gameId,
    mode,
    clockSeconds,
    state: createInitialBoard(mode),
    socketIds: { P1: p1SocketId, P2: p2SocketId },
    timeLeftMs: { P1: timeLeftMs, P2: timeLeftMs },
    turnStartedAt: Date.now(),
    startedAt: Date.now(),
    tickInterval: null,
    playerIds: null,
  }

  sessions.set(gameId, session)
  socketToGame.set(p1SocketId, gameId)
  socketToGame.set(p2SocketId, gameId)

  return session
}

export function getSession(gameId: string): GameSession | undefined {
  return sessions.get(gameId)
}

export function getSessionBySocket(socketId: string): GameSession | undefined {
  const gameId = socketToGame.get(socketId)
  return gameId ? sessions.get(gameId) : undefined
}

export function removeSession(gameId: string): void {
  const session = sessions.get(gameId)
  if (!session) return
  if (session.tickInterval) clearInterval(session.tickInterval)
  socketToGame.delete(session.socketIds.P1)
  socketToGame.delete(session.socketIds.P2)
  sessions.delete(gameId)
}

// ─── Matchmaking queue ────────────────────────────────────────────────────────

function queueKey(mode: GameMode, clockSeconds: number): string {
  return `${mode}:${clockSeconds}`
}

/**
 * Try to pair the incoming player with a waiting opponent.
 * Returns the matched QueueEntry if a pair was formed, or null if queued.
 */
export function tryMatch(
  socketId: string,
  mode: GameMode,
  clockSeconds: number,
): QueueEntry | null {
  const key = queueKey(mode, clockSeconds)
  const waiting = queues.get(key)

  if (waiting && waiting.socketId !== socketId) {
    queues.delete(key)
    return waiting
  }

  // No match — add to queue
  queues.set(key, { socketId, mode, clockSeconds, joinedAt: Date.now() })
  return null
}

export function leaveQueue(socketId: string): void {
  for (const [key, entry] of queues) {
    if (entry.socketId === socketId) {
      queues.delete(key)
      return
    }
  }
}

// ─── Clock helpers ────────────────────────────────────────────────────────────

/** Returns remaining ms for the current player, accounting for elapsed time. */
export function currentPlayerTimeLeft(session: GameSession): number {
  const player = session.state.currentTurn
  const elapsed = Date.now() - session.turnStartedAt
  return Math.max(0, session.timeLeftMs[player] - elapsed)
}

/** Consumes elapsed time from the active player and resets the turn clock. */
export function commitTurnTime(session: GameSession): void {
  const player = session.state.currentTurn
  const elapsed = Date.now() - session.turnStartedAt
  session.timeLeftMs[player] = Math.max(0, session.timeLeftMs[player] - elapsed)
  session.turnStartedAt = Date.now()
}
