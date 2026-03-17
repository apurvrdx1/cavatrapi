import { describe, it, expect } from 'vitest'
import { detectGameOver, getWinner } from '../game.js'
import { createInitialBoard } from '../board.js'
import type { BoardState } from '../types.js'

describe('detectGameOver', () => {
  it('returns null when game is IN_PROGRESS', () => {
    const state = createInitialBoard('SUDDEN_DEATH')
    expect(detectGameOver(state)).toBeNull()
  })

  it('returns result when status is P1_WINS', () => {
    const state = { ...createInitialBoard('SUDDEN_DEATH'), status: 'P1_WINS' as const }
    const result = detectGameOver(state)
    expect(result).not.toBeNull()
    expect(result!.status).toBe('P1_WINS')
    expect(result!.winner).toBe('P1')
  })

  it('returns result when status is P2_WINS', () => {
    const state = { ...createInitialBoard('SUDDEN_DEATH'), status: 'P2_WINS' as const }
    expect(detectGameOver(state)!.winner).toBe('P2')
  })

  it('returns result when status is DRAW', () => {
    const state = { ...createInitialBoard('AREA_CONTROL'), status: 'DRAW' as const }
    const result = detectGameOver(state)
    expect(result!.winner).toBe('draw')
    expect(result!.status).toBe('DRAW')
  })

  it('includes island scores for AREA_CONTROL game-over', () => {
    const state = { ...createInitialBoard('AREA_CONTROL'), status: 'P1_WINS' as const }
    const result = detectGameOver(state)
    expect(result!.scores).toBeDefined()
  })

  it('does NOT include scores for SUDDEN_DEATH game-over', () => {
    const state = { ...createInitialBoard('SUDDEN_DEATH'), status: 'P1_WINS' as const }
    const result = detectGameOver(state)
    expect(result!.scores).toBeUndefined()
  })
})

describe('getWinner', () => {
  it('returns null when game is in progress', () => {
    expect(getWinner(createInitialBoard('SUDDEN_DEATH'))).toBeNull()
  })

  it('returns P1 when status is P1_WINS', () => {
    const state = { ...createInitialBoard('SUDDEN_DEATH'), status: 'P1_WINS' as const }
    expect(getWinner(state)).toBe('P1')
  })

  it('returns P2 when status is P2_WINS', () => {
    const state = { ...createInitialBoard('SUDDEN_DEATH'), status: 'P2_WINS' as const }
    expect(getWinner(state)).toBe('P2')
  })

  it('returns draw when status is DRAW', () => {
    const state = { ...createInitialBoard('AREA_CONTROL'), status: 'DRAW' as const } as BoardState
    expect(getWinner(state)).toBe('draw')
  })
})
