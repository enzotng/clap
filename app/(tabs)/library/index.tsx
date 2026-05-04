import { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useLibraryState } from '@/context/LibraryContext';
import { useMoviesById } from '@/hooks/useMoviesById';
import { MoviePoster } from '@/components/MoviePoster';
import { MoviePosterSkeleton } from '@/components/MoviePosterSkeleton';
import {
  colors,
  fonts,
  spacing,
  STATUS_COLORS,
  STATUS_LABELS,
  TAB_BAR_HEIGHT,
  TAB_BAR_BOTTOM_INSET,
  type Status,
} from '@/theme/tokens';

const STATUSES: Status[] = ['watch', 'fav', 'seen', 'pass'];
const PER_SECTION = 15;
const POSTER_W = 100;
const SCROLL_BOTTOM_PAD = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_INSET + spacing.lg;

export default function LibraryIndex() {
  const { counts, getByStatus } = useLibraryState();

  const idsByStatus = useMemo(() => {
    const out: Record<Status, number[]> = { watch: [], seen: [], fav: [], pass: [] };
    for (const s of STATUSES) {
      out[s] = getByStatus(s).slice(0, PER_SECTION);
    }
    return out;
  }, [getByStatus]);

  const allIds = useMemo(() => STATUSES.flatMap((s) => idsByStatus[s]), [idsByStatus]);
  const { moviesById: movies } = useMoviesById(allIds);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h1}>Bibliothèque</Text>
        {STATUSES.map((s) => (
          <Section
            key={s}
            status={s}
            count={counts[s]}
            ids={idsByStatus[s]}
            movies={movies}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  status,
  count,
  ids,
  movies,
}: {
  status: Status;
  count: number;
  ids: number[];
  movies: Record<number, import('@/lib/tmdb').TmdbMovie | undefined>;
}) {
  const onSeeAll = useCallback(() => {
    router.push({ pathname: '/library/[status]', params: { status } });
  }, [status]);

  return (
    <View style={styles.section}>
      <Pressable
        onPress={onSeeAll}
        style={styles.sectionHeader}
        accessibilityRole="button"
        accessibilityLabel={`Voir tous les films ${STATUS_LABELS[status]}`}
      >
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[status] }]} />
        <Text style={[styles.sectionLabel, { color: STATUS_COLORS[status] }]}>{STATUS_LABELS[status]}</Text>
        <Text style={styles.sectionCount}>{count}</Text>
        <ChevronRight size={18} color={colors.ink3} strokeWidth={1.8} />
      </Pressable>
      {ids.length === 0 ? (
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>Aucun film pour l'instant</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {ids.map((id) => {
            const m = movies[id];
            if (!m) {
              return (
                <View key={id} style={styles.posterCard}>
                  <MoviePosterSkeleton width={POSTER_W} />
                </View>
              );
            }
            return (
              <Pressable
                key={id}
                onPress={() => router.push({ pathname: '/movie/[id]', params: { id: String(id) } })}
                style={styles.posterCard}
                accessibilityRole="button"
                accessibilityLabel={m.title}
              >
                <MoviePoster path={m.poster_path} size="w500" width={POSTER_W} title={m.title} />
                <Text style={styles.posterTitle} numberOfLines={2}>{m.title}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: SCROLL_BOTTOM_PAD },
  h1: {
    fontFamily: fonts.serifBold,
    fontSize: 32,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  section: { marginTop: spacing.lg, gap: spacing.s },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.s,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    flex: 1,
  },
  sectionCount: { fontFamily: fonts.serifBold, color: colors.ink2, fontSize: 14 },
  row: { gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.s },
  posterCard: { width: POSTER_W, gap: 6 },
  posterTitle: { fontFamily: fonts.sansMed, color: colors.ink2, fontSize: 11 },
  emptyRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: colors.bg2,
    borderRadius: 14,
    marginHorizontal: spacing.md,
    alignItems: 'center',
  },
  emptyText: { fontFamily: fonts.sans, color: colors.ink3, fontSize: 13 },
});
