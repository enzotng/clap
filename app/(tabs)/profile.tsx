import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { ChevronRight, ExternalLink } from 'lucide-react-native';
import { useLibraryActions, useLibraryState } from '@/context/LibraryContext';
import { useMoviesById } from '@/hooks/useMoviesById';
import { useAdvancedStats } from '@/hooks/useAdvancedStats';
import { GENRES } from '@/lib/genres';
import { formatDateFr } from '@/lib/format';
import { MoviePoster } from '@/components/MoviePoster';
import { MoviePosterSkeleton } from '@/components/MoviePosterSkeleton';
import { RatingStars } from '@/components/RatingStars';
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

const STATUSES: Status[] = ['watch', 'seen', 'fav', 'pass'];
const APP_VERSION = '1.0.0';
const TMDB_URL = 'https://www.themoviedb.org/';
const SCROLL_BOTTOM_PAD = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_INSET + spacing.lg;

export default function ProfileScreen() {
  const { state, counts, averageRating, getByStatus } = useLibraryState();
  const { clear } = useLibraryActions();
  const userName = state.prefs.name || 'Cinéphile';
  const total = counts.watch + counts.seen + counts.fav + counts.pass;
  const max = Math.max(1, ...STATUSES.map((s) => counts[s]));
  const [showAbout, setShowAbout] = useState(false);

  const topFavIds = useMemo(() => getByStatus('fav').slice(0, 3), [getByStatus]);
  const lastSeenId = useMemo(() => getByStatus('seen')[0], [getByStatus]);
  const moviesNeeded = useMemo(() => {
    const ids = [...topFavIds];
    if (lastSeenId) ids.push(lastSeenId);
    return ids;
  }, [topFavIds, lastSeenId]);

  const { moviesById: movies } = useMoviesById(moviesNeeded);
  const lastSeenMovie = lastSeenId ? movies[lastSeenId] : undefined;
  const lastSeenAt = lastSeenId ? state.byId[lastSeenId]?.addedAt : undefined;

  const selectedGenres = useMemo(
    () => GENRES.filter((g) => state.prefs.preferredGenres.includes(g.id)),
    [state.prefs.preferredGenres],
  );

  const { stats: advanced } = useAdvancedStats();

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

  const onAbout = useCallback(() => setShowAbout(true), []);
  const onCloseAbout = useCallback(() => setShowAbout(false), []);

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
                if (!movie) {
                  return (
                    <View key={id} style={styles.favItem}>
                      <Text style={styles.favRank}>{i + 1}</Text>
                      <MoviePosterSkeleton width={90} />
                    </View>
                  );
                }
                return (
                  <Pressable
                    key={id}
                    onPress={() => router.push({ pathname: '/movie/[id]', params: { id: String(id) } })}
                    style={styles.favItem}
                    accessibilityRole="button"
                    accessibilityLabel={`Favori numéro ${i + 1} : ${movie.title}`}
                  >
                    <Text style={styles.favRank}>{i + 1}</Text>
                    <MoviePoster path={movie.poster_path} size="w185" width={90} title={movie.title} />
                    <Text style={styles.favTitle} numberOfLines={2}>{movie.title}</Text>
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
              accessibilityRole="button"
              accessibilityLabel={`Dernier vu : ${lastSeenMovie.title}`}
            >
              <MoviePoster path={lastSeenMovie.poster_path} size="w185" width={72} title={lastSeenMovie.title} />
              <View style={styles.lastSeenBody}>
                <Text style={styles.lastSeenTitle} numberOfLines={2}>{lastSeenMovie.title}</Text>
                <Text style={styles.lastSeenDate}>{lastSeenAt ? formatDateFr(new Date(lastSeenAt).toISOString()) : ''}</Text>
              </View>
            </Pressable>
          </Section>
        )}

        {advanced && (advanced.topGenres.length > 0 || advanced.favoriteDecade || advanced.recurrentDirector) && (
          <Section title="Tes habitudes">
            {advanced.topGenres.length > 0 && (
              <View style={styles.habitRow}>
                <Text style={styles.habitLabel}>Genres dominants</Text>
                <View style={styles.habitGenres}>
                  {advanced.topGenres.map((g) => (
                    <View key={g.name} style={styles.habitGenreChip}>
                      <Text style={styles.habitGenreText}>{g.name}</Text>
                      <Text style={styles.habitGenreCount}>{g.count}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {advanced.favoriteDecade && (
              <View style={styles.habitRow}>
                <Text style={styles.habitLabel}>Décennie favorite</Text>
                <Text style={styles.habitValue}>
                  {advanced.favoriteDecade.decade}s · {advanced.favoriteDecade.count} films
                </Text>
              </View>
            )}
            {advanced.recurrentDirector && (
              <View style={styles.habitRow}>
                <Text style={styles.habitLabel}>Réalisateur récurrent</Text>
                <Text style={styles.habitValue}>
                  {advanced.recurrentDirector.name} · {advanced.recurrentDirector.count} films
                </Text>
              </View>
            )}
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

      <AboutModal visible={showAbout} onClose={onCloseAbout} />
    </SafeAreaView>
  );
}

function AboutModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const openTmdb = useCallback(() => {
    Linking.openURL(TMDB_URL).catch(() => {});
  }, []);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.aboutBackdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
        />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.duration(280)}
        exiting={SlideOutDown.duration(200)}
        style={styles.aboutSheet}
        accessibilityViewIsModal
      >
        <SafeAreaView edges={['bottom']}>
          <View style={styles.aboutHandle} />
          <View style={styles.aboutBody}>
            <Text style={styles.aboutTitle}>Clap'</Text>
            <Text style={styles.aboutVersion}>Version {APP_VERSION}</Text>
            <Text style={styles.aboutTagline}>Le tri des films, à coups de ticket.</Text>
            <Text style={styles.aboutDesc}>Projet React Native ECV - 2026.</Text>
            <View style={styles.aboutDivider} />
            <Text style={styles.aboutAttrLabel}>Données fournies par</Text>
            <Pressable
              onPress={openTmdb}
              style={styles.aboutLinkBtn}
              accessibilityRole="link"
              accessibilityLabel="Ouvrir le site TMDB"
            >
              <Text style={styles.aboutLinkText}>The Movie Database</Text>
              <ExternalLink size={16} color={colors.gold} strokeWidth={1.8} />
            </Pressable>
            <Text style={styles.aboutAttrFinePrint}>
              Cette application utilise l'API TMDB sans en être endossée ni certifiée par TMDB.
            </Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
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
      accessibilityRole="button"
      accessibilityLabel={label}
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
  scroll: { padding: spacing.lg, paddingBottom: SCROLL_BOTTOM_PAD, gap: spacing.s },
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
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.s,
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  habitLabel: { fontFamily: fonts.sansMed, color: colors.ink2, fontSize: 13 },
  habitValue: { fontFamily: fonts.serifBold, color: colors.ink, fontSize: 14 },
  habitGenres: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  habitGenreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.line2,
  },
  habitGenreText: { fontFamily: fonts.sansMed, color: colors.ink, fontSize: 12 },
  habitGenreCount: { fontFamily: fonts.mono, color: colors.gold, fontSize: 11 },
  aboutBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,9,8,0.55)' },
  aboutSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '85%',
    backgroundColor: colors.bg2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    borderTopWidth: 1,
    borderColor: colors.line2,
  },
  aboutHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line2,
    marginTop: 10,
    marginBottom: 6,
  },
  aboutBody: { padding: spacing.lg, gap: spacing.s, alignItems: 'center' },
  aboutTitle: { fontFamily: fonts.serifItalic, fontSize: 56, color: colors.gold },
  aboutVersion: { fontFamily: fonts.mono, fontSize: 12, color: colors.ink3, letterSpacing: 1 },
  aboutTagline: { fontFamily: fonts.serif, fontSize: 16, color: colors.ink, textAlign: 'center', marginTop: spacing.s },
  aboutDesc: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink2, textAlign: 'center' },
  aboutDivider: {
    width: 40,
    height: 1,
    backgroundColor: colors.line2,
    marginVertical: spacing.md,
  },
  aboutAttrLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.ink3,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  aboutLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.m,
    marginTop: spacing.xs,
  },
  aboutLinkText: { fontFamily: fonts.sansMed, color: colors.gold, fontSize: 14 },
  aboutAttrFinePrint: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.ink3,
    textAlign: 'center',
    marginTop: spacing.s,
    paddingHorizontal: spacing.md,
    lineHeight: 16,
  },
});
