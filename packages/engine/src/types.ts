import type { Player, GameMode, GameStatus, Square } from '@cavatrapi/shared'

export type { Player, GameMode, GameStatus, Square }

export interface BoardState {
  mode: GameMode
  /** claimed[row][col] = owning Player, or null if unclaimed */
  claimed: (Player | null)[][]
  positions: Record<Player, Square>
  currentTurn: Player
  status: GameStatus
  /** Mode 2 tiebreak: records which player was trapped first */
  trappedOrder: Player[]
  moveCount: number
}

export interface MoveResult {
  /** Always a new object — engine never mutates input state */
  nextState: BoardState
  isGameOver: boolean
  winner: Player | 'draw' | null
}

export interface IslandScore {
  player: Player
  largestIsland: number
  totalClaimed: number
  /** All connected components, sorted largest first */
  islands: Square[][]
}

export interface GameOverResult {
  status: GameStatus
  winner: Player | 'draw' | null
  /** Present only in AREA_CONTROL mode */
  scores?: Record<Player, IslandScore>
}

export type EngineErrorCode =
  | 'INVALID_MOVE'
  | 'WRONG_PLAYER'
  | 'GAME_OVER'
  | 'OUT_OF_BOUNDS'

export class EngineError extends Error {
  constructor(
    public readonly code: EngineErrorCode,
    message: string,
  ) {
    super(`${code}: ${message}`)
    this.name = 'EngineError'
  }
}
