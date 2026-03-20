import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateInviteCode,
  createRoom,
  isRoomExpired,
  cleanupExpiredRooms,
  type PendingRoom,
} from '../privateGame.js'

// ─── generateInviteCode ──────────────────────────────────────────────────────

describe('generateInviteCode', () => {
  it('returns a 6-character string', () => {
    const code = generateInviteCode()
    expect(code).toHaveLength(6)
  })

  it('returns only uppercase alphanumeric characters', () => {
    // Run many times to reduce probability of false pass
    for (let i = 0; i < 50; i++) {
      const code = generateInviteCode()
      expect(code).toMatch(/^[A-Z0-9]{6}$/)
    }
  })

  it('generates unique codes across calls (statistically)', () => {
    const codes = new Set(Array.from({ length: 100 }, generateInviteCode))
    // With a 36^6 space, 100 samples should almost never collide
    expect(codes.size).toBeGreaterThan(95)
  })
})

// ─── createRoom ──────────────────────────────────────────────────────────────

describe('createRoom', () => {
  it('sets socketId, mode, and clockSeconds from arguments', () => {
    const room = createRoom('socket-abc', 'SUDDEN_DEATH', 30)
    expect(room.socketId).toBe('socket-abc')
    expect(room.mode).toBe('SUDDEN_DEATH')
    expect(room.clockSeconds).toBe(30)
  })

  it('sets expiresAt to 10 minutes in the future', () => {
    const now = 1_000_000
    const room = createRoom('socket-abc', 'AREA_CONTROL', 15, now)
    expect(room.expiresAt).toBe(now + 10 * 60 * 1000)
  })

  it('uses Date.now() when no `now` arg is provided', () => {
    const before = Date.now()
    const room = createRoom('s', 'SUDDEN_DEATH', 30)
    const after = Date.now()
    expect(room.expiresAt).toBeGreaterThanOrEqual(before + 10 * 60 * 1000)
    expect(room.expiresAt).toBeLessThanOrEqual(after + 10 * 60 * 1000)
  })

  it('works for all valid clockSeconds values', () => {
    for (const secs of [15, 30, 45] as const) {
      const room = createRoom('s', 'SUDDEN_DEATH', secs)
      expect(room.clockSeconds).toBe(secs)
    }
  })
})

// ─── isRoomExpired ────────────────────────────────────────────────────────────

describe('isRoomExpired', () => {
  it('returns false when room expires in the future', () => {
    const now = 1_000_000
    const room: PendingRoom = {
      socketId: 'x', mode: 'SUDDEN_DEATH', clockSeconds: 30,
      expiresAt: now + 1000,
    }
    expect(isRoomExpired(room, now)).toBe(false)
  })

  it('returns true when room expiresAt equals now (boundary)', () => {
    const now = 1_000_000
    const room: PendingRoom = {
      socketId: 'x', mode: 'SUDDEN_DEATH', clockSeconds: 30,
      expiresAt: now,
    }
    expect(isRoomExpired(room, now)).toBe(true)
  })

  it('returns true when room expiresAt is in the past', () => {
    const now = 1_000_000
    const room: PendingRoom = {
      socketId: 'x', mode: 'SUDDEN_DEATH', clockSeconds: 30,
      expiresAt: now - 1,
    }
    expect(isRoomExpired(room, now)).toBe(true)
  })
})

// ─── cleanupExpiredRooms ──────────────────────────────────────────────────────

describe('cleanupExpiredRooms', () => {
  let rooms: Map<string, PendingRoom>
  const NOW = 5_000_000

  beforeEach(() => {
    rooms = new Map<string, PendingRoom>()
  })

  it('removes expired rooms', () => {
    rooms.set('EXPIRED', {
      socketId: 'a', mode: 'SUDDEN_DEATH', clockSeconds: 30,
      expiresAt: NOW - 1,
    })
    cleanupExpiredRooms(rooms, NOW)
    expect(rooms.has('EXPIRED')).toBe(false)
  })

  it('keeps non-expired rooms', () => {
    rooms.set('VALID', {
      socketId: 'b', mode: 'SUDDEN_DEATH', clockSeconds: 30,
      expiresAt: NOW + 60_000,
    })
    cleanupExpiredRooms(rooms, NOW)
    expect(rooms.has('VALID')).toBe(true)
  })

  it('removes only expired rooms when map has a mix', () => {
    rooms.set('EXP1', { socketId: 'a', mode: 'SUDDEN_DEATH', clockSeconds: 30, expiresAt: NOW - 100 })
    rooms.set('EXP2', { socketId: 'b', mode: 'AREA_CONTROL', clockSeconds: 15, expiresAt: NOW - 1 })
    rooms.set('GOOD', { socketId: 'c', mode: 'SUDDEN_DEATH', clockSeconds: 45, expiresAt: NOW + 1000 })
    cleanupExpiredRooms(rooms, NOW)
    expect(rooms.has('EXP1')).toBe(false)
    expect(rooms.has('EXP2')).toBe(false)
    expect(rooms.has('GOOD')).toBe(true)
    expect(rooms.size).toBe(1)
  })

  it('does nothing on an empty map', () => {
    expect(() => cleanupExpiredRooms(rooms, NOW)).not.toThrow()
    expect(rooms.size).toBe(0)
  })

  it('removes a room whose expiresAt equals now (boundary)', () => {
    rooms.set('BOUNDARY', {
      socketId: 'x', mode: 'SUDDEN_DEATH', clockSeconds: 30,
      expiresAt: NOW,
    })
    cleanupExpiredRooms(rooms, NOW)
    expect(rooms.has('BOUNDARY')).toBe(false)
  })
})
