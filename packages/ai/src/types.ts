import type { Player } from '@cavatrapi/shared'
import type { Square } from '@cavatrapi/engine'

export type AIDifficulty = 'EASY' | 'MEDIUM' | 'HARD'

export const AI_DEPTH: Record<AIDifficulty, number> = {
  EASY: 2,
  MEDIUM: 4,
  HARD: 6,
}

export const AI_BUDGET_MS = 500
export const AI_DISPLAY_DELAY_MS = 500

export interface AIResult {
  move: Square
  evaluationScore: number
  nodesSearched: number
  depthReached: number
}

export interface MinimaxResult {
  score: number
  move: Square | null
  nodes: number
}
