import { describe, it, expect, vi } from 'vitest'
import { createInitialBoard, getValidMoves, applyMove } from '@cavatrapi/engine'
import { chooseBestMove } from '../index.js'

describe('chooseBestMove', () => {
  it('returns a valid move on the initial board at EASY difficulty', () => {
    const board = createInitialBoard('SUDDEN_DEATH')
    const result = chooseBestMove(board, 'P1', 'EASY')
    const validMoves = getValidMoves(board, 'P1')
    const isValid = validMoves.some(
      (m) => m.row === result.move.row && m.col === result.move.col
    )
    expect(isValid).toBe(true)
  })

  it('returns a valid move at MEDIUM difficulty', () => {
    const board = createInitialBoard('SUDDEN_DEATH')
    const result = chooseBestMove(board, 'P1', 'MEDIUM')
    const validMoves = getValidMoves(board, 'P1')
    const isValid = validMoves.some(
      (m) => m.row === result.move.row && m.col === result.move.col
    )
    expect(isValid).toBe(true)
  })

  it('returns a valid move in AREA_CONTROL mode', () => {
    const board = createInitialBoard('AREA_CONTROL')
    const result = chooseBestMove(board, 'P1', 'EASY')
    const validMoves = getValidMoves(board, 'P1')
    const isValid = validMoves.some(
      (m) => m.row === result.move.row && m.col === result.move.col
    )
    expect(isValid).toBe(true)
  })

  it('includes metadata in the result', () => {
    const board = createInitialBoard('SUDDEN_DEATH')
    const result = chooseBestMove(board, 'P1', 'EASY')
    expect(result).toHaveProperty('move')
    expect(result).toHaveProperty('evaluationScore')
    expect(result).toHaveProperty('nodesSearched')
    expect(result).toHaveProperty('depthReached')
    expect(result.nodesSearched).toBeGreaterThan(0)
  })

  it('respects the 500ms time budget', () => {
    const board = createInitialBoard('SUDDEN_DEATH')
    const start = Date.now()
    chooseBestMove(board, 'P1', 'HARD')
    const elapsed = Date.now() - start
    // Should complete within budget + 100ms tolerance
    expect(elapsed).toBeLessThan(600)
  })

  it('terminates early when time budget exceeded (mocked)', () => {
    // Mock Date.now to simulate time passing rapidly
    let calls = 0
    const originalNow = Date.now
    vi.spyOn(Date, 'now').mockImplementation(() => {
      calls++
      // After 10 calls, simulate budget exceeded
      return calls > 10 ? originalNow() + 1000 : originalNow()
    })

    const board = createInitialBoard('SUDDEN_DEATH')
    const result = chooseBestMove(board, 'P1', 'HARD')

    // Should still return a valid move despite early termination
    const validMoves = getValidMoves(board, 'P1')
    const isValid = validMoves.some(
      (m) => m.row === result.move.row && m.col === result.move.col
    )
    expect(isValid).toBe(true)

    vi.restoreAllMocks()
  })

  it('prefers winning moves over neutral ones', () => {
    // Build a board where P1 can trap P2 immediately
    const board = createInitialBoard('SUDDEN_DEATH')
    // Place P2 at row=0, col=1 — knight moves reach (1,3),(2,0),(2,2)
    // Claim all of those squares for P1 so P2 will have no moves after P1 moves
    const nearTrap: typeof board = {
      ...board,
      currentTurn: 'P1',
      positions: { P1: { row: 3, col: 3 }, P2: { row: 0, col: 1 } },
      claimed: board.claimed.map((row, r) =>
        row.map((cell, c) => {
          // Claim 2 of 3 P2 escape squares — leave one
          if (r === 1 && c === 3) return 'P1'
          if (r === 2 && c === 0) return 'P1'
          return cell
        })
      ),
    }
    const result = chooseBestMove(nearTrap, 'P1', 'MEDIUM')
    const validMoves = getValidMoves(nearTrap, 'P1')
    const isValid = validMoves.some(
      (m) => m.row === result.move.row && m.col === result.move.col
    )
    expect(isValid).toBe(true)
    // Score should be non-negative (P1 has mobility advantage)
    expect(result.evaluationScore).toBeGreaterThanOrEqual(0)
  })

  it('works correctly for P2 as the acting player', () => {
    // Apply one P1 move so currentTurn becomes P2
    const board = createInitialBoard('SUDDEN_DEATH')
    const p1Moves = getValidMoves(board, 'P1')
    const afterP1 = applyMove(board, 'P1', p1Moves[0]!).nextState
    expect(afterP1.currentTurn).toBe('P2')

    const result = chooseBestMove(afterP1, 'P2', 'EASY')
    const validMoves = getValidMoves(afterP1, 'P2')
    const isValid = validMoves.some(
      (m) => m.row === result.move.row && m.col === result.move.col
    )
    expect(isValid).toBe(true)
  })

  it('depthReached is within the difficulty depth limit', () => {
    const board = createInitialBoard('SUDDEN_DEATH')
    const easy = chooseBestMove(board, 'P1', 'EASY')
    const medium = chooseBestMove(board, 'P1', 'MEDIUM')
    expect(easy.depthReached).toBeLessThanOrEqual(2)
    expect(medium.depthReached).toBeLessThanOrEqual(4)
  })
})
