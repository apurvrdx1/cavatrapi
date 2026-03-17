import { describe, it, expect } from 'vitest'
import { createInitialBoard } from '../board.js'

describe('createInitialBoard', () => {
  it('creates an 8x8 claimed grid', () => {
    const state = createInitialBoard('SUDDEN_DEATH')
    expect(state.claimed).toHaveLength(8)
    state.claimed.forEach((row) => expect(row).toHaveLength(8))
  })

  it('sets the correct mode', () => {
    expect(createInitialBoard('SUDDEN_DEATH').mode).toBe('SUDDEN_DEATH')
    expect(createInitialBoard('AREA_CONTROL').mode).toBe('AREA_CONTROL')
  })

  it('places P1 at top-left (row 0, col 0)', () => {
    const state = createInitialBoard('SUDDEN_DEATH')
    expect(state.positions.P1).toEqual({ row: 0, col: 0 })
  })

  it('places P2 at bottom-right (row 7, col 7)', () => {
    const state = createInitialBoard('SUDDEN_DEATH')
    expect(state.positions.P2).toEqual({ row: 7, col: 7 })
  })

  it('immediately claims P1 starting square', () => {
    const state = createInitialBoard('SUDDEN_DEATH')
    expect(state.claimed[0]![0]).toBe('P1')
  })

  it('immediately claims P2 starting square', () => {
    const state = createInitialBoard('SUDDEN_DEATH')
    expect(state.claimed[7]![7]).toBe('P2')
  })

  it('leaves all other squares unclaimed', () => {
    const state = createInitialBoard('SUDDEN_DEATH')
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (r === 0 && c === 0) continue
        if (r === 7 && c === 7) continue
        expect(state.claimed[r]![c]).toBeNull()
      }
    }
  })

  it('sets currentTurn to P1', () => {
    expect(createInitialBoard('SUDDEN_DEATH').currentTurn).toBe('P1')
  })

  it('sets status to IN_PROGRESS', () => {
    expect(createInitialBoard('SUDDEN_DEATH').status).toBe('IN_PROGRESS')
  })

  it('starts with empty trappedOrder', () => {
    expect(createInitialBoard('AREA_CONTROL').trappedOrder).toEqual([])
  })

  it('starts with moveCount 0', () => {
    expect(createInitialBoard('SUDDEN_DEATH').moveCount).toBe(0)
  })

  it('does not share claimed array references between instances', () => {
    const a = createInitialBoard('SUDDEN_DEATH')
    const b = createInitialBoard('SUDDEN_DEATH')
    a.claimed[0]![1] = 'P1'
    expect(b.claimed[0]![1]).toBeNull()
  })
})
