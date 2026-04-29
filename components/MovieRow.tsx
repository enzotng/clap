import { memo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { MoviePoster } from './MoviePoster';
import { StatusBadge } from './StatusBadge';
import { useLibrary } from '@/context/LibraryContext';
import { colors, fonts, spacing, radius } from '@/theme/tokens';
import type { TmdbMovie } from '@/lib/tmdb';

function MovieRowImpl({ movie }: { movie: TmdbMovie }) {
  const { getStatus } = useLibrary();
  const status = getStatus(movie.id);

  const onPress = useCallback(() => {
    router.push({ pathname: '/movie/[id]', params: { id: String(movie.id) } });
  }, [movie.id]);

  const year = movie.release_date ? movie.release_date.slice(0, 4) : '';
  const meta = [year, movie.vote_average ? `★ ${(movie.vote_average ?? 0).toFixed(1)}` : null].filter(Boolean).join(' · ');

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <MoviePoster path={movie.poster_path} size="w185" width={64} title={movie.title} />
      <View style={styles.col}>
        <Text style={styles.title} numberOfLines={2}>{movie.title}</Text>
        <Text style={styles.meta}>{meta}</Text>
        <Text style={styles.overview} numberOfLines={2}>{movie.overview}</Text>
      </View>
      {status && (
        <View style={styles.badge}>
          <StatusBadge status={status} />
        </View>
      )}
    </Pressable>
  );
}

export const MovieRow = memo(MovieRowImpl);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.m,
    backgroundColor: colors.bg2,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'flex-start',
  },
  col: { flex: 1, gap: spacing.xs },
  title: { fontFamily: fonts.serifBold, color: colors.ink, fontSize: 16 },
  meta: { fontFamily: fonts.sansMed, color: colors.ink3, fontSize: 11, letterSpacing: 0.5 },
  overview: { fontFamily: fonts.sans, color: colors.ink2, fontSize: 12, lineHeight: 18 },
  badge: { position: 'absolute', top: spacing.s, right: spacing.s },
});
