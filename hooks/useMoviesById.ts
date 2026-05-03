import { useEffect, useRef, useState } from 'react';
import { tmdbApi, type TmdbMovie } from '@/lib/tmdb';

const CONCURRENCY = 6;

async function fetchInBatches(ids: number[]): Promise<Array<{ id: number; m: TmdbMovie } | null>> {
  const out: Array<{ id: number; m: TmdbMovie } | null> = [];
  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((id) =>
        tmdbApi
          .movie(id)
          .then((m) => ({ id, m }))
          .catch(() => null),
      ),
    );
    out.push(...results);
  }
  return out;
}

export function useMoviesById(ids: number[]): Record<number, TmdbMovie | undefined> {
  const [moviesById, setMoviesById] = useState<Record<number, TmdbMovie>>({});
  const idsKey = ids.join(',');
  const moviesByIdRef = useRef(moviesById);

  useEffect(() => {
    moviesByIdRef.current = moviesById;
  }, [moviesById]);

  useEffect(() => {
    let cancelled = false;
    const missing = ids.filter((id) => !moviesByIdRef.current[id]);
    if (missing.length === 0) return;
    fetchInBatches(missing).then((results) => {
      if (cancelled) return;
      setMoviesById((prev) => {
        const next = { ...prev };
        for (const r of results) {
          if (r) next[r.id] = r.m;
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
    // idsKey collapses identity changes when contents are identical
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return moviesById;
}
