import { useCallback, useEffect, useRef, useState } from 'react';
import { tmdbApi, type TmdbMultiResult } from '@/lib/tmdb';

type State = {
  results: TmdbMultiResult[];
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
};

const DEBOUNCE_MS = 300;

function isRelevant(item: TmdbMultiResult): boolean {
  return item.media_type === 'movie' || item.media_type === 'person';
}

export function useTmdbSearchMulti(query: string) {
  const [state, setState] = useState<State>({ results: [], page: 0, totalPages: 0, loading: false, error: null });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const queryRef = useRef('');

  const fetchPage = useCallback(async (q: string, pageNum: number) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    queryRef.current = q;
    const ctl = abortRef.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const r = await tmdbApi.searchMulti(q, pageNum, ctl.signal);
      if (queryRef.current !== q) return;
      const filtered = r.results.filter(isRelevant);
      setState((s) => ({
        results: pageNum === 1 ? filtered : [...s.results, ...filtered],
        page: r.page,
        totalPages: r.total_pages,
        loading: false,
        error: null,
      }));
    } catch (e) {
      if (ctl.signal.aborted) return;
      setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : 'Service indisponible' }));
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setState({ results: [], page: 0, totalPages: 0, loading: false, error: null });
      return;
    }
    debounceRef.current = setTimeout(() => fetchPage(query.trim(), 1), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchPage]);

  const loadMore = useCallback(() => {
    if (state.loading) return;
    if (state.page >= state.totalPages) return;
    if (!query.trim()) return;
    fetchPage(query.trim(), state.page + 1);
  }, [state.loading, state.page, state.totalPages, query, fetchPage]);

  const hasMore = state.page < state.totalPages && state.totalPages > 0;

  return {
    results: state.results,
    loading: state.loading,
    error: state.error,
    loadMore,
    hasMore,
  };
}
