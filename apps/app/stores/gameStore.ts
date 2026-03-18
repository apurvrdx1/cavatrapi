import { create } from 'zustand'
import { createInitialBoard, applyMove, getValidMoves } from '@cavatrapi/engine'
import type { BoardState } from '@cavatrapi/engine'
import type { GameMode, Player, Square } from '@cavatrapi/shared'

export interface GameOverResult {
  winner: Player | 'draw'
  reason: 'normal' | 'timeout' | 'resign' | 'opponent_disconnected'
}

interface GameStore {
  board: BoardState | null
  validMoves: Square[]
  /** Seconds allocated per turn */
  clockSeconds: number
  /** When the current turn started (ms since epoch) */
  turnStartedAt: number
  gameOver: GameOverResult | null

  initGame: (mode: GameMode, clockSeconds: number) => void
  makeMove: (to: Square) => void
  tickTimer: () => void
  resign: (player: Player) => void
  reset: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  board: null,
  validMoves: [],
  clockSeconds: 30,
  turnStartedAt: 0,
  gameOver: null,

  initGame: (mode, clockSeconds) => {
    const board = createInitialBoard(mode)
    set({
      board,
      clockSeconds,
      turnStartedAt: Date.now(),
      validMoves: getValidMoves(board, board.currentTurn),
      gameOver: null,
    })
  },

  makeMove: (to) => {
    const { board } = get()
    if (!board || board.status !== 'IN_PROGRESS') return

    try {
      const result = applyMove(board, board.currentTurn, to)
      const next = result.nextState

      if (result.isGameOver) {
        set({ board: next, validMoves: [], gameOver: { winner: result.winner ?? 'draw', reason: 'normal' } })
        return
      }

      // Clock resets to full for the next player's turn
      set({ board: next, validMoves: getValidMoves(next, next.currentTurn), turnStartedAt: Date.now() })
    } catch {
      // Invalid move — ignore
    }
  },

  tickTimer: () => {
    const { board, clockSeconds, turnStartedAt, gameOver } = get()
    if (!board || board.status !== 'IN_PROGRESS' || gameOver) return

    const elapsed = Date.now() - turnStartedAt
    if (elapsed >= clockSeconds * 1000) {
      const loser = board.currentTurn
      const winner: Player = loser === 'P1' ? 'P2' : 'P1'
      set({
        board: { ...board, status: winner === 'P1' ? 'P1_WINS' : 'P2_WINS' },
        validMoves: [],
        gameOver: { winner, reason: 'timeout' },
      })
    }
  },

  resign: (player) => {
    const { board } = get()
    if (!board || board.status !== 'IN_PROGRESS') return
    const winner: Player = player === 'P1' ? 'P2' : 'P1'
    set({
      board: { ...board, status: winner === 'P1' ? 'P1_WINS' : 'P2_WINS' },
      validMoves: [],
      gameOver: { winner, reason: 'resign' },
    })
  },

  reset: () => set({ board: null, validMoves: [], turnStartedAt: 0, gameOver: null }),
}))
