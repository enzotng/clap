import { useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import { useLibrary } from '@/context/LibraryContext';
import { useMoviesById } from '@/hooks/useMoviesById';
import { GENRES } from '@/lib/genres';
import { formatDateFr } from '@/lib/format';
import { MoviePoster } from '@/components/MoviePoster';
import { RatingStars } from '@/components/RatingStars';
import { colors, fonts, radius, spacing, STATUS_COLORS, STATUS_LABELS, type Status } from '@/theme/tokens';

const STATUSES: Status[] = ['watch', 'seen', 'fav', 'pass'];
const APP_VERSION = '1.0.0';

export default function ProfileScreen() {
  const { state, counts, averageRating, getByStatus, clear, setPrefs } = useLibrary();
  const userName = state.prefs.name || 'Cinéphile';
  const total = counts.watch + counts.seen + counts.fav + counts.pass;
  const max = Math.max(1, ...STATUSES.map((s) => counts[s]));

  const topFavIds = useMemo(() => getByStatus('fav').slice(0, 3), [getByStatus]);
  const lastSeenId = useMemo(() => getByStatus('seen')[0], [getByStatus]);
  const moviesNeeded = useMemo(() => {
    const ids = [...topFavIds];
    if (lastSeenId) ids.push(lastSeenId);
    return ids;
  }, [topFavIds, lastSeenId]);

  const movies = useMoviesById(moviesNeeded);
  const lastSeenMovie = lastSeenId ? movies[lastSeenId] : undefined;
  const lastSeenAt = lastSeenId ? state.byId[lastSeenId]?.addedAt : undefined;

  const selectedGenres = useMemo(
    () => GENRES.filter((g) => state.prefs.preferredGenres.includes(g.id)),
    [state.prefs.preferredGenres],
  );

  const onClear = useCallback(() => {
    Alert.alert(
      'Vider la bibliothèque',
      'Tu vas perdre tous tes statuts et notes. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Vider', style: 'destructive', onPress: clear },
      ],
    );
  }, [clear]);

  const onAbout = useCallback(() => {
    Alert.alert(
      'À propos',
      `Clap' v${APP_VERSION}\n\nLe tri des films, à coups de ticket.\nProjet React Native ECV — propulsé par TMDB.`,
      [{ text: 'OK' }],
    );
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.bio}>
            {total === 0
              ? 'aucun film qualifié'
              : total === 1
                ? '1 film qualifié'
                : `${total} films qualifiés`}
          </Text>
        </View>

        {topFavIds.length > 0 && (
          <Section title="Top favoris">
            <View style={styles.favRow}>
              {topFavIds.map((id, i) => {
                const movie = movies[id];
                return (
                  <Pressable
                    key={id}
                    onPress={() => router.push({ pathname: '/movie/[id]', params: { id: String(id) } })}
                    style={styles.favItem}
                  >
                    <Text style={styles.favRank}>{i + 1}</Text>
                    <MoviePoster path={movie?.poster_path ?? null} size="w185" width={90} title={movie?.title ?? '...'} />
                    <Text style={styles.favTitle} numberOfLines={2}>{movie?.title ?? '…'}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>
        )}

        {lastSeenMovie && (
          <Section title="Dernier vu">
            <Pressable
              onPress={() => router.push({ pathname: '/movie/[id]', params: { id: String(lastSeenMovie.id) } })}
              style={styles.lastSeenCard}
            >
              <MoviePoster path={lastSeenMovie.poster_path} size="w185" width={72} title={lastSeenMovie.title} />
              <View style={styles.lastSeenBody}>
                <Text style={styles.lastSeenTitle} numberOfLines={2}>{lastSeenMovie.title}</Text>
                <Text style={styles.lastSeenDate}>{lastSeenAt ? formatDateFr(new Date(lastSeenAt).toISOString()) : ''}</Text>
              </View>
            </Pressable>
          </Section>
        )}

        {selectedGenres.length > 0 && (
          <Section title="Mes genres">
            <View style={styles.genresWrap}>
              {selectedGenres.map((g) => (
                <View key={g.id} style={styles.genreChip}>
                  <Text style={styles.genreChipText}>{g.label}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        <Section title="Répartition">
          <View style={styles.stats}>
            {STATUSES.map((s, i) => (
              <StatRow key={s} status={s} count={counts[s]} max={max} delay={i * 80} />
            ))}
          </View>
        </Section>

        {averageRating > 0 && (
          <Section title="Note moyenne">
            <View style={styles.avgRow}>
              <RatingStars value={Math.round(averageRating)} interactive={false} size={28} />
              <Text style={styles.avgValue}>{averageRating.toFixed(1)} / 5</Text>
            </View>
          </Section>
        )}

        <Section title="Paramètres">
          <SettingRow label="À propos" onPress={onAbout} />
          <SettingRow label="Vider la bibliothèque" onPress={onClear} danger />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SettingRow({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  const tint = danger ? colors.pass : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingRow, pressed && styles.settingRowPressed]}
    >
      <Text style={[styles.settingLabel, { color: tint }]}>{label}</Text>
      <ChevronRight size={18} color={colors.ink3} strokeWidth={1.8} />
    </Pressable>
  );
}

function StatRow({ status, count, max, delay }: { status: Status; count: number; max: number; delay: number }) {
  const width = useSharedValue(0);
  const ratio = count / max;

  useEffect(() => {
    width.value = withDelay(delay, withSpring(ratio, { damping: 16, stiffness: 80 }));
  }, [ratio, delay, width]);

  const barStyle = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));

  return (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, { color: STATUS_COLORS[status] }]}>{STATUS_LABELS[status]}</Text>
      <View style={styles.barWrap}>
        <Animated.View style={[styles.bar, { backgroundColor: STATUS_COLORS[status] }, barStyle]} />
      </View>
      <Text style={styles.statCount}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: 110, gap: spacing.s },
  avatarBlock: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.s },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.bg2,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s,
  },
  avatarText: { fontFamily: fonts.serifBold, color: colors.gold, fontSize: 40 },
  name: { fontFamily: fonts.serifBold, color: colors.ink, fontSize: 26 },
  bio: { fontFamily: fonts.sansMed, color: colors.ink3, fontSize: 13 },
  section: { marginTop: spacing.lg, gap: spacing.s },
  sectionTitle: {
    fontFamily: fonts.mono,
    color: colors.ink3,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  favRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.s },
  favItem: { flex: 1, alignItems: 'center', gap: 6 },
  favRank: { fontFamily: fonts.serifBold, color: colors.gold, fontSize: 22 },
  favTitle: { fontFamily: fonts.sans, color: colors.ink2, fontSize: 11, textAlign: 'center' },
  lastSeenCard: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.m,
    backgroundColor: colors.bg2,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  lastSeenBody: { flex: 1, gap: 4 },
  lastSeenTitle: { fontFamily: fonts.serifBold, color: colors.ink, fontSize: 16 },
  lastSeenDate: { fontFamily: fonts.sansMed, color: colors.ink3, fontSize: 12 },
  genresWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s },
  genreChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: 'rgba(212,165,71,0.12)',
  },
  genreChipText: { fontFamily: fonts.sansMed, color: colors.gold, fontSize: 12 },
  stats: { gap: spacing.s },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s },
  statLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    width: 110,
  },
  barWrap: { flex: 1, height: 12, backgroundColor: colors.bg2, borderRadius: 6, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 6 },
  statCount: { fontFamily: fonts.serifBold, color: colors.ink, fontSize: 16, width: 36, textAlign: 'right' },
  avgRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avgValue: { fontFamily: fonts.serifBold, color: colors.gold, fontSize: 20 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.m,
    backgroundColor: colors.bg2,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.s,
  },
  settingRowPressed: { opacity: 0.7 },
  settingLabel: { fontFamily: fonts.sansMed, fontSize: 14 },
});
