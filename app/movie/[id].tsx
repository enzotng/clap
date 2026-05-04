import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, TextInput, Dimensions, Share, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, interpolate, Extrapolation } from 'react-native-reanimated';
import { useLocalSearchParams, router, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Share2 } from 'lucide-react-native';
import { useTmdbMovie } from '@/hooks/useTmdbMovie';
import { useLibraryActions, useMovieStatus, useMovieRating, useMovieNote } from '@/context/LibraryContext';
import { posterUrl } from '@/lib/tmdb';
import { MoviePoster } from '@/components/MoviePoster';
import { StatusButton } from '@/components/StatusButton';
import { GenreChip } from '@/components/GenreChip';
import { RatingStars } from '@/components/RatingStars';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyState } from '@/components/EmptyState';
import { MovieDetailSkeleton } from '@/components/MovieDetailSkeleton';
import { colors, fonts, radius, spacing, type Status } from '@/theme/tokens';
import type { TmdbCast, TmdbMovie, TmdbMovieDetail } from '@/lib/tmdb';

const SCREEN_W = Dimensions.get('window').width;
const HERO_H = 280;
const HEAD_OVERLAP = 60;
const HEAD_PADDING_TOP = 30;
const SCROLL_TAIL = 40;
const NOTE_DEBOUNCE_MS = 400;

const STATUSES: { key: Status; label: string }[] = [
  { key: 'watch', label: 'À voir' },
  { key: 'fav', label: 'Favori' },
  { key: 'seen', label: 'Vu' },
  { key: 'pass', label: 'Pas intéressé' },
];

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const movieId = Number(id);
  const validId = Number.isFinite(movieId) && movieId > 0 ? movieId : undefined;
  const { data, loading, error } = useTmdbMovie(validId);

  if (loading) {
    return <MovieDetailSkeleton />;
  }
  if (!validId || error || !data) {
    return <EmptyState title="Film introuvable" subtitle={error ?? 'Film inaccessible pour le moment'} />;
  }

  return <DetailContent movie={data} movieId={validId} />;
}

function DetailContent({ movie, movieId }: { movie: TmdbMovieDetail; movieId: number }) {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [0, HERO_H], [0, -HERO_H * 0.5], Extrapolation.CLAMP) },
    ],
    opacity: interpolate(scrollY.value, [0, HERO_H * 0.7], [1, 0.3], Extrapolation.CLAMP),
  }));

  const derived = useMemo(() => {
    const backdrop = posterUrl(movie.backdrop_path, 'w780');
    const year = movie.release_date?.slice(0, 4) ?? '';
    const director = movie.credits?.crew?.find((c) => c.job === 'Director');
    const cast = movie.credits?.cast?.slice(0, 12) ?? [];
    const similar = movie.similar?.results?.slice(0, 10) ?? [];
    const meta = [director?.name, year, movie.runtime ? `${movie.runtime} min` : null]
      .filter(Boolean)
      .join(' · ');
    return { backdrop, cast, similar, meta };
  }, [movie]);

  const renderCast = useCallback(
    ({ item }: { item: TmdbCast }) => <CastCard cast={item} />,
    [],
  );
  const renderSimilar = useCallback(({ item }: { item: TmdbMovie }) => <SimilarCard movie={item} />, []);

  const topInset = Math.max(insets.top, spacing.md);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <Animated.View style={[styles.hero, heroStyle]}>
        {derived.backdrop && (
          <Image source={{ uri: derived.backdrop }} style={styles.heroImg} contentFit="cover" />
        )}
        <View style={styles.heroOverlay} />
      </Animated.View>

      <Pressable
        onPress={() => router.back()}
        style={[styles.back, { top: topInset }]}
        hitSlop={12}
        accessibilityLabel="Retour"
        accessibilityRole="button"
        accessibilityHint="Ferme la fiche du film"
      >
        <ChevronLeft color={colors.ink} size={22} strokeWidth={1.8} />
      </Pressable>
      <Pressable
        onPress={() => onShare(movie)}
        style={[styles.shareBtn, { top: topInset }]}
        hitSlop={12}
        accessibilityLabel="Partager le film"
        accessibilityRole="button"
      >
        <Share2 color={colors.ink} size={20} strokeWidth={1.8} />
      </Pressable>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={{ height: HERO_H - HEAD_OVERLAP }} />

        <View style={styles.headRow}>
          <MoviePoster path={movie.poster_path} size="w500" width={120} title={movie.title} />
          <View style={styles.headCol}>
            <Text style={styles.title}>{movie.title}</Text>
            <Text style={styles.meta}>{derived.meta}</Text>
            <View style={styles.genres}>
              {movie.genres?.slice(0, 3).map((g) => <GenreChip key={g.id} label={g.name} />)}
            </View>
          </View>
        </View>

        <SectionHeader>Statut</SectionHeader>
        <StatusToggles movieId={movieId} />

        <SectionHeader>Ma note</SectionHeader>
        <RatingControl movieId={movieId} />

        <SectionHeader>Mes notes</SectionHeader>
        <NotesEditor movieId={movieId} />

        <SectionHeader>Synopsis</SectionHeader>
        <Text style={styles.overview}>{movie.overview || 'Pas de synopsis disponible.'}</Text>

        {derived.cast.length > 0 && (
          <>
            <SectionHeader>Casting</SectionHeader>
            <FlatList
              data={derived.cast}
              horizontal
              keyExtractor={castKey}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.castRow}
              renderItem={renderCast}
              initialNumToRender={6}
            />
          </>
        )}

        {derived.similar.length > 0 && (
          <>
            <SectionHeader>Aussi à découvrir</SectionHeader>
            <FlatList
              data={derived.similar}
              horizontal
              keyExtractor={movieKey}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.simRow}
              renderItem={renderSimilar}
              initialNumToRender={5}
            />
          </>
        )}

        <View style={{ height: SCROLL_TAIL + insets.bottom }} />
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

