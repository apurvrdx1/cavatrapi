import type { GameMode, Player } from '@cavatrapi/shared'
import type { BoardState } from './types.js'

export const BOARD_SIZE = 8

export const STARTING_POSITIONS = {
  P1: { row: 0, col: 0 }, // a8 — top-left
  P2: { row: 7, col: 7 }, // h1 — bottom-right
} as const

export function createInitialBoard(mode: GameMode): BoardState {
  const claimed: (Player | null)[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array<Player | null>(BOARD_SIZE).fill(null),
  )

  // Both starting squares are claimed immediately before any move is made
  claimed[0]![0] = 'P1'
  claimed[7]![7] = 'P2'

  return {
    mode,
    claimed,
    positions: {
      P1: { row: 0, col: 0 },
      P2: { row: 7, col: 7 },
    },
    currentTurn: 'P1',
    status: 'IN_PROGRESS',
    trappedOrder: [],
    moveCount: 0,
  }
}

/** Deep-clones the claimed grid. Used by applyMove to ensure immutability. */
export function cloneClaimed(claimed: (Player | null)[][]): (Player | null)[][] {
  return claimed.map((row) => [...row])
}
