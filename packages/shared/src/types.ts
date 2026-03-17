// ─── Core game types ──────────────────────────────────────────────────────────

export type Player = 'P1' | 'P2'

export type GameMode = 'SUDDEN_DEATH' | 'AREA_CONTROL'

export type GameStatus = 'IN_PROGRESS' | 'P1_WINS' | 'P2_WINS' | 'DRAW'

/**
 * A position on the 8×8 board.
 * row 0 = rank 8 (top), row 7 = rank 1 (bottom)
 * col 0 = file a (left), col 7 = file h (right)
 *
 * Starting positions:
 *   P1 → { row: 0, col: 0 }  (a8, top-left)
 *   P2 → { row: 7, col: 7 }  (h1, bottom-right)
 */
export interface Square {
  row: number
  col: number
}

// ─── Auth & user types ────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  username: string
  avatarUrl: string | null
  createdAt: string
}

export interface UserStats {
  userId: string
  mode: GameMode
  wins: number
  losses: number
  draws: number
}
