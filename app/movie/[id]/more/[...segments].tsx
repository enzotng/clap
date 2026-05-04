import { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useTmdbMovie } from '@/hooks/useTmdbMovie';
import { MoviePoster } from '@/components/MoviePoster';
import { EmptyState } from '@/components/EmptyState';
import type { TmdbMovie } from '@/lib/tmdb';
import { colors, fonts, spacing } from '@/theme/tokens';

const SCREEN_W = Dimensions.get('window').width;
const COLUMNS = 3;
const GRID_PADDING = spacing.md;
const GRID_GAP = spacing.md;
const ITEM_W = (SCREEN_W - GRID_PADDING * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

export default function MovieMoreScreen() {
  const { id, segments } = useLocalSearchParams<{ id: string; segments: string[] }>();
  const segs = Array.isArray(segments) ? segments : [];

  if (segs[0] === 'similar') {
    const movieId = Number(id);
    return <SimilarView movieId={Number.isFinite(movieId) ? movieId : undefined} />;
  }
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Header title="Inconnu" />
      <EmptyState title="Sous-écran inconnu" subtitle="Cette section n'existe pas." />
    </SafeAreaView>
  );
}

function Header({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Retour" accessibilityRole="button">
        <ChevronLeft color={colors.ink} size={22} strokeWidth={1.8} />
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
    </View>
  );
}

function SimilarView({ movieId }: { movieId: number | undefined }) {
  const { data, loading, error } = useTmdbMovie(movieId);

  const renderItem = useCallback(
    ({ item }: { item: TmdbMovie }) => <FilmCard movie={item} />,
    [],
  );
  const keyExtractor = useCallback((item: TmdbMovie) => String(item.id), []);

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Header title="Chargement…" />
      </SafeAreaView>
    );
  }
  if (!movieId || error || !data) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Header title="Erreur" />
        <EmptyState title="Film introuvable" subtitle={error ?? 'Identifiant invalide'} />
      </SafeAreaView>
    );
  }

  const films = data.similar?.results ?? [];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Header title={`Similaires · ${data.title}`} />
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
      />
    </SafeAreaView>
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
  gridItem: { width: ITEM_W, gap: 4 },
  filmTitle: { fontFamily: fonts.sans, color: colors.ink2, fontSize: 11, textAlign: 'center' },
});
