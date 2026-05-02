import { useCallback, useMemo, useState } from 'react';
import { View, TextInput, FlatList, StyleSheet, ActivityIndicator, Text, ScrollView, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Search as SearchIcon, X, SlidersHorizontal } from 'lucide-react-native';
import { router } from 'expo-router';
import { useLibrary } from '@/context/LibraryContext';
import { useTmdbSearch } from '@/hooks/useTmdbSearch';
import { useTmdbPopular } from '@/hooks/useTmdbPopular';
import { MovieRow } from '@/components/MovieRow';
import { MoviePoster } from '@/components/MoviePoster';
import { EmptyState } from '@/components/EmptyState';
import { GENRES } from '@/lib/genres';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import type { TmdbMovie, DiscoverSort } from '@/lib/tmdb';

const DECADES: { id: string; label: string; from: number; to: number }[] = [
  { id: '70s', label: '70s', from: 1970, to: 1979 },
  { id: '80s', label: '80s', from: 1980, to: 1989 },
  { id: '90s', label: '90s', from: 1990, to: 1999 },
  { id: '2000s', label: '2000s', from: 2000, to: 2009 },
  { id: '2010s', label: '2010s', from: 2010, to: 2019 },
  { id: '2020+', label: '2020+', from: 2020, to: 2030 },
];

const RATINGS = [
  { id: 7, label: '★ 7+' },
  { id: 8, label: '★ 8+' },
];

const SORTS: { id: DiscoverSort; label: string }[] = [
  { id: 'popularity.desc', label: 'Populaire' },
  { id: 'vote_average.desc', label: 'Mieux notés' },
  { id: 'primary_release_date.desc', label: 'Plus récents' },
];

