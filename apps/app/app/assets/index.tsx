import { ScrollView, View, Text, StyleSheet, Platform } from 'react-native'
import { KnightPiece, PLAYER_COLORS } from '../../components/KnightPiece'

export default function AssetsScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cavatrapi Asset Pack</Text>
        <Text style={styles.subtitle}>
          Cartoon Game Vector Set • Classic Knight Silhouette
        </Text>
      </View>

      {/* Color variant grid */}
      <View style={styles.grid}>
        {PLAYER_COLORS.map((item) => (
          <View key={item.hex} style={styles.card}>
            <View style={styles.cardPreview}>
              <KnightPiece color={item.hex} size={140} />
            </View>
            <Text style={styles.colorName}>{item.name}</Text>
            <View style={[styles.codeBadge, { backgroundColor: item.badgeBg }]}>
              <Text style={[styles.codeText, { color: item.badgeText }]}>
                {item.hex}
              </Text>
            </View>
          </View>
        ))}

        {/* Versus combo card */}
        <View style={styles.card}>
          <View style={[styles.cardPreview, styles.versusPreview]}>
            <View style={styles.piece1}>
              <KnightPiece color="#facc15" size={110} />
            </View>
            <View style={styles.piece2}>
              <KnightPiece color="#a855f7" size={110} />
            </View>
          </View>
          <Text style={styles.colorName}>Versus Mode</Text>
          <View style={[styles.codeBadge, { backgroundColor: '#f1f5f9' }]}>
            <Text style={[styles.codeText, { color: '#64748b' }]}>
              Combo Display
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    maxWidth: 520,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: Platform.OS === 'web' ? -0.5 : 0,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 1000,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    width: 260,
  },
  cardPreview: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  versusPreview: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingBottom: 8,
  },
  piece1: {
    transform: [{ rotate: '-3deg' }],
    marginRight: -8,
  },
  piece2: {
    transform: [{ rotate: '3deg' }, { translateY: -28 }],
    marginLeft: -8,
  },
  colorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  codeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    fontWeight: '600',
  },
})
