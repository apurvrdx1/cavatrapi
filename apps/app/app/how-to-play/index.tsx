import { View, Text, StyleSheet, Pressable, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'

// ─── Label Pill ───────────────────────────────────────────────────────────────

function LabelPill({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: color + '26', // ~15% opacity
          borderColor: color,
        },
      ]}
    >
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  )
}

// ─── L-Shape Move Grid ────────────────────────────────────────────────────────

// 5×5 grid; knight at (2,2); reachable squares marked
const KNIGHT_MOVES = new Set([
  '0,1', '1,0', '0,3', '1,4',
  '3,0', '4,1', '3,4', '4,3',
])
const KNIGHT_POS = '2,2'

function MoveGrid() {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 5 }, (_, row) => (
        <View key={row} style={styles.gridRow}>
          {Array.from({ length: 5 }, (_, col) => {
            const key = `${row},${col}`
            const isKnight = key === KNIGHT_POS
            const isReachable = KNIGHT_MOVES.has(key)
            return (
              <View
                key={col}
                style={[
                  styles.gridCell,
                  isKnight && styles.gridCellKnight,
                  isReachable && styles.gridCellReachable,
                  !isKnight && !isReachable && styles.gridCellEmpty,
                ]}
              />
            )
          })}
        </View>
      ))}
    </View>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({
  pillLabel,
  pillColor,
  children,
}: {
  pillLabel: string
  pillColor: string
  children: React.ReactNode
}) {
  return (
    <View style={styles.section}>
      <LabelPill label={pillLabel} color={pillColor} />
      <View style={styles.sectionContent}>{children}</View>
    </View>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HowToPlayScreen() {
  const router = useRouter()

  return (
    <View style={styles.bg}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Header row */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>HOW TO PLAY</Text>
            <Pressable
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
              onPress={() => router.back()}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="close" size={22} color="#1e293b" />
            </Pressable>
          </View>

          {/* 1. THE BOARD */}
          <Section pillLabel="THE BOARD" pillColor="#475569">
            <Text style={styles.bodyText}>
              An 8×8 grid. Knights start in opposite corners. You play as Purple.
            </Text>
          </Section>

          {/* 2. HOW TO MOVE */}
          <Section pillLabel="HOW TO MOVE" pillColor="#8b5cf6">
            <Text style={styles.bodyText}>
              Knights move in an L-shape: 2 squares one direction, then 1 perpendicular.
            </Text>
            <MoveGrid />
          </Section>

          {/* 3. CLAIM TERRITORY */}
          <Section pillLabel="CLAIM TERRITORY" pillColor="#4ade80">
            <Text style={styles.bodyText}>
              Every square you land on is claimed for your color. Claimed squares can't be reclaimed.
            </Text>
          </Section>

          {/* 4. GAME MODES */}
          <Section pillLabel="GAME MODES" pillColor="#fb923c">
            <View style={styles.modesRow}>
              <View style={styles.modeCard}>
                <MaterialCommunityIcons name="skull-outline" size={28} color="#ef4444" />
                <Text style={styles.modeCardTitle}>SUDDEN DEATH</Text>
                <Text style={styles.modeCardBody}>
                  Trap your opponent — if they can't move, you win
                </Text>
              </View>
              <View style={styles.modeCard}>
                <MaterialCommunityIcons name="grid" size={28} color="#60a5fa" />
                <Text style={styles.modeCardTitle}>AREA CONTROL</Text>
                <Text style={styles.modeCardBody}>
                  Claim the most squares when no moves remain
                </Text>
              </View>
            </View>
          </Section>

          {/* 5. TURN CLOCK */}
          <Section pillLabel="TURN CLOCK" pillColor="#60a5fa">
            <Text style={styles.bodyText}>
              Each turn has a time limit: 15, 30, or 45 seconds. Run out of time and you lose.
            </Text>
          </Section>

          {/* 6. VS AI */}
          <Section pillLabel="VS AI" pillColor="#fb923c">
            <Text style={styles.bodyText}>
              Play solo against the computer. Choose Easy, Medium, or Hard difficulty.
            </Text>
          </Section>

          {/* Bottom CTA */}
          <Pressable
            style={({ pressed }) => [styles.gotItBtn, pressed && styles.gotItBtnPressed]}
            onPress={() => router.back()}
            accessibilityLabel="Got it"
            accessibilityRole="button"
          >
            <Text style={styles.gotItBtnText}>GOT IT!</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: 'Nunito_900Black',
    fontSize: 22,
    color: '#1e293b',
    letterSpacing: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#1e293b',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: {
    transform: [{ translateX: 4 }, { translateY: 4 }],
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: { shadowOffset: { width: 0, height: 0 }, elevation: 0 },
    }),
  },

  // Label pill
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pillText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 12,
    letterSpacing: 1,
  },

  // Section
  section: {
    gap: 10,
  },
  sectionContent: {
    gap: 10,
  },

  // Body text
  bodyText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },

  // Move grid
  grid: {
    alignSelf: 'center',
    gap: 2,
    marginTop: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 2,
  },
  gridCell: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  gridCellEmpty: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  gridCellKnight: {
    backgroundColor: '#8b5cf6',
  },
  gridCellReachable: {
    backgroundColor: '#4ade80',
  },

  // Game modes
  modesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    alignItems: 'flex-start',
  },
  modeCardTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 12,
    color: '#1e293b',
    letterSpacing: 1,
  },
  modeCardBody: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },

  // GOT IT button
  gotItBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ade80',
    borderRadius: 28,
    borderWidth: 4,
    borderColor: '#1e293b',
    paddingVertical: 16,
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
  gotItBtnPressed: {
    transform: [{ translateX: 4 }, { translateY: 4 }],
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: { shadowOffset: { width: 0, height: 0 }, elevation: 0 },
    }),
  },
  gotItBtnText: {
    fontFamily: 'Nunito_900Black',
    fontSize: 16,
    color: '#1e293b',
    letterSpacing: 2,
  },
})
