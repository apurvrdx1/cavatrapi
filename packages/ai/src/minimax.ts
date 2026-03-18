import { getValidMoves, applyMove } from '@cavatrapi/engine'
import type { BoardState, Square } from '@cavatrapi/engine'
import type { Player } from '@cavatrapi/shared'
import { evaluateBoard } from './evaluate.js'
import type { MinimaxResult } from './types.js'

function opponent(player: Player): Player {
  return player === 'P1' ? 'P2' : 'P1'
}

/**
 * Orders moves by a quick one-ply mobility heuristic to improve alpha-beta cutoffs.
 * Moves that restrict the opponent more are searched first.
 */
function orderMoves(state: BoardState, moves: Square[], player: Player): Square[] {
  const opp = opponent(player)
  return [...moves].sort((a, b) => {
    const stateA = applyMove(state, player, a).nextState
    const stateB = applyMove(state, player, b).nextState
    const oppMovesAfterA = getValidMoves(stateA, opp).length
    const oppMovesAfterB = getValidMoves(stateB, opp).length
    return oppMovesAfterA - oppMovesAfterB  // fewer opponent moves = search first
  })
}

export function minimax(
  state: BoardState,
  depth: number,
  alpha: number,
  beta: number,
  rootPlayer: Player,
  startTime: number,
  budgetMs: number,
): MinimaxResult {
  // Time budget check — return best-so-far evaluation if expired
  if (Date.now() - startTime > budgetMs) {
    return { score: evaluateBoard(state, rootPlayer), move: null, nodes: 1 }
  }

  // Engine is authoritative about whose turn it is
  const currentPlayer = state.currentTurn
  const isMaximizing = currentPlayer === rootPlayer
  const moves = getValidMoves(state, currentPlayer)

  // Leaf node: depth exhausted or no moves available
  if (depth === 0 || moves.length === 0) {
    return { score: evaluateBoard(state, rootPlayer), move: null, nodes: 1 }
  }

  const orderedMoves = depth >= 3 ? orderMoves(state, moves, currentPlayer) : moves

  let bestMove: Square | null = null
  let totalNodes = 0
  let bestScore = isMaximizing ? -Infinity : Infinity

  for (const move of orderedMoves) {
    const result = applyMove(state, currentPlayer, move)
    const child = minimax(
      result.nextState,
      depth - 1,
      alpha,
      beta,
      rootPlayer,
      startTime,
      budgetMs,
    )

    totalNodes += child.nodes + 1

    if (isMaximizing) {
      if (child.score > bestScore) {
        bestScore = child.score
        bestMove = move
      }
      alpha = Math.max(alpha, bestScore)
    } else {
      if (child.score < bestScore) {
        bestScore = child.score
        bestMove = move
      }
      beta = Math.min(beta, bestScore)
    }

    if (beta <= alpha) break  // alpha-beta cutoff
  }

  return { score: bestScore, move: bestMove ?? orderedMoves[0]!, nodes: totalNodes }
}
