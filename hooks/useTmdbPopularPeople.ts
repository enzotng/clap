import { useEffect, useState } from 'react';
import { tmdbApi, type TmdbPersonSearchResult } from '@/lib/tmdb';

type State = {
  results: TmdbPersonSearchResult[];
  loading: boolean;
  error: string | null;
};

export function useTmdbPopularPeople() {
  const [state, setState] = useState<State>({ results: [], loading: true, error: null });

  useEffect(() => {
    const ctl = new AbortController();
    setState({ results: [], loading: true, error: null });
    tmdbApi
      .popularPerson(1, ctl.signal)
      .then((page) => setState({ results: page.results, loading: false, error: null }))
      .catch((e) => {
        if (ctl.signal.aborted) return;
        setState({ results: [], loading: false, error: e instanceof Error ? e.message : 'Service indisponible' });
      });
    return () => ctl.abort();
  }, []);

  return state;
}
