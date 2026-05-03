import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useLibraryState } from '@/context/LibraryContext';
import { useMoviesById } from '@/hooks/useMoviesById';
import type { TmdbMovie } from '@/lib/tmdb';
import { MovieRow } from '@/components/MovieRow';
import { EmptyState } from '@/components/EmptyState';
import {
  colors,
  fonts,
  radius,
  spacing,
  STATUS_COLORS,
  STATUS_LABELS,
  TAB_BAR_HEIGHT,
  TAB_BAR_BOTTOM_INSET,
  type Status,
} from '@/theme/tokens';

type SortMode = 'date' | 'title' | 'rating';

const SORT_LABELS: Record<SortMode, string> = {
  date: 'Date',
  title: 'Titre',
  rating: 'Note',
};

const VALID_STATUSES: readonly Status[] = ['watch', 'seen', 'fav', 'pass'];

function isStatus(s: string | undefined): s is Status {
  return typeof s === 'string' && (VALID_STATUSES as readonly string[]).includes(s);
}

const SCROLL_BOTTOM_PAD = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_INSET + spacing.lg;

export default function LibraryStatusScreen() {
  const { status } = useLocalSearchParams<{ status: string }>();
  const validStatus: Status = isStatus(status) ? status : 'watch';

  const { getByStatus, getRating } = useLibraryState();
  const ids = getByStatus(validStatus);
  const moviesById = useMoviesById(ids);
  const [sortMode, setSortMode] = useState<SortMode>('date');

  const data = useMemo(() => {
    const movies = ids.map((id) => moviesById[id]).filter((m): m is TmdbMovie => Boolean(m));
    if (sortMode === 'title') {
      return [...movies].sort((a, b) => a.title.localeCompare(b.title, 'fr'));
    }
    if (sortMode === 'rating') {
      return [...movies].sort((a, b) => (getRating(b.id) ?? -1) - (getRating(a.id) ?? -1));
    }
    return movies;
  }, [ids, moviesById, sortMode, getRating]);

  const renderItem = useCallback(
    ({ item }: { item: TmdbMovie }) => (
      <Animated.View entering={FadeIn} exiting={FadeOut.duration(200)}>
        <MovieRow movie={item} />
      </Animated.View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: TmdbMovie) => String(item.id), []);
  const ItemSeparator = useCallback(() => <View style={styles.separator} />, []);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Retour à la bibliothèque"
          accessibilityRole="button"
        >
          <ChevronLeft color={colors.ink} size={22} strokeWidth={1.8} />
        </Pressable>
        <Text style={[styles.title, { color: STATUS_COLORS[validStatus] }]}>{STATUS_LABELS[validStatus]}</Text>
        <Text style={styles.count}>{ids.length}</Text>
      </View>
      {ids.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
          {(['date', 'title', 'rating'] as SortMode[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => setSortMode(m)}
              style={[styles.sortChip, sortMode === m && styles.sortChipActive]}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Trier par ${SORT_LABELS[m]}`}
              accessibilityState={{ selected: sortMode === m }}
            >
              <Text style={[styles.sortChipText, sortMode === m && styles.sortChipTextActive]}>
                {SORT_LABELS[m]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      {ids.length === 0 ? (
        <EmptyState title="Cette liste est vide" subtitle="Va découvrir des films pour la remplir." />
      ) : (
        <Animated.FlatList
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          itemLayoutAnimation={LinearTransition.springify()}
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={styles.list}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={9}
          removeClippedSubviews
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  title: { fontFamily: fonts.serifBold, fontSize: 24, flex: 1 },
  count: { fontFamily: fonts.mono, color: colors.ink3, fontSize: 12 },
  list: { padding: spacing.md, paddingTop: 0, paddingBottom: SCROLL_BOTTOM_PAD },
  separator: { height: spacing.s },
  sortRow: { gap: spacing.s, paddingHorizontal: spacing.md, paddingBottom: spacing.s },
  sortChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line2,
    backgroundColor: colors.bg2,
  },
  sortChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  sortChipText: { fontFamily: fonts.sansMed, color: colors.ink2, fontSize: 12 },
  sortChipTextActive: { color: colors.bg },
});
