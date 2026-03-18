import { View, Text, StyleSheet, Platform } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { KnightPiece } from './KnightPiece'
import type { Player } from '@cavatrapi/shared'

interface PlayerPanelProps {
  player: Player
  name: string
  isActive: boolean
  timeLeftMs: number
  clockSeconds: number
  claimedCount: number
  isTrapped: boolean
}

function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const P1_COLOR = '#8b5cf6'
const P2_COLOR = '#facc15'
const P1_BG = '#ede9fe'
const P2_BG = '#fef9c3'

export function PlayerPanel({ player, name, isActive, timeLeftMs, clockSeconds, claimedCount, isTrapped }: PlayerPanelProps) {
  const fillRatio = Math.min(1, timeLeftMs / (clockSeconds * 1000))
  const color = player === 'P1' ? P1_COLOR : P2_COLOR
  const bg = player === 'P1' ? P1_BG : P2_BG
  const isLow = timeLeftMs < 10_000

  return (
    <View style={[styles.panel, isActive && styles.panelActive]}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: bg, borderColor: isActive ? color : '#cbd5e1' }]}>
        <KnightPiece color={isActive ? color : '#94a3b8'} size={44} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, !isActive && styles.nameMuted]}>{name}</Text>
        <View style={[
          styles.badge,
          isTrapped ? styles.badgeTrapped : isActive ? styles.badgeActive : styles.badgeWaiting,
        ]}>
          <Text style={[styles.badgeText, isTrapped && styles.badgeTextTrapped]}>
            {isTrapped ? 'TRAPPED' : isActive ? 'YOUR TURN' : 'WAITING'}
          </Text>
        </View>
      </View>

      {/* Timer */}
      <View style={styles.timerBlock}>
        <Text style={[styles.timer, isLow && isActive && styles.timerLow, !isActive && styles.timerMuted]}>
          {formatTime(timeLeftMs)}
        </Text>
        <View style={styles.timerBarBg}>
          <View style={[
            styles.timerBarFill,
            { backgroundColor: isLow && isActive ? '#ef4444' : color, width: `${fillRatio * 100}%` },
            !isActive && styles.timerBarMuted,
          ]} />
        </View>
      </View>

      {/* Claimed count */}
      <View style={styles.claimedBlock}>
        <MaterialCommunityIcons
          name="grid"
          size={14}
          color={isActive ? color : '#94a3b8'}
        />
        <Text style={[styles.claimedNum, !isActive && styles.claimedMuted]}>
          {claimedCount}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#e2e8f0',
    padding: 10,
    gap: 10,
    ...Platform.select({
      web: { boxShadow: '4px 4px 0px #e2e8f0' },
      default: {
        shadowColor: '#e2e8f0',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
    }),
  },
  panelActive: {
    borderColor: '#1e293b',
    ...Platform.select({
      web: { boxShadow: '4px 4px 0px #1e293b' },
      default: {
        shadowColor: '#1e293b',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
      },
    }),
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontWeight: '800',
    fontSize: 13,
    color: '#1e293b',
    letterSpacing: 0.5,
  },
  nameMuted: { color: '#94a3b8' },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  badgeActive: { backgroundColor: '#4ade80' },
  badgeWaiting: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
  badgeTrapped: { backgroundColor: '#fef9c3', borderColor: '#eab308' },
  badgeText: {
    fontWeight: '800',
    fontSize: 9,
    color: '#1e293b',
    letterSpacing: 1,
  },
  badgeTextTrapped: { color: '#b45309' },
  timerBlock: {
    alignItems: 'center',
    gap: 4,
    minWidth: 52,
  },
  timer: {
    fontWeight: '900',
    fontSize: 20,
    color: '#1e293b',
    letterSpacing: 1,
  },
  timerLow: { color: '#ef4444' },
  timerMuted: { color: '#cbd5e1' },
  timerBarBg: {
    width: 52,
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerBarFill: {
    width: '100%',
    height: '100%',
    borderRadius: 3,
  },
  timerBarMuted: { backgroundColor: '#e2e8f0' },
  claimedBlock: {
    alignItems: 'center',
    gap: 2,
  },
  claimedNum: {
    fontWeight: '900',
    fontSize: 16,
    color: '#1e293b',
  },
  claimedMuted: { color: '#cbd5e1' },
})
