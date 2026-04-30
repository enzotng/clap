import { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useLibrary } from '@/context/LibraryContext';
import { colors, fonts, radius, spacing, STATUS_COLORS, STATUS_LABELS, type Status } from '@/theme/tokens';

const STATUSES: Status[] = ['watch', 'seen', 'fav', 'pass'];

export default function LibraryIndex() {
  const { counts } = useLibrary();

  const onPress = useCallback((status: Status) => {
    router.push({ pathname: '/library/[status]', params: { status } });
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Text style={styles.h1}>Bibliothèque</Text>
      <ScrollView contentContainerStyle={styles.grid}>
        {STATUSES.map((s) => (
          <Pressable
            key={s}
            style={({ pressed }) => [styles.card, { borderLeftColor: STATUS_COLORS[s], opacity: pressed ? 0.7 : 1 }]}
            onPress={() => onPress(s)}
          >
            <View style={styles.cardHead}>
              <Text style={[styles.cardLabel, { color: STATUS_COLORS[s] }]}>{STATUS_LABELS[s]}</Text>
              <ChevronRight size={18} color={colors.ink3} strokeWidth={1.8} />
            </View>
            <Text style={styles.cardCount}>{counts[s]}</Text>
            <Text style={styles.cardSub}>
              {counts[s] === 0 ? 'aucun film' : counts[s] === 1 ? '1 film' : `${counts[s]} films`}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  h1: {
    fontFamily: fonts.serifBold,
    fontSize: 32,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  grid: { padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.bg2,
    borderRadius: radius.l,
    borderWidth: 1,
    borderColor: colors.line,
    borderLeftWidth: 4,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  cardCount: { fontFamily: fonts.serifBold, fontSize: 48, color: colors.ink },
  cardSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink3 },
});
