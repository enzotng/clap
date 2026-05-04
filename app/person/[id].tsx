import { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTmdbPerson } from '@/hooks/useTmdbPerson';
import { MoviePoster } from '@/components/MoviePoster';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { posterUrl, type TmdbMovie } from '@/lib/tmdb';
import { formatDateFr } from '@/lib/format';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

const SCREEN_W = Dimensions.get('window').width;
const COLUMNS = 3;
const GRID_PADDING = spacing.md;
const GRID_GAP = spacing.md;
const ITEM_W = (SCREEN_W - GRID_PADDING * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const personId = Number(id);
  const validId = Number.isFinite(personId) && personId > 0 ? personId : undefined;
  const { data, loading, error } = useTmdbPerson(validId);

  const films = useMemo(() => data?.movie_credits?.cast?.slice(0, 60) ?? [], [data]);

  const renderItem = useCallback(
    ({ item }: { item: TmdbMovie }) => <FilmCard movie={item} />,
    [],
  );
  const keyExtractor = useCallback((item: TmdbMovie) => String(item.id), []);

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Header title="Chargement…" />
        <View style={styles.headerBlock}>
          <Skeleton width={140} height={140} borderRadius={70} />
          <Skeleton width={180} height={24} />
          <Skeleton width={120} height={13} />
        </View>
      </SafeAreaView>
    );
  }
  if (!validId || error || !data) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Header title="Erreur" />
        <EmptyState title="Personne introuvable" subtitle={error ?? 'Identifiant invalide'} />
      </SafeAreaView>
    );
  }

  const profile = posterUrl(data.profile_path, 'w500');
  const birthday = formatDateFr(data.birthday);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Header title={data.name} />
      <FlatList
        data={films}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        numColumns={COLUMNS}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.gridRow}
        initialNumToRender={9}
        maxToRenderPerBatch={9}
        windowSize={7}
        removeClippedSubviews
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            {profile ? (
              <Image source={{ uri: profile }} style={styles.profile} contentFit="cover" />
            ) : (
              <View style={[styles.profile, styles.profileFallback]} />
            )}
            <Text style={styles.name}>{data.name}</Text>
            <Text style={styles.role}>{data.known_for_department}</Text>
            {birthday && <Text style={styles.meta}>Né(e) le {birthday}</Text>}
            {data.biography ? (
              <Text style={styles.bio} numberOfLines={6}>{data.biography}</Text>
            ) : null}
            <Text style={styles.section}>Filmographie</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState title="Aucun film" subtitle="Pas de filmographie référencée" />}
      />
    </SafeAreaView>
  );
}

function Header({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Retour" accessibilityRole="button">
        <ChevronLeft color={colors.ink} size={22} strokeWidth={1.8} />
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
    </View>
  );
}

function FilmCard({ movie }: { movie: TmdbMovie }) {
  const onPress = useCallback(() => {
    router.push({ pathname: '/movie/[id]', params: { id: String(movie.id) } });
  }, [movie.id]);
  return (
    <Pressable
      style={styles.gridItem}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={movie.title}
    >
      <MoviePoster path={movie.poster_path} size="w185" width={ITEM_W} title={movie.title} />
      <Text style={styles.filmTitle} numberOfLines={2}>{movie.title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  headerTitle: { fontFamily: fonts.serifBold, color: colors.ink, fontSize: 18, flex: 1 },
  gridContainer: { paddingHorizontal: GRID_PADDING, paddingBottom: spacing.xl },
  gridRow: { gap: GRID_GAP, marginBottom: GRID_GAP },
  headerBlock: { alignItems: 'center', gap: spacing.s, paddingVertical: spacing.lg },
  profile: { width: 140, height: 140, borderRadius: 70, marginBottom: spacing.s, backgroundColor: colors.bg3 },
  profileFallback: { backgroundColor: colors.bg3 },
  name: { fontFamily: fonts.serifBold, color: colors.ink, fontSize: 22, textAlign: 'center' },
  role: { fontFamily: fonts.mono, color: colors.gold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  meta: { fontFamily: fonts.sans, color: colors.ink3, fontSize: 12 },
  bio: {
    fontFamily: fonts.sans,
    color: colors.ink2,
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    textAlign: 'center',
    marginTop: spacing.s,
  },
  section: {
    fontFamily: fonts.mono,
    color: colors.ink3,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginTop: spacing.lg,
    marginBottom: spacing.s,
  },
  gridItem: { width: ITEM_W, gap: 4 },
  filmTitle: { fontFamily: fonts.sans, color: colors.ink2, fontSize: 11, textAlign: 'center' },
});