async function onShare(movie: TmdbMovieDetail) {
  const year = movie.release_date?.slice(0, 4) ?? '';
  const url = `https://www.themoviedb.org/movie/${movie.id}`;
  const message = year ? `${movie.title} (${year}) - ${url}` : `${movie.title} - ${url}`;
  try {
    await Share.share({ message, url, title: movie.title });
  } catch {
    // user cancel or error: silent
  }
}

function castKey(item: TmdbCast) {
  return String(item.id);
}

function movieKey(item: TmdbMovie) {
  return String(item.id);
}

function StatusTogglesImpl({ movieId }: { movieId: number }) {
  const { setStatus } = useLibraryActions();
  const current = useMovieStatus(movieId);

  const handlers = useMemo(
    () => ({
      watch: () => setStatus(movieId, 'watch'),
      fav: () => setStatus(movieId, 'fav'),
      seen: () => setStatus(movieId, 'seen'),
      pass: () => setStatus(movieId, 'pass'),
    }),
    [movieId, setStatus],
  );

  return (
    <View style={styles.statusRow}>
      {STATUSES.map((s) => (
        <StatusButton
          key={s.key}
          status={s.key}
          label={s.label}
          active={current === s.key}
          onPress={handlers[s.key]}
        />
      ))}
    </View>
  );
}
const StatusToggles = memo(StatusTogglesImpl);

function RatingControlImpl({ movieId }: { movieId: number }) {
  const { setRating } = useLibraryActions();
  const value = useMovieRating(movieId) ?? 0;
  const onChange = useCallback((r: number) => setRating(movieId, r), [movieId, setRating]);
  return (
    <View style={styles.starsRow}>
      <RatingStars value={value} onChange={onChange} interactive size={28} />
    </View>
  );
}
const RatingControl = memo(RatingControlImpl);

