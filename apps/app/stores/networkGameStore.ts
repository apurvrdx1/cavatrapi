import { create } from 'zustand'
import type { BoardState } from '@cavatrapi/engine'
import type { Player, Square } from '@cavatrapi/shared'
import type { GameOverResult } from './gameStore'

export type MatchmakingStatus = 'idle' | 'waiting' | 'matched'

interface NetworkGameStore {
  // Matchmaking
  matchmakingStatus: MatchmakingStatus

  // Game
  gameId: string | null
  yourRole: Player | null
  board: BoardState | null
  validMoves: Square[]
  clockSeconds: number
  /** Time left in ms for each player (from server) */
  timeLeftMs: Record<Player, number>
  turnStartedAt: number
  gameOver: GameOverResult | null

  // Actions
  setWaiting: () => void
  setMatched: (gameId: string, role: Player, clockSeconds: number) => void
  applyServerState: (board: BoardState, validMoves: Square[], timeLeftMs: Record<Player, number>) => void
  setGameOver: (result: GameOverResult) => void
  reset: () => void
}

const DEFAULT: Pick<NetworkGameStore,
  'matchmakingStatus' | 'gameId' | 'yourRole' | 'board' | 'validMoves' |
  'clockSeconds' | 'timeLeftMs' | 'turnStartedAt' | 'gameOver'
> = {
  matchmakingStatus: 'idle',
  gameId: null,
  yourRole: null,
  board: null,
  validMoves: [],
  clockSeconds: 30,
  timeLeftMs: { P1: 30_000, P2: 30_000 },
  turnStartedAt: 0,
  gameOver: null,
}

export const useNetworkGameStore = create<NetworkGameStore>((set) => ({
  ...DEFAULT,

  setWaiting: () => set({ matchmakingStatus: 'waiting' }),

  setMatched: (gameId, yourRole, clockSeconds) =>
    set({ matchmakingStatus: 'matched', gameId, yourRole, clockSeconds }),

  applyServerState: (board, validMoves, timeLeftMs) =>
    set({ board, validMoves, timeLeftMs, turnStartedAt: Date.now() }),

  setGameOver: (result) =>
    set({ gameOver: result, validMoves: [] }),

  reset: () => set({ ...DEFAULT }),
}))
