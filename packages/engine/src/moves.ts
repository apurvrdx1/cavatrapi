import type { Player, Square } from '@cavatrapi/shared'
import type { BoardState, MoveResult } from './types.js'
import { EngineError } from './types.js'
import { BOARD_SIZE, cloneClaimed } from './board.js'
import { computeIslandScores } from './scoring.js'

// All 8 valid knight move offsets
const KNIGHT_OFFSETS: readonly [number, number][] = [
  [-2, -1], [-2, +1],
  [-1, -2], [-1, +2],
  [+1, -2], [+1, +2],
  [+2, -1], [+2, +1],
]

export function isOnBoard(sq: Square): boolean {
  return sq.row >= 0 && sq.row < BOARD_SIZE && sq.col >= 0 && sq.col < BOARD_SIZE
}

/** Returns all on-board squares a knight can reach from `from`. */
export function knightMoves(from: Square): Square[] {
  const moves: Square[] = []
  for (const [dr, dc] of KNIGHT_OFFSETS) {
    const sq = { row: from.row + dr, col: from.col + dc }
    if (isOnBoard(sq)) moves.push(sq)
  }
  return moves
}

/**
 * Returns all legal moves for `player` in the current state.
 * A square is legal iff it is on the board AND unclaimed (null).
 * Both own and opponent claimed squares (including the opponent's current position,
 * which is always claimed) are excluded by the single `=== null` check.
 */
export function getValidMoves(state: BoardState, player: Player): Square[] {
  const pos = state.positions[player]
  return knightMoves(pos).filter((sq) => state.claimed[sq.row]![sq.col] === null)
}

/** Returns the opponent of the given player. */
function opponent(player: Player): Player {
  return player === 'P1' ? 'P2' : 'P1'
}

/**
 * Applies `to` as a move for `player`. Always returns a new BoardState — never mutates.
 * Throws EngineError for invalid moves.
 */
export function applyMove(state: BoardState, player: Player, to: Square): MoveResult {
  // Guard: game must still be in progress
  if (state.status !== 'IN_PROGRESS') {
    throw new EngineError('GAME_OVER', 'Cannot move: game is already over')
  }

  // Guard: must be this player's turn
  if (state.currentTurn !== player) {
    throw new EngineError('WRONG_PLAYER', `It is ${state.currentTurn}'s turn, not ${player}'s`)
  }

  // Guard: destination must be on the board
  if (!isOnBoard(to)) {
    throw new EngineError('OUT_OF_BOUNDS', `Square (${to.row},${to.col}) is off the board`)
  }

  // Guard: destination must be a valid move
  const valid = getValidMoves(state, player)
  const isValid = valid.some((sq) => sq.row === to.row && sq.col === to.col)
  if (!isValid) {
    throw new EngineError(
      'INVALID_MOVE',
      `(${to.row},${to.col}) is not a valid move for ${player}`,
    )
  }

  // Build new claimed grid (immutable)
  const newClaimed = cloneClaimed(state.claimed)
  newClaimed[to.row]![to.col] = player

  // Build new positions
  const newPositions = { ...state.positions, [player]: to }

  // Build base next state (turn/status determined below)
  const base: BoardState = {
    ...state,
    claimed: newClaimed,
    positions: newPositions,
    moveCount: state.moveCount + 1,
    trappedOrder: [...state.trappedOrder],
  }

  return resolveNextTurn(base, player)
}

/**
 * After a move has been applied to `state` by `player`, determines the next turn,
 * updates trappedOrder, and detects game-over conditions.
 */
function resolveNextTurn(state: BoardState, movedPlayer: Player): MoveResult {
  const opp = opponent(movedPlayer)
  const oppMoves = getValidMoves(state, opp)
  const myMoves = getValidMoves(state, movedPlayer)

  if (state.mode === 'SUDDEN_DEATH') {
    if (oppMoves.length === 0) {
      const winner = movedPlayer
      return {
        nextState: { ...state, status: winner === 'P1' ? 'P1_WINS' : 'P2_WINS', currentTurn: opp },
        isGameOver: true,
        winner,
      }
    }
    return {
      nextState: { ...state, currentTurn: opp },
      isGameOver: false,
      winner: null,
    }
  }

  // AREA_CONTROL mode
  if (oppMoves.length > 0) {
    // Normal turn switch
    return {
      nextState: { ...state, currentTurn: opp },
      isGameOver: false,
      winner: null,
    }
  }

  // Opponent is trapped — record it if not already
  const newTrappedOrder = state.trappedOrder.includes(opp)
    ? state.trappedOrder
    : [...state.trappedOrder, opp]

  if (myMoves.length === 0) {
    // Both players trapped — game over, compute scores
    const stateWithTrapped: BoardState = { ...state, trappedOrder: newTrappedOrder }
    return resolveAreaControlGameOver(stateWithTrapped, movedPlayer, newTrappedOrder)
  }

  // Only opponent is trapped — current player continues
  return {
    nextState: { ...state, currentTurn: movedPlayer, trappedOrder: newTrappedOrder },
    isGameOver: false,
    winner: null,
  }
}

function resolveAreaControlGameOver(
  state: BoardState,
  lastMover: Player,
  trappedOrder: Player[],
): MoveResult {
  const scores = computeIslandScores(state)

  const p1 = scores['P1']!
  const p2 = scores['P2']!

  let winner: Player | 'draw' | null = null
  let status = state.status

  if (p1.largestIsland > p2.largestIsland) {
    winner = 'P1'; status = 'P1_WINS'
  } else if (p2.largestIsland > p1.largestIsland) {
    winner = 'P2'; status = 'P2_WINS'
  } else if (p1.totalClaimed > p2.totalClaimed) {
    winner = 'P1'; status = 'P1_WINS'
  } else if (p2.totalClaimed > p1.totalClaimed) {
    winner = 'P2'; status = 'P2_WINS'
  } else {
    // Tiebreak: whoever was trapped first loses
    const firstTrapped = trappedOrder[0]
    if (firstTrapped !== undefined) {
      winner = opponent(firstTrapped)
      status = winner === 'P1' ? 'P1_WINS' : 'P2_WINS'
    } else {
      winner = 'draw'; status = 'DRAW'
    }
  }

  void lastMover // used for future extensions

  return {
    nextState: { ...state, status, trappedOrder },
    isGameOver: true,
    winner,
  }
}
