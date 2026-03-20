import { describe, it, expect } from 'vitest'
import { createInitialBoard } from '@cavatrapi/engine'
import { evaluateBoard } from '../evaluate.js'

describe('evaluateBoard', () => {
  it('returns 0 for the initial symmetric board', () => {
    const board = createInitialBoard('SUDDEN_DEATH')
    // Both players have the same mobility from starting positions
    const score = evaluateBoard(board, 'P1')
    expect(score).toBe(0)
  })

  it('is antisymmetric: P1 score equals negative of P2 score on same board', () => {
    const board = createInitialBoard('SUDDEN_DEATH')
    const p1Score = evaluateBoard(board, 'P1')
    const p2Score = evaluateBoard(board, 'P2')
    // Both are 0 on the symmetric initial board
    expect(p1Score + p2Score).toBe(0)
  })

  it('returns +Infinity when the opponent has no moves (P1 wins)', () => {
    // Manufacture a board state where P2 is trapped
    // Build up a game where P2 is forced into a corner
    // We'll simulate this by directly crafting board state
    const board = createInitialBoard('SUDDEN_DEATH')
    // Manually set up a state where P2 has zero valid moves
    const trapped: typeof board = {
      ...board,
      currentTurn: 'P1',
      trappedOrder: ['P2'],
      status: 'IN_PROGRESS',
      // P2 position at corner with all surrounding squares claimed
      positions: { P1: { row: 0, col: 0 }, P2: { row: 0, col: 1 } },
      claimed: board.claimed.map((row, r) =>
        row.map((cell, c) => {
          // Block all knight moves from P2's position (0,1)
          // Knight from (0,1) can reach: (1,3),(2,0),(2,2)
          if ((r === 1 && c === 3) || (r === 2 && c === 0) || (r === 2 && c === 2)) return 'P1'
          return cell
        })
      ),
    }
    // P2 has no moves — evaluating from P1's perspective should be very positive
    const score = evaluateBoard(trapped, 'P1')
    expect(score).toBe(Infinity)
  })

  it('returns -Infinity when the current player has no moves (P1 is trapped)', () => {
    const board = createInitialBoard('SUDDEN_DEATH')
    const trapped: typeof board = {
      ...board,
      currentTurn: 'P1',
      trappedOrder: ['P1'],
      status: 'IN_PROGRESS',
      positions: { P1: { row: 0, col: 1 }, P2: { row: 7, col: 7 } },
      claimed: board.claimed.map((row, r) =>
        row.map((cell, c) => {
          if ((r === 1 && c === 3) || (r === 2 && c === 0) || (r === 2 && c === 2)) return 'P2'
          return cell
        })
      ),
    }
    const score = evaluateBoard(trapped, 'P1')
    expect(score).toBe(-Infinity)
  })

  it('produces higher score when P1 has more mobility than P2', () => {
    // After a move that gives P1 more valid moves
    const board = createInitialBoard('SUDDEN_DEATH')
    // P1 at center has max mobility; P1 score should be higher than initial
    const centeredBoard: typeof board = {
      ...board,
      positions: { P1: { row: 3, col: 3 }, P2: { row: 0, col: 0 } },
    }
    const centeredScore = evaluateBoard(centeredBoard, 'P1')
    const initialScore = evaluateBoard(board, 'P1')
    // Center position gives P1 more moves, P2 fewer — score should be higher
    expect(centeredScore).toBeGreaterThan(initialScore)
  })

  it('includes island delta in AREA_CONTROL mode', () => {
    const board = createInitialBoard('AREA_CONTROL')
    const score = evaluateBoard(board, 'P1')
    // On initial board both players have 1 claimed square each (their start position)
    // So island delta should be 0, same as SUDDEN_DEATH
    const sdBoard = createInitialBoard('SUDDEN_DEATH')
    const sdScore = evaluateBoard(sdBoard, 'P1')
    expect(score).toBe(sdScore)
  })

  it('does NOT use island delta in SUDDEN_DEATH mode', () => {
    // Craft a board where island sizes differ but mobility is equal
    const board = createInitialBoard('SUDDEN_DEATH')
    const asymmetric: typeof board = {
      ...board,
      claimed: board.claimed.map((row, r) =>
        row.map((cell, c) => {
          // Give P1 a large island in the middle but keep valid moves equal
          if (r >= 2 && r <= 5 && c >= 2 && c <= 3) return 'P1'
          return cell
        })
      ),
    }
    const acBoard: typeof asymmetric = { ...asymmetric, mode: 'AREA_CONTROL' }
    const sdScore = evaluateBoard(asymmetric, 'P1')
    const acScore = evaluateBoard(acBoard, 'P1')
    // In AREA_CONTROL, island advantage should add to score
    expect(acScore).toBeGreaterThanOrEqual(sdScore)
  })
})