export default function SearchScreen() {
  const { state, setPrefs } = useLibrary();
  const [query, setQuery] = useState('');
  const [genreId, setGenreId] = useState<number | null>(null);
  const [decadeId, setDecadeId] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<DiscoverSort>('popularity.desc');
  const [showFilters, setShowFilters] = useState(false);

  const recentQueries = state.prefs.recentQueries;

  const onSubmitQuery = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    const next = [q, ...recentQueries.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 5);
    setPrefs({ recentQueries: next });
  }, [query, recentQueries, setPrefs]);

  const trimmedQuery = query.trim();
  const inSearchMode = trimmedQuery.length > 0;
  const hasFilters = genreId !== null || decadeId !== null || minRating !== null || sortBy !== 'popularity.desc';

  const decade = useMemo(() => DECADES.find((d) => d.id === decadeId), [decadeId]);

  const popularFilters = useMemo(
    () => ({
      genreId: genreId ?? undefined,
      yearFrom: decade?.from,
      yearTo: decade?.to,
      minRating: minRating ?? undefined,
      sortBy,
    }),
    [genreId, decade, minRating, sortBy],
  );

  const { results: searchResults, loading: searchLoading, error: searchError, loadMore, hasMore } = useTmdbSearch(query);
  const { results: discoverResults, loading: discoverLoading, error: discoverError } = useTmdbPopular(popularFilters);

  const onChangeQuery = useCallback((q: string) => {
    setQuery(q);
  }, []);

  const onResetFilters = useCallback(() => {
    setGenreId(null);
    setDecadeId(null);
    setMinRating(null);
    setSortBy('popularity.desc');
  }, []);

  const renderResultItem = useCallback(({ item }: { item: TmdbMovie }) => <MovieRow movie={item} />, []);
  const keyExtractor = useCallback((item: TmdbMovie) => String(item.id), []);

  if (inSearchMode) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <SearchBar
          value={query}
          onChange={onChangeQuery}
          onSubmit={onSubmitQuery}
          hasFilters={false}
          showFilters={false}
          onToggleFilters={() => {}}
        />
        {searchError ? (
          <EmptyState title="Erreur" subtitle={searchError} />
        ) : searchResults.length === 0 && !searchLoading ? (
          <EmptyState title="Aucun résultat" subtitle={`Rien trouvé pour "${trimmedQuery}"`} />
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={keyExtractor}
            renderItem={renderResultItem}
            ItemSeparatorComponent={Separator}
            contentContainerStyle={styles.list}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={hasMore && searchLoading ? <ActivityIndicator color={colors.gold} style={styles.spinner} /> : null}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </SafeAreaView>
    );
  }

  const sectionTitle = buildSectionTitle({ genreId, decadeId, minRating, sortBy });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <SearchBar
        value={query}
        onChange={onChangeQuery}
        onSubmit={onSubmitQuery}
        hasFilters={hasFilters}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((v) => !v)}
      />
      {recentQueries.length > 0 && (
        <View style={styles.recentRow}>
          <Text style={styles.recentLabel}>Récentes</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentChips}>
            {recentQueries.map((q) => (
              <Pressable key={q} onPress={() => setQuery(q)} style={styles.recentChip}>
                <Text style={styles.recentChipText}>{q}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      <FiltersDropdown
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        genreId={genreId}
        decadeId={decadeId}
        minRating={minRating}
        sortBy={sortBy}
        setGenreId={setGenreId}
        setDecadeId={setDecadeId}
        setMinRating={setMinRating}
        setSortBy={setSortBy}
        onReset={onResetFilters}
        hasFilters={hasFilters}
      />
      <ScrollView contentContainerStyle={styles.idleScroll} keyboardShouldPersistTaps="handled">
        <View style={styles.resultHeader}>
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>
          {hasFilters && (
            <Pressable onPress={onResetFilters} hitSlop={8}>
              <Text style={styles.resetLink}>Réinitialiser</Text>
            </Pressable>
          )}
        </View>
        {discoverError ? (
          <Text style={styles.error}>{discoverError}</Text>
        ) : discoverLoading ? (
          <ActivityIndicator color={colors.gold} style={styles.spinner} />
        ) : discoverResults.length === 0 ? (
          <EmptyState title="Aucun film" subtitle="Essaie d'ajuster les filtres" />
        ) : (
          <View style={styles.posterGrid}>
            {discoverResults.slice(0, 18).map((m) => (
              <PosterCard key={m.id} movie={m} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function buildSectionTitle(filters: { genreId: number | null; decadeId: string | null; minRating: number | null; sortBy: DiscoverSort }): string {
  if (filters.genreId === null && filters.decadeId === null && filters.minRating === null && filters.sortBy === 'popularity.desc') {
    return 'Populaires cette semaine';
  }
  const bits: string[] = [];
  if (filters.genreId !== null) {
    const g = GENRES.find((x) => x.id === filters.genreId);
    if (g) bits.push(g.label);
  }
  if (filters.decadeId) bits.push(filters.decadeId);
  if (filters.minRating) bits.push(`★ ${filters.minRating}+`);
  if (filters.sortBy === 'vote_average.desc') bits.push('mieux notés');
  if (filters.sortBy === 'primary_release_date.desc') bits.push('récents');
  return bits.length > 0 ? bits.join(' · ') : 'Populaires cette semaine';
}

function SearchBar({
  value,
  onChange,
  onSubmit,
  hasFilters,
  showFilters,
  onToggleFilters,
}: {
  value: string;
  onChange: (s: string) => void;
  onSubmit: () => void;
  hasFilters: boolean;
  showFilters: boolean;
  onToggleFilters: () => void;
}) {
  return (
    <View style={styles.searchBox}>
      <SearchIcon size={18} color={colors.ink3} strokeWidth={1.8} style={styles.searchIcon} />
      <TextInput
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder="Rechercher un film..."
        placeholderTextColor={colors.ink3}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChange('')} hitSlop={10} style={styles.iconBtn}>
          <X size={18} color={colors.ink3} strokeWidth={1.8} />
        </Pressable>
      ) : (
        <Pressable onPress={onToggleFilters} hitSlop={10} style={styles.iconBtn}>
          <SlidersHorizontal
            size={18}
            color={showFilters ? colors.gold : colors.ink3}
            strokeWidth={1.8}
          />
          {hasFilters && !showFilters && <View style={styles.filterBadge} />}
        </Pressable>
      )}
    </View>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {children}
      </ScrollView>
    </View>
  );
}

function FiltersDropdown({
  visible,
  onClose,
  genreId,
  decadeId,
  minRating,
  sortBy,
  setGenreId,
  setDecadeId,
  setMinRating,
  setSortBy,
  onReset,
  hasFilters,
}: {
  visible: boolean;
  onClose: () => void;
  genreId: number | null;
  decadeId: string | null;
  minRating: number | null;
  sortBy: DiscoverSort;
  setGenreId: (id: number | null) => void;
  setDecadeId: (id: string | null) => void;
  setMinRating: (id: number | null) => void;
  setSortBy: (s: DiscoverSort) => void;
  onReset: () => void;
  hasFilters: boolean;
}) {
  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.sheetBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.duration(280)}
        exiting={SlideOutDown.duration(200)}
        style={styles.sheet}
      >
        <SafeAreaView edges={['bottom']}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filtres</Text>
            {hasFilters && (
              <Pressable onPress={onReset} hitSlop={8}>
                <Text style={styles.resetLink}>Réinitialiser</Text>
              </Pressable>
            )}
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>
            <FilterGroup label="Genre">
              <FilterChip label="Tous" active={genreId === null} onPress={() => setGenreId(null)} />
              {GENRES.map((g) => (
                <FilterChip
                  key={g.id}
                  label={g.label}
                  active={genreId === g.id}
                  onPress={() => setGenreId(genreId === g.id ? null : g.id)}
                />
              ))}
            </FilterGroup>

            <FilterGroup label="Décennie">
              <FilterChip label="Toutes" active={decadeId === null} onPress={() => setDecadeId(null)} />
              {DECADES.map((d) => (
                <FilterChip
                  key={d.id}
                  label={d.label}
                  active={decadeId === d.id}
                  onPress={() => setDecadeId(decadeId === d.id ? null : d.id)}
                />
              ))}
            </FilterGroup>

            <FilterGroup label="Note">
              <FilterChip label="Toutes" active={minRating === null} onPress={() => setMinRating(null)} />
              {RATINGS.map((r) => (
                <FilterChip
                  key={r.id}
                  label={r.label}
                  active={minRating === r.id}
                  onPress={() => setMinRating(minRating === r.id ? null : r.id)}
                />
              ))}
            </FilterGroup>

            <FilterGroup label="Tri">
              {SORTS.map((s) => (
                <FilterChip key={s.id} label={s.label} active={sortBy === s.id} onPress={() => setSortBy(s.id)} />
              ))}
            </FilterGroup>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function PosterCard({ movie }: { movie: TmdbMovie }) {
  const onPress = useCallback(() => {
    router.push({ pathname: '/movie/[id]', params: { id: String(movie.id) } });
  }, [movie.id]);
  return (
    <Pressable onPress={onPress} style={styles.posterCard}>
      <MoviePoster path={movie.poster_path} size="w500" width={POSTER_W} title={movie.title} />
      <Text style={styles.posterTitle} numberOfLines={2}>{movie.title}</Text>
    </Pressable>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const POSTER_W = 100;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.m,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
  },
  searchIcon: { marginRight: spacing.s },
  input: {
    flex: 1,
    paddingVertical: spacing.s + 2,
    fontFamily: fonts.sans,
    color: colors.ink,
    fontSize: 15,
  },
  iconBtn: { padding: spacing.xs, marginLeft: spacing.xs, position: 'relative' },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  list: { paddingHorizontal: spacing.md, paddingTop: 0, paddingBottom: 110 },
  separator: { height: spacing.s },
  spinner: { paddingVertical: spacing.lg },
  idleScroll: { paddingBottom: 110 },
  filterGroup: { marginTop: spacing.m },
  filterLabel: {
    fontFamily: fonts.mono,
    color: colors.ink3,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.md,
    marginBottom: 6,
  },
  filterRow: { gap: spacing.s, paddingHorizontal: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line2,
    backgroundColor: colors.bg2,
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipText: { fontFamily: fonts.sansMed, color: colors.ink2, fontSize: 12 },
  chipTextActive: { color: colors.bg },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.s,
  },
  sectionTitle: {
    fontFamily: fonts.mono,
    color: colors.ink3,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    flex: 1,
  },
  resetLink: { fontFamily: fonts.sansMed, color: colors.gold, fontSize: 12, letterSpacing: 0.4 },
  posterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingHorizontal: spacing.md, justifyContent: 'space-between' },
  posterCard: { width: POSTER_W, gap: 6 },
  posterTitle: { fontFamily: fonts.sansMed, color: colors.ink2, fontSize: 11, textAlign: 'center' },
  error: { fontFamily: fonts.sans, color: colors.pass, padding: spacing.md, textAlign: 'center' },
  recentRow: { paddingHorizontal: spacing.md, paddingTop: spacing.xs, gap: spacing.xs },
  recentLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.ink3,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  recentChips: { gap: spacing.s, paddingVertical: spacing.xs, paddingRight: spacing.md },
  recentChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 999,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  recentChipText: { fontFamily: fonts.sansMed, color: colors.ink2, fontSize: 12 },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,9,8,0.55)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    borderTopWidth: 1,
    borderColor: colors.line2,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line2,
    marginTop: 10,
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.s,
    paddingBottom: spacing.s,
  },
  sheetTitle: { fontFamily: fonts.serifBold, fontSize: 22, color: colors.ink },
  sheetScroll: { paddingBottom: spacing.lg },
});
