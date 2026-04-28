import { useCallback, useEffect, useRef, useState } from 'react';
import { tmdbApi, type TmdbMovie } from '@/lib/tmdb';

type State = {
  results: TmdbMovie[];
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
};

const DEBOUNCE_MS = 300;

export function useTmdbSearch(query: string) {
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
      const r = await tmdbApi.search(q, pageNum, ctl.signal);
      if (queryRef.current !== q) return;
      setState((s) => ({
        results: pageNum === 1 ? r.results : [...s.results, ...r.results],
        page: r.page,
        totalPages: r.total_pages,
        loading: false,
        error: null,
      }));
    } catch (e) {
      if (ctl.signal.aborted) return;
      setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : String(e) }));
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
