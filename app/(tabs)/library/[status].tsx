import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useLibrary } from '@/context/LibraryContext';
import { tmdbApi, type TmdbMovie } from '@/lib/tmdb';
import { MovieRow } from '@/components/MovieRow';
import { EmptyState } from '@/components/EmptyState';
import { colors, fonts, spacing, STATUS_COLORS, STATUS_LABELS, type Status } from '@/theme/tokens';

const VALID_STATUSES: readonly Status[] = ['watch', 'seen', 'fav', 'pass'];

function isStatus(s: string | undefined): s is Status {
  return typeof s === 'string' && (VALID_STATUSES as readonly string[]).includes(s);
}

export default function LibraryStatusScreen() {
  const { status } = useLocalSearchParams<{ status: string }>();
  const validStatus: Status = isStatus(status) ? status : 'watch';

  const { getByStatus } = useLibrary();
  const ids = getByStatus(validStatus);
  const idsKey = ids.join(',');

  const [moviesById, setMoviesById] = useState<Record<number, TmdbMovie>>({});
  const moviesByIdRef = useRef(moviesById);
  useEffect(() => {
    moviesByIdRef.current = moviesById;
  }, [moviesById]);

  useEffect(() => {
    const missing = ids.filter((id) => !moviesByIdRef.current[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(missing.map((id) => tmdbApi.movie(id).then((m) => ({ id, m })).catch(() => null))).then(
      (results) => {
        if (cancelled) return;
        setMoviesById((prev) => {
          const next = { ...prev };
          for (const r of results) {
            if (r) next[r.id] = r.m;
          }
          return next;
        });
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const data = useMemo(
    () => ids.map((id) => moviesById[id]).filter((m): m is TmdbMovie => Boolean(m)),
    [ids, moviesById],
  );

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
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ChevronLeft color={colors.ink} size={22} strokeWidth={1.8} />
        </Pressable>
        <Text style={[styles.title, { color: STATUS_COLORS[validStatus] }]}>{STATUS_LABELS[validStatus]}</Text>
        <Text style={styles.count}>{ids.length}</Text>
      </View>
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
  list: { padding: spacing.md, paddingTop: 0, paddingBottom: 110 },
  separator: { height: spacing.s },
});
