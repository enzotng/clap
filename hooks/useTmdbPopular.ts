import { useEffect, useState } from 'react';
import { tmdbApi, type DiscoverSort, type TmdbMovie } from '@/lib/tmdb';

export type PopularFilters = {
  genreId?: number;
  yearFrom?: number;
  yearTo?: number;
  minRating?: number;
  sortBy?: DiscoverSort;
};

type State = {
  results: TmdbMovie[];
  loading: boolean;
  error: string | null;
};

export function useTmdbPopular(filters: PopularFilters = {}) {
  const [state, setState] = useState<State>({ results: [], loading: true, error: null });
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    const ctl = new AbortController();
    setState({ results: [], loading: true, error: null });
    tmdbApi
      .discover(
        1,
        {
          withGenres: filters.genreId ? String(filters.genreId) : undefined,
          yearFrom: filters.yearFrom,
          yearTo: filters.yearTo,
          voteAverageGte: filters.minRating,
          voteCountGte: filters.minRating ? 100 : undefined,
          sortBy: filters.sortBy,
        },
        ctl.signal,
      )
      .then((page) => setState({ results: page.results, loading: false, error: null }))
      .catch((e) => {
        if (ctl.signal.aborted) return;
        setState({ results: [], loading: false, error: e instanceof Error ? e.message : String(e) });
      });
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  return state;
}
