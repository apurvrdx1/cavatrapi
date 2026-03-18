import { View, Text, StyleSheet, Pressable, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { KnightPiece } from '../components/KnightPiece'

export default function HomeScreen() {
  const router = useRouter()

  return (
    <View style={styles.bg}>
      <View style={styles.card}>
        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>CAVA</Text>
          <Text style={styles.title}>TRAPI</Text>
        </View>

        {/* Hero pieces */}
        <View style={styles.heroRow}>
          <View style={styles.piece1}>
            <KnightPiece color="#facc15" size={120} />
          </View>
          <View style={styles.piece2}>
            <KnightPiece color="#8b5cf6" size={120} />
          </View>
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>Knight Territory · 2 Players</Text>

        {/* Primary CTA */}
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]}
          onPress={() => router.push('/lobby')}
        >
          <MaterialCommunityIcons name="sword-cross" size={24} color="#1e293b" />
          <Text style={styles.btnPrimaryText}>PLAY NOW</Text>
        </Pressable>

        {/* Secondary CTA */}
        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnSecondaryPressed]}
          onPress={() => router.push('/assets')}
        >
          <Text style={styles.btnSecondaryText}>Asset Pack</Text>
        </Pressable>

        {/* Profile link */}
        <Pressable
          style={styles.profileLink}
          onPress={() => router.push('/profile')}
          accessibilityLabel="View profile"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="account-circle-outline" size={18} color="#64748b" />
          <Text style={styles.profileLinkText}>My Profile</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#7dd3fc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 40,
    borderWidth: 5,
    borderColor: '#1e293b',
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
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
  titleBlock: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontWeight: '900',
    fontSize: 56,
    color: '#facc15',
    letterSpacing: 4,
    lineHeight: 60,
    ...Platform.select({
      web: { textShadow: '4px 4px 0 #1e293b', WebkitTextStroke: '2px #1e293b' },
      default: {},
    }),
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginVertical: 24,
    gap: 8,
  },
  piece1: {
    transform: [{ rotate: '-8deg' }],
    marginBottom: 8,
  },
  piece2: {
    transform: [{ rotate: '6deg' }],
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 32,
    textAlign: 'center',
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ade80',
    borderRadius: 28,
    borderWidth: 4,
    borderColor: '#1e293b',
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    gap: 10,
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 0px #1e293b, inset 0 -6px 0 rgba(0,0,0,0.15)',
        cursor: 'pointer',
      },
      default: {
        shadowColor: '#1e293b',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 4,
      },
    }),
  },
  btnPressed: {
    transform: [{ translateX: 4 }, { translateY: 4 }],
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: {
        shadowOffset: { width: 0, height: 0 },
        elevation: 0,
      },
    }),
  },
  btnPrimaryText: {
    fontWeight: '900',
    fontSize: 20,
    color: '#1e293b',
    letterSpacing: 2,
  },
  btnSecondary: {
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#1e293b',
    paddingVertical: 12,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
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
  btnSecondaryPressed: {
    transform: [{ translateX: 4 }, { translateY: 4 }],
    ...Platform.select({
      web: { boxShadow: 'none' },
      default: { shadowOffset: { width: 0, height: 0 }, elevation: 0 },
    }),
  },
  btnSecondaryText: {
    fontWeight: '800',
    fontSize: 16,
    color: '#475569',
    letterSpacing: 1,
  },
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  profileLinkText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#64748b',
  },
})
