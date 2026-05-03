import { memo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { BarcodeBars } from './BarcodeBars';
import { Perforation } from './Perforation';
import { posterUrl } from '@/lib/tmdb';
import { TICKET_NUM_BASE } from '@/lib/constants';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import type { TmdbMovie } from '@/lib/tmdb';

const TICKET_BG = '#F4EFE6';
const TICKET_INK = '#0A0908';

type Props = {
  movie: TmdbMovie;
  width: number;
  index?: number;
  onTap?: boolean;
};

function MovieTicketImpl({ movie, width, index = 1, onTap = true }: Props) {
  const url = posterUrl(movie.poster_path, 'w500');
  const year = movie.release_date ? movie.release_date.slice(0, 4) : '----';
  const ticketNum = String(TICKET_NUM_BASE + index).padStart(4, '0');
  const rating = (movie.vote_average ?? 0).toFixed(1);

  const onPress = useCallback(() => {
    router.push({ pathname: '/movie/[id]', params: { id: String(movie.id) } });
  }, [movie.id]);

  const card = (
    <View style={[styles.card, { width, backgroundColor: TICKET_BG, borderRadius: radius.m }]}>
      <View style={styles.header}>
        <Text style={styles.headerText}>TICKET DE PROJECTION · N° {ticketNum}</Text>
      </View>
      <View style={styles.posterFrame}>
        {url ? (
          <Image source={{ uri: url }} style={styles.poster} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.poster, styles.posterFallback]}>
            <Text style={styles.posterFallbackText}>{movie.title}</Text>
          </View>
        )}
      </View>
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={2}>{movie.title}</Text>
        <Text style={styles.sub}>{year} · ★ {rating}</Text>
      </View>
      <Perforation color={TICKET_INK} height={10} />
      <View style={styles.barcode}>
        <BarcodeBars width={width - 48} height={18} color={TICKET_INK} />
        <Text style={styles.adminText}>ADMIT ONE · CLAP'</Text>
      </View>
    </View>
  );

  if (!onTap) return card;
  return <Pressable onPress={onPress}>{card}</Pressable>;
}

export const MovieTicket = memo(MovieTicketImpl);

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  header: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.m,
    paddingVertical: 4,
  },
  headerText: { fontFamily: fonts.mono, fontSize: 8, color: TICKET_INK, letterSpacing: 0.8, textTransform: 'uppercase' },
  posterFrame: { padding: 6, backgroundColor: TICKET_INK },
  poster: { width: '100%', aspectRatio: 2 / 3, backgroundColor: '#222' },
  posterFallback: { alignItems: 'center', justifyContent: 'center' },
  posterFallbackText: { color: TICKET_BG, fontFamily: fonts.serifBold, padding: spacing.s, textAlign: 'center' },
  meta: { paddingHorizontal: spacing.m, paddingTop: 8, paddingBottom: 6, gap: 2 },
  title: { fontFamily: fonts.serifBold, fontSize: 18, color: TICKET_INK },
  sub: { fontFamily: fonts.sansMed, fontSize: 11, color: TICKET_INK, fontStyle: 'italic' },
  barcode: { paddingHorizontal: spacing.md, paddingBottom: spacing.s, alignItems: 'center', gap: 2 },
  adminText: { fontFamily: fonts.mono, fontSize: 8, color: TICKET_INK, letterSpacing: 0.8 },
});
