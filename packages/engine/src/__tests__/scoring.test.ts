import { describe, it, expect } from 'vitest'
import { computeIslandScores } from '../scoring.js'
import { createInitialBoard } from '../board.js'
import type { BoardState } from '../types.js'

function makeBoard(overrides: Partial<BoardState> = {}): BoardState {
  return { ...createInitialBoard('AREA_CONTROL'), ...overrides }
}

function emptyClaimed(): (('P1' | 'P2' | null)[])[] {
  return Array.from({ length: 8 }, () => Array<'P1' | 'P2' | null>(8).fill(null))
}

describe('computeIslandScores', () => {
  it('returns scores for both players', () => {
    const state = createInitialBoard('AREA_CONTROL')
    const scores = computeIslandScores(state)
    expect(scores['P1']).toBeDefined()
    expect(scores['P2']).toBeDefined()
  })

  it('counts only the starting square at init (largestIsland = 1 each)', () => {
    const state = createInitialBoard('AREA_CONTROL')
    const scores = computeIslandScores(state)
    expect(scores['P1']!.largestIsland).toBe(1)
    expect(scores['P2']!.largestIsland).toBe(1)
    expect(scores['P1']!.totalClaimed).toBe(1)
    expect(scores['P2']!.totalClaimed).toBe(1)
  })

  it('a single connected block is one island', () => {
    const claimed = emptyClaimed()
    // 3 orthogonally connected P1 squares
    claimed[0]![0] = 'P1'
    claimed[0]![1] = 'P1'
    claimed[0]![2] = 'P1'
    const state = makeBoard({ claimed })
    const scores = computeIslandScores(state)
    expect(scores['P1']!.largestIsland).toBe(3)
    expect(scores['P1']!.islands).toHaveLength(1)
  })

  it('two disconnected blocks are two islands', () => {
    const claimed = emptyClaimed()
    claimed[0]![0] = 'P1'
    claimed[0]![1] = 'P1'
    // gap at (0,2)
    claimed[0]![3] = 'P1'
    claimed[0]![4] = 'P1'
    const state = makeBoard({ claimed })
    const scores = computeIslandScores(state)
    expect(scores['P1']!.islands).toHaveLength(2)
    expect(scores['P1']!.largestIsland).toBe(2)
  })

  it('diagonal squares are NOT connected', () => {
    const claimed = emptyClaimed()
    claimed[0]![0] = 'P1'
    claimed[1]![1] = 'P1' // diagonal — not connected
    const state = makeBoard({ claimed })
    const scores = computeIslandScores(state)
    expect(scores['P1']!.islands).toHaveLength(2)
    expect(scores['P1']!.largestIsland).toBe(1)
  })

  it('isthmus: two blobs connected by a single square are one island', () => {
    const claimed = emptyClaimed()
    // Left blob
    claimed[0]![0] = 'P1'
    claimed[1]![0] = 'P1'
    // Isthmus
    claimed[2]![0] = 'P1'
    // Right blob
    claimed[3]![0] = 'P1'
    claimed[4]![0] = 'P1'
    const state = makeBoard({ claimed })
    const scores = computeIslandScores(state)
    expect(scores['P1']!.islands).toHaveLength(1)
    expect(scores['P1']!.largestIsland).toBe(5)
  })

  it('islands are sorted largest first', () => {
    const claimed = emptyClaimed()
    // Island of 3
    claimed[0]![0] = 'P1'
    claimed[0]![1] = 'P1'
    claimed[0]![2] = 'P1'
    // Island of 1
    claimed[5]![5] = 'P1'
    const state = makeBoard({ claimed })
    const scores = computeIslandScores(state)
    const sizes = scores['P1']!.islands.map((i) => i.length)
    expect(sizes[0]).toBeGreaterThanOrEqual(sizes[1]!)
  })

  it('totalClaimed counts all squares regardless of connectivity', () => {
    const claimed = emptyClaimed()
    claimed[0]![0] = 'P1'
    claimed[2]![2] = 'P1' // isolated
    claimed[4]![4] = 'P1' // isolated
    const state = makeBoard({ claimed })
    expect(computeIslandScores(state)['P1']!.totalClaimed).toBe(3)
  })

  it('P1 and P2 scores are computed independently', () => {
    const claimed = emptyClaimed()
    claimed[0]![0] = 'P1'
    claimed[0]![1] = 'P1'
    claimed[7]![7] = 'P2'
    const state = makeBoard({ claimed })
    const scores = computeIslandScores(state)
    expect(scores['P1']!.totalClaimed).toBe(2)
    expect(scores['P2']!.totalClaimed).toBe(1)
  })

  it('returns largestIsland 0 for a player with no claimed squares', () => {
    const claimed = emptyClaimed()
    claimed[0]![0] = 'P1'
    const state = makeBoard({ claimed })
    const scores = computeIslandScores(state)
    expect(scores['P2']!.largestIsland).toBe(0)
    expect(scores['P2']!.totalClaimed).toBe(0)
    expect(scores['P2']!.islands).toHaveLength(0)
  })

  it('L-shaped connected region counts as one island', () => {
    const claimed = emptyClaimed()
    // L-shape
    claimed[0]![0] = 'P1'
    claimed[1]![0] = 'P1'
    claimed[2]![0] = 'P1'
    claimed[2]![1] = 'P1'
    claimed[2]![2] = 'P1'
    const state = makeBoard({ claimed })
    const scores = computeIslandScores(state)
    expect(scores['P1']!.largestIsland).toBe(5)
    expect(scores['P1']!.islands).toHaveLength(1)
  })
})
