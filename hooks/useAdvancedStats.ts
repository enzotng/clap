import { useMemo } from 'react';
import { useLibraryState } from '@/context/LibraryContext';
import { useMoviesById } from '@/hooks/useMoviesById';
import type { TmdbMovieDetail } from '@/lib/tmdb';

export type AdvancedStats = {
  topGenres: { name: string; count: number }[];
  favoriteDecade: { decade: number; count: number } | null;
  recurrentDirector: { name: string; count: number } | null;
};

export function useAdvancedStats(): { stats: AdvancedStats | null; loading: boolean } {
  const { state } = useLibraryState();

  const qualifiedIds = useMemo(
    () =>
      Object.entries(state.byId)
        .filter(([, d]) => d.status === 'fav' || d.status === 'seen')
        .map(([id]) => Number(id)),
    [state.byId],
  );

  const moviesById = useMoviesById(qualifiedIds);
  const fetchedCount = qualifiedIds.filter((id) => moviesById[id]).length;
  const loading = qualifiedIds.length > 0 && fetchedCount < qualifiedIds.length;

  const stats = useMemo<AdvancedStats | null>(() => {
    if (qualifiedIds.length === 0) return null;
    const movies = qualifiedIds.map((id) => moviesById[id]).filter((m): m is TmdbMovieDetail => Boolean(m));
    if (movies.length === 0) return null;

    const genreCounts = new Map<string, number>();
    const decadeCounts = new Map<number, number>();
    const directorCounts = new Map<string, number>();

    for (const m of movies) {
      for (const g of m.genres ?? []) {
        genreCounts.set(g.name, (genreCounts.get(g.name) ?? 0) + 1);
      }
      const year = m.release_date ? Number(m.release_date.slice(0, 4)) : NaN;
      if (Number.isFinite(year)) {
        const decade = Math.floor(year / 10) * 10;
        decadeCounts.set(decade, (decadeCounts.get(decade) ?? 0) + 1);
      }
      const directors = (m.credits?.crew ?? []).filter((c) => c.job === 'Director');
      for (const d of directors) {
        directorCounts.set(d.name, (directorCounts.get(d.name) ?? 0) + 1);
      }
    }

    const topGenres = [...genreCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const favoriteDecadeEntry = [...decadeCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const favoriteDecade = favoriteDecadeEntry ? { decade: favoriteDecadeEntry[0], count: favoriteDecadeEntry[1] } : null;

    const recurrentDirectorEntry = [...directorCounts.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])[0];
    const recurrentDirector = recurrentDirectorEntry
      ? { name: recurrentDirectorEntry[0], count: recurrentDirectorEntry[1] }
      : null;

    return { topGenres, favoriteDecade, recurrentDirector };
  }, [qualifiedIds, moviesById]);

  return { stats, loading };
}
