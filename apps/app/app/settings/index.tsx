import { View, Text, StyleSheet, Pressable, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useClerk } from '@clerk/clerk-expo'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuthStore } from '../../stores/authStore'
import { useSettingsStore } from '../../stores/settingsStore'

// ─── Pill selector ────────────────────────────────────────────────────────────

function PillRow<T extends string | number>({
  options,
  value,
  onSelect,
  activeColor,
  renderLabel,
}: {
  options: T[]
  value: T
  onSelect: (v: T) => void
  activeColor: string
  renderLabel: (v: T) => string
}) {
  return (
    <View style={styles.pillRow}>
      {options.map((opt) => {
        const isActive = opt === value
        return (
          <Pressable
            key={String(opt)}
            style={({ pressed }) => [
              styles.pill,
              isActive && { backgroundColor: activeColor + '26', borderColor: activeColor },
              !isActive && styles.pillInactive,
              pressed && styles.pillPressed,
            ]}
            onPress={() => onSelect(opt)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.pillText,
                isActive ? { color: activeColor } : styles.pillTextInactive,
              ]}
            >
              {renderLabel(opt)}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.sectionHeader}>{label}</Text>
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return <View style={styles.divider} />
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter()
  const { signOut } = useClerk()
  const { isGuest, guestUsername, username, displayName } = useAuthStore()
  const { clear: clearAuth } = useAuthStore()
  const { clockSeconds, aiDifficulty, setClockSeconds, setAIDifficulty } = useSettingsStore()

  const clockOptions: (15 | 30 | 45)[] = [15, 30, 45]
  const difficultyOptions: ('EASY' | 'MEDIUM' | 'HARD')[] = ['EASY', 'MEDIUM', 'HARD']

  async function handleSignOut() {
    await signOut()
    clearAuth()
    router.replace('/')
  }

  return (
    <View style={styles.bg}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
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
          <Text style={styles.headerTitle}>SETTINGS</Text>
          <View style={styles.backBtn} />
        </View>

        {/* Main card */}
        <View style={styles.card}>

          {/* GAME SETTINGS */}
          <SectionHeader label="GAME SETTINGS" />

          {/* Turn Clock */}
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <MaterialCommunityIcons name="timer-outline" size={22} color="#60a5fa" />
              <Text style={styles.rowLabelText}>TURN CLOCK</Text>
            </View>
            <PillRow
              options={clockOptions}
              value={clockSeconds}
              onSelect={setClockSeconds}
              activeColor="#60a5fa"
              renderLabel={(v) => `${v}s`}
            />
          </View>

          {/* AI Difficulty */}
          <View style={styles.row}>
            <View style={styles.rowLabel}>
              <MaterialCommunityIcons name="robot-outline" size={22} color="#fb923c" />
              <Text style={styles.rowLabelText}>AI DIFFICULTY</Text>
            </View>
            <PillRow
              options={difficultyOptions}
              value={aiDifficulty}
              onSelect={setAIDifficulty}
              activeColor="#fb923c"
              renderLabel={(v) => v}
            />
          </View>

          <Divider />

          {/* ACCOUNT */}
          <SectionHeader label="ACCOUNT" />

          {isGuest || !username ? (
            /* Guest state */
            <View style={styles.accountRow}>
              <MaterialCommunityIcons name="incognito" size={32} color="#94a3b8" />
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>
                  {guestUsername ?? displayName ?? 'Guest'}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.signInBtn, pressed && styles.signInBtnPressed]}
                onPress={() => router.push('/')}
                accessibilityLabel="Sign in to save stats"
                accessibilityRole="button"
              >
                <Text style={styles.signInBtnText}>SIGN IN TO SAVE STATS</Text>
              </Pressable>
            </View>
          ) : (
            /* Signed-in state */
            <View>
              <View style={styles.accountRow}>
                <MaterialCommunityIcons name="account-circle" size={32} color="#8b5cf6" />
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{displayName ?? username}</Text>
                </View>
              </View>
              <View style={{ marginTop: 24 }}>
                <Pressable
                  style={({ pressed }) => [styles.signOutBtn, pressed && styles.signOutBtnPressed]}
                  onPress={handleSignOut}
                  accessibilityLabel="Sign out"
                  accessibilityRole="button"
                >
                  <Text style={styles.signOutBtnText}>SIGN OUT</Text>
                </Pressable>
              </View>
            </View>
          )}

          <Divider />

          {/* ABOUT */}
          <SectionHeader label="ABOUT" />

          {/* How to Play row */}
          <Pressable
            style={({ pressed }) => [styles.aboutRow, pressed && styles.aboutRowPressed]}
            onPress={() => router.push('/how-to-play')}
            accessibilityLabel="How to play"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="book-open-outline" size={22} color="#475569" />
            <Text style={styles.aboutRowText}>HOW TO PLAY</Text>
            <View style={styles.aboutRowSpacer} />
            <MaterialCommunityIcons name="chevron-right" size={22} color="#94a3b8" />
          </Pressable>

          {/* Version row */}
          <View style={styles.aboutRow}>
            <MaterialCommunityIcons name="information-outline" size={22} color="#94a3b8" />
            <Text style={styles.aboutRowText}>VERSION</Text>
            <View style={styles.aboutRowSpacer} />
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>

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
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
    gap: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: 'Nunito_900Black',
    fontSize: 20,
    color: '#1e293b',
    letterSpacing: 2,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#1e293b',
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: {
    transform: [{ translateX: 4 }, { translateY: 4 }],
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: { shadowOffset: { width: 0, height: 0 }, elevation: 0 },
    }),
  },

  // Main card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 40,
    borderWidth: 5,
    borderColor: '#1e293b',
    padding: 28,
    gap: 16,
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

  // Section header
  sectionHeader: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 11,
    color: '#475569',
    letterSpacing: 2,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },

  // Settings row
  row: {
    minHeight: 52,
    gap: 10,
    paddingVertical: 4,
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowLabelText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 13,
    color: '#1e293b',
    letterSpacing: 1,
  },

  // Pill row
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    minWidth: 56,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  pillInactive: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  pillPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },
  pillText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  pillTextInactive: {
    color: '#94a3b8',
  },

  // Account
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingVertical: 4,
    flexWrap: 'wrap',
  },
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  accountName: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 15,
    color: '#1e293b',
  },
  accountEmail: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    color: '#475569',
  },
  signInBtn: {
    backgroundColor: '#4ade80',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  signInBtnPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },
  signInBtnText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 11,
    color: '#1e293b',
    letterSpacing: 0.5,
  },
  signOutBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#ef4444',
    paddingVertical: 14,
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  signOutBtnPressed: {
    transform: [{ translateX: 4 }, { translateY: 4 }],
    opacity: 0.8,
  },
  signOutBtnText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 14,
    color: '#ef4444',
    letterSpacing: 1.5,
  },

  // About rows
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingVertical: 12,
  },
  aboutRowPressed: {
    opacity: 0.7,
  },
  aboutRowText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 13,
    color: '#1e293b',
    letterSpacing: 1,
  },
  aboutRowSpacer: {
    flex: 1,
  },
  versionText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: '#94a3b8',
  },
})
