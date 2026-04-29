import { useState, useCallback } from 'react';
import { View, TextInput, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, X } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { useTmdbSearch } from '@/hooks/useTmdbSearch';
import { MovieRow } from '@/components/MovieRow';
import { EmptyState } from '@/components/EmptyState';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import type { TmdbMovie } from '@/lib/tmdb';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const { results, loading, error, loadMore, hasMore } = useTmdbSearch(query);

  const renderItem = useCallback(({ item }: { item: TmdbMovie }) => <MovieRow movie={item} />, []);
  const keyExtractor = useCallback((item: TmdbMovie) => String(item.id), []);

  const showEmpty = !error && results.length === 0 && !loading && query.trim() !== '';
  const showInitial = !error && query.trim() === '';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.searchBox}>
        <SearchIcon size={18} color={colors.ink3} strokeWidth={1.8} style={styles.searchIcon} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher un film, un réalisateur, un genre…"
          placeholderTextColor={colors.ink3}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={10} style={styles.clear}>
            <X size={18} color={colors.ink3} strokeWidth={1.8} />
          </Pressable>
        )}
      </View>
      {error ? (
        <EmptyState title="Erreur" subtitle={error} />
      ) : showInitial ? (
        <EmptyState title="Tape un titre" subtitle="Découvre un film par son nom, son réalisateur ou son genre." />
      ) : showEmpty ? (
        <EmptyState title="Aucun résultat" subtitle={`Rien trouvé pour "${query}"`} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={hasMore && loading ? <ActivityIndicator color={colors.gold} style={styles.spinner} /> : null}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

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
  clear: { padding: spacing.xs, marginLeft: spacing.xs },
  list: { paddingHorizontal: spacing.md, paddingTop: 0, paddingBottom: spacing.lg },
  separator: { height: spacing.s },
  spinner: { paddingVertical: spacing.lg },
});
