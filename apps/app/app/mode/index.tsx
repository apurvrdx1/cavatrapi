import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  LayoutAnimation,
} from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { KnightPiece } from '../../components/KnightPiece'
import { useAuthStore } from '../../stores/authStore'
import { useSettingsStore } from '../../stores/settingsStore'

type ModeKey = 'ai' | 'local' | 'online'
type GameMode = 'SUDDEN_DEATH' | 'AREA_CONTROL'

// ─── Mode pill row ────────────────────────────────────────────────────────────

function ModePills({
  selected,
  onSelect,
  accentColor,
}: {
  selected: GameMode
  onSelect: (m: GameMode) => void
  accentColor: string
}) {
  return (
    <View style={styles.pillRow}>
      {(['SUDDEN_DEATH', 'AREA_CONTROL'] as const).map((m) => {
        const isActive = selected === m
        return (
          <Pressable
            key={m}
            style={[
              styles.pill,
              isActive && { borderColor: accentColor, backgroundColor: accentColor + '22' },
            ]}
            onPress={() => onSelect(m)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.pillText,
                isActive && { color: accentColor, fontWeight: '800' },
              ]}
            >
              {m === 'SUDDEN_DEATH' ? 'SUDDEN DEATH' : 'AREA CONTROL'}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

// ─── Mode card ────────────────────────────────────────────────────────────────

function ModeCard({
  modeKey,
  expanded,
  onToggle,
  accentColor,
  icon,
  label,
  children,
}: {
  modeKey: ModeKey
  expanded: boolean
  onToggle: () => void
  accentColor: string
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']
  label: string
  children: React.ReactNode
}) {
  return (
    <View
      style={[
        styles.modeCard,
        expanded && { borderColor: accentColor },
        Platform.select({
          web: { boxShadow: expanded ? `4px 4px 0 ${accentColor}` : '4px 4px 0 #1e293b' },
          default: {
            shadowColor: expanded ? accentColor : '#1e293b',
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 4,
          },
        }),
      ]}
    >
      <Pressable
        style={styles.modeCardHeader}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <View style={styles.modeCardLeft}>
          <MaterialCommunityIcons name={icon} size={24} color={accentColor} />
          <Text style={[styles.modeCardLabel, { color: accentColor }]}>{label}</Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-down"
          size={22}
          color={accentColor}
          style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {expanded && <View style={styles.modeCardBody}>{children}</View>}
    </View>
  )
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionButton({
  label,
  color,
  icon,
  onPress,
  secondary,
}: {
  label: string
  color: string
  icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name']
  onPress: () => void
  secondary?: boolean
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionBtn,
        secondary
          ? styles.actionBtnSecondary
          : { backgroundColor: color, borderColor: '#1e293b' },
        pressed && styles.actionBtnPressed,
        pressed && Platform.select({ web: { boxShadow: 'none' }, default: { shadowOffset: { width: 0, height: 0 }, elevation: 0 } }),
      ]}
      onPress={onPress}
      accessibilityRole="button"
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={secondary ? '#475569' : '#1e293b'}
        />
      )}
      <Text
        style={[
          styles.actionBtnText,
          secondary ? { color: '#475569', fontWeight: '800' } : { color: '#1e293b', fontWeight: '900' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ModeScreen() {
  const router = useRouter()
  const { displayName } = useAuthStore()
  const { clockSeconds, aiDifficulty } = useSettingsStore()

  const [expandedMode, setExpandedMode] = useState<ModeKey | null>(null)
  const [aiGameMode, setAiGameMode] = useState<GameMode>('SUDDEN_DEATH')
  const [localGameMode, setLocalGameMode] = useState<GameMode>('SUDDEN_DEATH')
  const [onlineGameMode, setOnlineGameMode] = useState<GameMode>('SUDDEN_DEATH')

  function toggleMode(mode: ModeKey) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpandedMode((prev) => (prev === mode ? null : mode))
  }

  return (
    <View style={styles.bg}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Header row */}
          <View style={styles.header}>
            <Pressable
              style={styles.headerLeft}
              onPress={() => router.push('/profile')}
              accessibilityRole="button"
              accessibilityLabel="View profile"
            >
              <KnightPiece color="#8b5cf6" size={24} />
              <Text style={styles.displayName} numberOfLines={1}>
                {displayName ?? 'Player'}
              </Text>
            </Pressable>

            <Text style={styles.headerTitle}>PLAY</Text>

            <Pressable
              onPress={() => router.push('/settings')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <MaterialCommunityIcons name="cog-outline" size={24} color="#475569" />
            </Pressable>
          </View>

          {/* Mode cards */}
          <View style={styles.modesContainer}>
            {/* VS AI */}
            <ModeCard
              modeKey="ai"
              expanded={expandedMode === 'ai'}
              onToggle={() => toggleMode('ai')}
              accentColor="#fb923c"
              icon="robot-outline"
              label="VS AI"
            >
              <ModePills
                selected={aiGameMode}
                onSelect={setAiGameMode}
                accentColor="#fb923c"
              />
              <ActionButton
                label="START GAME →"
                color="#fb923c"
                onPress={() =>
                  router.push(
                    `/game/ai?mode=${aiGameMode}&clock=${clockSeconds}&difficulty=${aiDifficulty}`,
                  )
                }
              />
            </ModeCard>

            {/* Local Play */}
            <ModeCard
              modeKey="local"
              expanded={expandedMode === 'local'}
              onToggle={() => toggleMode('local')}
              accentColor="#60a5fa"
              icon="account-group-outline"
              label="LOCAL PLAY"
            >
              <ModePills
                selected={localGameMode}
                onSelect={setLocalGameMode}
                accentColor="#60a5fa"
              />
              <ActionButton
                label="START GAME →"
                color="#60a5fa"
                onPress={() =>
                  router.push(`/game/local?mode=${localGameMode}&clock=${clockSeconds}`)
                }
              />
            </ModeCard>

            {/* Online */}
            <ModeCard
              modeKey="online"
              expanded={expandedMode === 'online'}
              onToggle={() => toggleMode('online')}
              accentColor="#8b5cf6"
              icon="earth"
              label="ONLINE"
            >
              <ModePills
                selected={onlineGameMode}
                onSelect={setOnlineGameMode}
                accentColor="#8b5cf6"
              />
              <ActionButton
                label="FIND MATCH →"
                color="#8b5cf6"
                onPress={() => router.push(`/online?mode=${onlineGameMode}`)}
              />
              <ActionButton
                label="INVITE FRIEND"
                color="#8b5cf6"
                icon="link-variant"
                secondary
                onPress={() =>
                  router.push(`/online?mode=${onlineGameMode}&invite=true`)
                }
              />
            </ModeCard>
          </View>

          {/* How to play */}
          <Pressable
            style={styles.howToPlay}
            onPress={() => router.push('/how-to-play')}
            accessibilityRole="button"
            accessibilityLabel="How to play"
          >
            <MaterialCommunityIcons name="help-circle-outline" size={16} color="#475569" />
            <Text style={styles.howToPlayText}>HOW TO PLAY</Text>
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
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 40,
    borderWidth: 5,
    borderColor: '#1e293b',
    padding: 20,
    width: '100%',
    maxWidth: 440,
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    minHeight: 44,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minHeight: 44,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    maxWidth: 100,
  },
  headerTitle: {
    fontWeight: '900',
    fontSize: 24,
    color: '#1e293b',
    letterSpacing: 3,
    flex: 1,
    textAlign: 'center',
  },

  // Modes container
  modesContainer: {
    gap: 12,
  },

  // Mode card
  modeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  modeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 56,
  },
  modeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modeCardLabel: {
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 2,
  },
  modeCardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },

  // Pill row
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  pillText: {
    fontWeight: '700',
    fontSize: 11,
    color: '#94a3b8',
    letterSpacing: 1,
    textAlign: 'center',
  },

  // Action button
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#1e293b',
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 52,
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
  actionBtnSecondary: {
    backgroundColor: '#f1f5f9',
    borderColor: '#1e293b',
  },
  actionBtnPressed: {
    transform: [{ translateX: 4 }, { translateY: 4 }],
  },
  actionBtnText: {
    fontSize: 15,
    letterSpacing: 1.5,
  },

  // How to play
  howToPlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    minHeight: 44,
  },
  howToPlayText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
})
