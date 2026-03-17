import type { Player, Square } from '@cavatrapi/shared'
import type { BoardState, IslandScore } from './types.js'

/**
 * Finds all 4-connected components (islands) for a given player using BFS.
 * Diagonal adjacency is NOT considered — orthogonal only.
 */
function findIslands(claimed: (Player | null)[][], player: Player): Square[][] {
  const visited = Array.from({ length: 8 }, () => Array<boolean>(8).fill(false))
  const islands: Square[][] = []

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (claimed[r]![c] !== player || visited[r]![c]) continue

      // BFS flood fill from this unvisited owned square
      const island: Square[] = []
      const queue: Square[] = [{ row: r, col: c }]
      visited[r]![c] = true

      while (queue.length > 0) {
        const sq = queue.shift()!
        island.push(sq)

        for (const [dr, dc] of ORTHOGONAL_OFFSETS) {
          const nr = sq.row + dr
          const nc = sq.col + dc
          if (
            nr >= 0 && nr < 8 &&
            nc >= 0 && nc < 8 &&
            !visited[nr]![nc] &&
            claimed[nr]![nc] === player
          ) {
            visited[nr]![nc] = true
            queue.push({ row: nr, col: nc })
          }
        }
      }

      islands.push(island)
    }
  }

  // Sort largest island first
  return islands.sort((a, b) => b.length - a.length)
}

// Up / Down / Left / Right — no diagonals
const ORTHOGONAL_OFFSETS: readonly [number, number][] = [
  [-1, 0], [+1, 0], [0, -1], [0, +1],
]

export function computeIslandScores(state: BoardState): Record<Player, IslandScore> {
  const players: Player[] = ['P1', 'P2']
  const result = {} as Record<Player, IslandScore>

  for (const player of players) {
    const islands = findIslands(state.claimed, player)
    const totalClaimed = islands.reduce((sum, island) => sum + island.length, 0)
    const largestIsland = islands[0]?.length ?? 0

    result[player] = { player, largestIsland, totalClaimed, islands }
  }

  return result
}
