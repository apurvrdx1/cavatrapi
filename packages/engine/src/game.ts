import type { Player } from '@cavatrapi/shared'
import type { BoardState, GameOverResult } from './types.js'
import { computeIslandScores } from './scoring.js'

export function detectGameOver(state: BoardState): GameOverResult | null {
  if (state.status === 'IN_PROGRESS') return null

  const winner = getWinner(state)
  const result: GameOverResult = { status: state.status, winner }

  if (state.mode === 'AREA_CONTROL') {
    result.scores = computeIslandScores(state)
  }

  return result
}

export function getWinner(state: BoardState): Player | 'draw' | null {
  switch (state.status) {
    case 'P1_WINS': return 'P1'
    case 'P2_WINS': return 'P2'
    case 'DRAW': return 'draw'
    case 'IN_PROGRESS': return null
  }
}
