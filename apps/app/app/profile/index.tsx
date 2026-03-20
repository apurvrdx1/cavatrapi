import { View, Text, StyleSheet, Pressable, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { KnightPiece } from '../../components/KnightPiece'
import { useAuthStore } from '../../stores/authStore'

// Placeholder stats — will be replaced with Clerk + Supabase data
const PLACEHOLDER_STATS = {
  username: 'Knight',
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  modes: {
    SUDDEN_DEATH: { wins: 0, losses: 0, draws: 0 },
    AREA_CONTROL: { wins: 0, losses: 0, draws: 0 },
  },
}

function StatBlock({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={[styles.statValue, accent ? { color: accent } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function ModeRow({ mode, wins, losses, draws }: { mode: string; wins: number; losses: number; draws: number }) {
  return (
    <View style={styles.modeRow}>
      <Text style={styles.modeLabel}>{mode}</Text>
      <View style={styles.modeStats}>
        <Text style={styles.modeW}>{wins}W</Text>
        <Text style={styles.modeL}>{losses}L</Text>
        <Text style={styles.modeD}>{draws}D</Text>
      </View>
    </View>
  )
}

export default function ProfileScreen() {
  const router = useRouter()
  const { displayName, username: authUsername } = useAuthStore()
  const { username, gamesPlayed, wins, losses, draws, modes } = PLACEHOLDER_STATS
  const resolvedName = displayName ?? authUsername ?? username ?? 'Player'
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0

  return (
    <View style={styles.bg}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color="#1e293b" />
            </Pressable>
            <Text style={styles.headerTitle}>PROFILE</Text>
            <View style={styles.backBtn} />
          </View>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarRing}>
              <KnightPiece color="#8b5cf6" size={80} />
            </View>
            <Text style={styles.username}>{resolvedName.toUpperCase()}</Text>
            <View style={styles.guestBadge}>
              <MaterialCommunityIcons name="account-outline" size={12} color="#64748b" />
              <Text style={styles.guestBadgeText}>GUEST</Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsCard}>
            <StatBlock label="PLAYED" value={String(gamesPlayed)} />
            <View style={styles.statDivider} />
            <StatBlock label="WINS" value={String(wins)} accent="#4ade80" />
            <View style={styles.statDivider} />
            <StatBlock label="WIN RATE" value={`${winRate}%`} accent="#8b5cf6" />
          </View>

          {/* Mode breakdown */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>BY GAME MODE</Text>
            <View style={styles.modeCard}>
              <ModeRow
                mode="SUDDEN DEATH"
                wins={modes.SUDDEN_DEATH.wins}
                losses={modes.SUDDEN_DEATH.losses}
                draws={modes.SUDDEN_DEATH.draws}
              />
              <View style={styles.modeDivider} />
              <ModeRow
                mode="AREA CONTROL"
                wins={modes.AREA_CONTROL.wins}
                losses={modes.AREA_CONTROL.losses}
                draws={modes.AREA_CONTROL.draws}
              />
            </View>
          </View>

          {/* Recent games placeholder */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>RECENT GAMES</Text>
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="chess-knight" size={40} color="#cbd5e1" />
              <Text style={styles.emptyStateTitle}>NO GAMES YET</Text>
              <Text style={styles.emptyStateBody}>Play your first game to see history here</Text>
            </View>
          </View>

          {/* Sign in CTA */}
          <Pressable
            style={({ pressed }) => [styles.signInBtn, pressed && styles.signInBtnPressed]}
            accessibilityLabel="Sign in to save your stats"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="login" size={18} color="#ffffff" />
            <Text style={styles.signInBtnText}>SIGN IN TO SAVE STATS</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#7dd3fc',
  },
  scroll: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 40,
    borderWidth: 5,
    borderColor: '#1e293b',
    padding: 28,
    width: '100%',
    maxWidth: 380,
    gap: 20,
    ...Platform.select({
      web: { boxShadow: '12px 12px 0px #1e293b' },
      default: {
        shadowColor: '#1e293b',
        shadowOffset: { width: 12, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 12,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#1e293b',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: { shadowOffset: { width: 0, height: 0 }, elevation: 0 },
    }),
  },
  headerTitle: {
    fontWeight: '900',
    fontSize: 18,
    color: '#1e293b',
    letterSpacing: 2,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    gap: 8,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ede9fe',
    borderWidth: 4,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
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
  username: {
    fontWeight: '900',
    fontSize: 22,
    color: '#1e293b',
    letterSpacing: 3,
  },
  guestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  guestBadgeText: {
    fontWeight: '800',
    fontSize: 11,
    color: '#64748b',
    letterSpacing: 1.5,
  },

  // Stats row
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#e2e8f0',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontWeight: '900',
    fontSize: 28,
    color: '#1e293b',
    letterSpacing: 1,
  },
  statLabel: {
    fontWeight: '800',
    fontSize: 10,
    color: '#94a3b8',
    letterSpacing: 1.5,
  },
  statDivider: {
    width: 2,
    height: 40,
    backgroundColor: '#e2e8f0',
    borderRadius: 1,
  },

  // Mode breakdown
  sectionBlock: {
    gap: 10,
  },
  sectionLabel: {
    fontWeight: '800',
    fontSize: 11,
    color: '#64748b',
    letterSpacing: 2,
  },
  modeCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modeDivider: {
    height: 2,
    backgroundColor: '#e2e8f0',
  },
  modeLabel: {
    fontWeight: '800',
    fontSize: 13,
    color: '#1e293b',
    letterSpacing: 1,
  },
  modeStats: {
    flexDirection: 'row',
    gap: 12,
  },
  modeW: { fontWeight: '800', fontSize: 13, color: '#4ade80' },
  modeL: { fontWeight: '800', fontSize: 13, color: '#ef4444' },
  modeD: { fontWeight: '800', fontSize: 13, color: '#94a3b8' },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#e2e8f0',
  },
  emptyStateTitle: {
    fontWeight: '900',
    fontSize: 14,
    color: '#cbd5e1',
    letterSpacing: 2,
  },
  emptyStateBody: {
    fontWeight: '600',
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },

  // Sign in CTA
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8b5cf6',
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#1e293b',
    paddingVertical: 14,
    marginTop: 4,
    ...Platform.select({
      web: { boxShadow: '4px 4px 0px #1e293b', cursor: 'pointer' },
      default: {
        shadowColor: '#1e293b',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
      },
    }),
  },
  signInBtnPressed: {
    transform: [{ translateX: 4 }, { translateY: 4 }],
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: { shadowOffset: { width: 0, height: 0 }, elevation: 0 },
    }),
  },
  signInBtnText: {
    fontWeight: '900',
    fontSize: 15,
    color: '#ffffff',
    letterSpacing: 1.5,
  },
})
