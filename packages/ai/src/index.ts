import type { BoardState, Square } from '@cavatrapi/engine'
import type { Player } from '@cavatrapi/shared'
import { minimax } from './minimax.js'
import { AI_DEPTH, AI_BUDGET_MS } from './types.js'
import type { AIDifficulty, AIResult } from './types.js'

export type { AIDifficulty, AIResult } from './types.js'
export { AI_DISPLAY_DELAY_MS } from './types.js'

/**
 * Chooses the best move for `player` using minimax with alpha-beta pruning.
 * Respects a 500ms compute budget — returns best move found within the budget.
 */
export function chooseBestMove(
  state: BoardState,
  player: Player,
  difficulty: AIDifficulty,
): AIResult {
  const depth = AI_DEPTH[difficulty]
  const startTime = Date.now()

  const result = minimax(
    state,
    depth,
    -Infinity,
    Infinity,
    player,
    startTime,
    AI_BUDGET_MS,
  )

  const depthReached = Math.min(depth, result.nodes > 1 ? depth : 0)

  return {
    move: result.move as Square,
    evaluationScore: result.score,
    nodesSearched: result.nodes,
    depthReached,
  }
}