function NotesEditorImpl({ movieId }: { movieId: number }) {
  const { setNote } = useLibraryActions();
  const initial = useMovieNote(movieId) ?? '';
  const [draft, setDraft] = useState(initial);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const movieIdRef = useRef(movieId);
  movieIdRef.current = movieId;
  const setNoteRef = useRef(setNote);
  setNoteRef.current = setNote;
  const lastSavedRef = useRef(initial);

  useEffect(() => {
    if (draft === lastSavedRef.current) return;
    const t = setTimeout(() => {
      setNoteRef.current(movieIdRef.current, draftRef.current);
      lastSavedRef.current = draftRef.current;
    }, NOTE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [draft]);

  useEffect(() => {
    return () => {
      if (draftRef.current === lastSavedRef.current) return;
      setNoteRef.current(movieIdRef.current, draftRef.current);
    };
  }, []);

  return (
    <TextInput
      style={styles.notesInput}
      placeholder="Ce que tu en as pensé…"
      placeholderTextColor={colors.ink3}
      value={draft}
      onChangeText={setDraft}
      multiline
      textAlignVertical="top"
      maxLength={1000}
      accessibilityLabel="Mes notes sur le film"
    />
  );
}
const NotesEditor = memo(NotesEditorImpl);

function CastCardImpl({ cast }: { cast: TmdbCast }) {
  const profile = posterUrl(cast.profile_path, 'w185');
  return (
    <Link
      href={{ pathname: '/person/[id]', params: { id: String(cast.id) } }}
      asChild
    >
      <Pressable style={styles.castCard} accessibilityRole="button" accessibilityLabel={`${cast.name}, ${cast.character}`}>
        {profile ? (
          <Image source={{ uri: profile }} style={styles.castImg} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.castImg, styles.castFallback]} />
        )}
        <Text style={styles.castName} numberOfLines={1}>{cast.name}</Text>
        <Text style={styles.castRole} numberOfLines={1}>{cast.character}</Text>
      </Pressable>
    </Link>
  );
}
const CastCard = memo(CastCardImpl);

function SimilarCardImpl({ movie }: { movie: TmdbMovie }) {
  const goTo = useCallback(() => {
    router.push({ pathname: '/movie/[id]', params: { id: String(movie.id) } });
  }, [movie.id]);
  return (
    <Pressable style={styles.simCard} onPress={goTo} accessibilityRole="button" accessibilityLabel={movie.title}>
      <MoviePoster path={movie.poster_path} size="w500" width={100} title={movie.title} />
      <Text style={styles.simTitle} numberOfLines={2}>{movie.title}</Text>
    </Pressable>
  );
}
const SimilarCard = memo(SimilarCardImpl);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  loading: { color: colors.ink2, fontFamily: fonts.sans },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: HERO_H, backgroundColor: colors.bg2 },
  heroImg: { width: SCREEN_W, height: HERO_H },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,9,8,0.5)' },
  back: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10,9,8,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10,9,8,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: spacing.md },
  headRow: { flexDirection: 'row', gap: spacing.md, marginTop: -40 },
  headCol: { flex: 1, gap: spacing.s, paddingTop: HEAD_PADDING_TOP },
  title: { fontFamily: fonts.serifBold, fontSize: 26, color: colors.ink },
  meta: { fontFamily: fonts.sansMed, fontSize: 12, color: colors.ink2, letterSpacing: 0.3 },
  genres: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s },
  starsRow: { paddingVertical: spacing.s },
  notesInput: {
    minHeight: 80,
    backgroundColor: colors.bg2,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    fontFamily: fonts.sans,
    color: colors.ink,
    fontSize: 14,
  },
  overview: { fontFamily: fonts.sans, color: colors.ink2, fontSize: 15, lineHeight: 24 },
  castRow: { gap: spacing.md, paddingVertical: spacing.s },
  castCard: { width: 80, gap: 6, alignItems: 'center' },
  castImg: { width: 80, height: 80, borderRadius: 40 },
  castFallback: { backgroundColor: colors.bg3 },
  castName: { fontFamily: fonts.sansMed, color: colors.ink, fontSize: 12, textAlign: 'center' },
  castRole: { fontFamily: fonts.sans, color: colors.ink3, fontSize: 11, textAlign: 'center', fontStyle: 'italic' },
  simRow: { gap: spacing.md, paddingVertical: spacing.s },
  simCard: { width: 100, gap: 6 },
  simTitle: { fontFamily: fonts.sansMed, color: colors.ink2, fontSize: 12 },
});
