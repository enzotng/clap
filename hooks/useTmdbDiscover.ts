import { useCallback, useEffect, useRef, useState } from 'react';
import { tmdbApi, type TmdbMovie } from '@/lib/tmdb';
import { useLibraryState } from '@/context/LibraryContext';

type State = {
  queue: TmdbMovie[];
  loading: boolean;
  error: string | null;
};

const MIN_QUEUE = 3;

export function useTmdbDiscover() {
  const [state, setState] = useState<State>({ queue: [], loading: false, error: null });
  const pageRef = useRef(0);
  const seenRef = useRef<Set<number>>(new Set());
  const loadingRef = useRef(false);
  const totalPagesRef = useRef<number | null>(null);
  const { state: lib } = useLibraryState();

  const libRef = useRef(lib.byId);
  useEffect(() => {
    libRef.current = lib.byId;
  }, [lib.byId]);
  const genresRef = useRef(lib.prefs.preferredGenres);
  useEffect(() => {
    genresRef.current = lib.prefs.preferredGenres;
  }, [lib.prefs.preferredGenres]);

  const loadNext = useCallback(async () => {
    if (loadingRef.current) return;
    if (totalPagesRef.current !== null && pageRef.current >= totalPagesRef.current) return;
    loadingRef.current = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      pageRef.current += 1;
      const genres = genresRef.current.length > 0 ? genresRef.current.join(',') : undefined;
      const page = await tmdbApi.discover(pageRef.current, { withGenres: genres });
      totalPagesRef.current = page.total_pages;
      const current = libRef.current;
      const fresh = page.results.filter((m) => {
        if (seenRef.current.has(m.id)) return false;
        if (current[m.id]?.status) return false;
        seenRef.current.add(m.id);
        return true;
      });
      setState((s) => ({ queue: [...s.queue, ...fresh], loading: false, error: null }));
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : 'Service indisponible' }));
    } finally {
      loadingRef.current = false;
    }
  }, []);

  const refill = useCallback(() => {
    pageRef.current = 0;
    totalPagesRef.current = null;
    seenRef.current = new Set();
    setState({ queue: [], loading: false, error: null });
    void loadNext();
  }, [loadNext]);

  useEffect(() => {
    if (state.queue.length < MIN_QUEUE && !loadingRef.current) {
      void loadNext();
    }
  }, [state.queue.length, loadNext]);

  const next = useCallback(() => {
    setState((s) => ({ ...s, queue: s.queue.slice(1) }));
  }, []);

  const unshift = useCallback((movie: TmdbMovie) => {
    setState((s) => ({ ...s, queue: [movie, ...s.queue] }));
    seenRef.current.delete(movie.id);
  }, []);

  return { queue: state.queue, loading: state.loading, error: state.error, next, refill, unshift };
}
