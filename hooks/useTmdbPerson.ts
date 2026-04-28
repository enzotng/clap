import { useEffect, useState } from 'react';
import { tmdbApi, type TmdbPerson } from '@/lib/tmdb';

type State = {
  data: TmdbPerson | null;
  loading: boolean;
  error: string | null;
};

export function useTmdbPerson(id: number | undefined) {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });

  useEffect(() => {
    if (!id || !Number.isFinite(id)) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    const ctl = new AbortController();
    setState({ data: null, loading: true, error: null });
    tmdbApi
      .person(id, ctl.signal)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((e) => {
        if (ctl.signal.aborted) return;
        setState({ data: null, loading: false, error: e instanceof Error ? e.message : String(e) });
      });
    return () => ctl.abort();
  }, [id]);

  return state;
}
