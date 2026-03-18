import { getValidMoves, computeIslandScores } from '@cavatrapi/engine'
import type { BoardState } from '@cavatrapi/engine'
import type { Player } from '@cavatrapi/shared'

const MOBILITY_WEIGHT = 1.0
const ISLAND_WEIGHT = 0.3
const CLAIMED_WEIGHT = 0.1

function opponent(player: Player): Player {
  return player === 'P1' ? 'P2' : 'P1'
}

/**
 * Evaluates the board from `player`'s perspective.
 * Returns +Infinity if the opponent is trapped (player wins),
 * -Infinity if the player is trapped (player loses), 0 for draws,
 * and a numeric score otherwise (higher = better for player).
 */
export function evaluateBoard(state: BoardState, player: Player): number {
  const opp = opponent(player)
  const myMoves = getValidMoves(state, player).length
  const oppMoves = getValidMoves(state, opp).length

  // Terminal detection
  if (myMoves === 0 && oppMoves === 0) return 0  // mutual trap = draw
  if (oppMoves === 0) return Infinity             // opponent trapped = win
  if (myMoves === 0) return -Infinity             // self trapped = loss

  // Mobility score (primary signal)
  const mobilityScore = (myMoves - oppMoves) * MOBILITY_WEIGHT

  // Island delta (secondary, AREA_CONTROL only)
  let islandScore = 0
  if (state.mode === 'AREA_CONTROL') {
    const scores = computeIslandScores(state)
    const myIsland = scores[player]?.largestIsland ?? 0
    const oppIsland = scores[opp]?.largestIsland ?? 0
    const myTotal = scores[player]?.totalClaimed ?? 0
    const oppTotal = scores[opp]?.totalClaimed ?? 0
    islandScore = (myIsland - oppIsland) * ISLAND_WEIGHT
      + (myTotal - oppTotal) * CLAIMED_WEIGHT
  }

  return mobilityScore + islandScore
}
