import { createClient } from '@supabase/supabase-js'
import type { GameMode } from '@cavatrapi/shared'

// ─── Client ───────────────────────────────────────────────────────────────────
// Service role key — bypasses RLS. Never expose to the client.

const supabaseUrl = process.env['SUPABASE_URL']
const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
}

export const db = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlayerRow {
  id: string
  username: string
  avatar_url: string | null
}

export interface SaveGameSessionInput {
  mode: GameMode
  p1Id: string
  p2Id: string
  winnerId: string | null
  moveCount: number
  durationSeconds: number
}

// ─── Operations ───────────────────────────────────────────────────────────────

/**
 * Insert or update a player row. Called on socket auth (Phase 5).
 * Uses upsert so re-connecting users don't cause duplicates.
 */
export async function upsertPlayer(player: PlayerRow): Promise<void> {
  const { error } = await db
    .from('players')
    .upsert(
      { id: player.id, username: player.username, avatar_url: player.avatar_url },
      { onConflict: 'id' },
    )
  if (error) throw new Error(`upsertPlayer failed: ${error.message}`)
}

/**
 * Persist a completed game session and update both players' stats.
 * Fire-and-forget from the GAME_OVER handler — failures are logged but not surfaced.
 */
export async function saveGameSession(input: SaveGameSessionInput): Promise<void> {
  const { error: sessionError } = await db.from('game_sessions').insert({
    mode: input.mode,
    p1_id: input.p1Id,
    p2_id: input.p2Id,
    winner_id: input.winnerId,
    move_count: input.moveCount,
    duration_seconds: input.durationSeconds,
  })
  if (sessionError) throw new Error(`saveGameSession failed: ${sessionError.message}`)

  await updateStats(input.p1Id, input.mode, input.winnerId === input.p1Id ? 'win' : input.winnerId === null ? 'draw' : 'loss')
  await updateStats(input.p2Id, input.mode, input.winnerId === input.p2Id ? 'win' : input.winnerId === null ? 'draw' : 'loss')
}

async function updateStats(
  playerId: string,
  mode: GameMode,
  result: 'win' | 'loss' | 'draw',
): Promise<void> {
  const increment = result === 'win'
    ? { wins: 1, losses: 0, draws: 0 }
    : result === 'loss'
    ? { wins: 0, losses: 1, draws: 0 }
    : { wins: 0, losses: 0, draws: 1 }

  const { error } = await db.rpc('increment_player_stats', {
    p_player_id: playerId,
    p_mode: mode,
    p_wins: increment.wins,
    p_losses: increment.losses,
    p_draws: increment.draws,
  })
  if (error) throw new Error(`updateStats failed: ${error.message}`)
}

/**
 * Fetch a player's stats for both game modes. Returns null if player not found.
 */
export async function getPlayerStats(playerId: string): Promise<{
  SUDDEN_DEATH: { wins: number; losses: number; draws: number }
  AREA_CONTROL: { wins: number; losses: number; draws: number }
} | null> {
  const { data, error } = await db
    .from('player_stats')
    .select('mode, wins, losses, draws')
    .eq('player_id', playerId)

  if (error) throw new Error(`getPlayerStats failed: ${error.message}`)
  if (!data || data.length === 0) return null

  const empty = { wins: 0, losses: 0, draws: 0 }
  const sd = data.find((r) => r.mode === 'SUDDEN_DEATH') ?? empty
  const ac = data.find((r) => r.mode === 'AREA_CONTROL') ?? empty

  return {
    SUDDEN_DEATH: { wins: sd.wins, losses: sd.losses, draws: sd.draws },
    AREA_CONTROL: { wins: ac.wins, losses: ac.losses, draws: ac.draws },
  }
}
