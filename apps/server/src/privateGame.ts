import type { GameMode } from '@cavatrapi/shared'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PendingRoom {
  socketId: string
  mode: GameMode
  clockSeconds: number
  expiresAt: number
}

// ─── Pure helpers ──────────────────────────────────────────────────────────

/** Generate a random 6-character uppercase invite code */
export function generateInviteCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

/** Build a PendingRoom object with a 10-minute expiry */
export function createRoom(
  socketId: string,
  mode: GameMode,
  clockSeconds: number,
  now = Date.now(),
): PendingRoom {
  return {
    socketId,
    mode,
    clockSeconds,
    expiresAt: now + 10 * 60 * 1000,
  }
}

/** Whether a room has passed its expiry time */
export function isRoomExpired(room: PendingRoom, now = Date.now()): boolean {
  return room.expiresAt <= now
}

/** Remove all expired rooms from the map (mutates the map). */
export function cleanupExpiredRooms(
  rooms: Map<string, PendingRoom>,
  now = Date.now(),
): void {
  rooms.forEach((room, code) => {
    if (isRoomExpired(room, now)) rooms.delete(code)
  })
}
