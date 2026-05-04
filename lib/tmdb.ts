const BASE = 'https://api.themoviedb.org/3';
const TOKEN = process.env.EXPO_PUBLIC_TMDB_TOKEN;

export const IMG_W500 = 'https://image.tmdb.org/t/p/w500';
export const IMG_W780 = 'https://image.tmdb.org/t/p/w780';
export const IMG_W185 = 'https://image.tmdb.org/t/p/w185';

export type TmdbMovie = {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
};

export type TmdbCast = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
};

export type TmdbCrew = {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
};

export type TmdbMovieDetail = TmdbMovie & {
  credits?: { cast: TmdbCast[]; crew: TmdbCrew[] };
  similar?: { results: TmdbMovie[] };
};

export type TmdbSearchPage = {
  page: number;
  total_pages: number;
  total_results: number;
  results: TmdbMovie[];
};

export type TmdbPerson = {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  profile_path: string | null;
  known_for_department: string;
  movie_credits: {
    cast: (TmdbMovie & { character: string })[];
  };
};

export type TmdbPersonSearchResult = {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  known_for: TmdbMovie[];
};

export type TmdbPersonSearchPage = {
  page: number;
  total_pages: number;
  total_results: number;
  results: TmdbPersonSearchResult[];
};

export type TmdbMultiMovie = TmdbMovie & { media_type: 'movie' };
export type TmdbMultiPerson = TmdbPersonSearchResult & { media_type: 'person' };
export type TmdbMultiTv = { media_type: 'tv'; id: number; name: string };
export type TmdbMultiResult = TmdbMultiMovie | TmdbMultiPerson | TmdbMultiTv;

export type TmdbMultiSearchPage = {
  page: number;
  total_pages: number;
  total_results: number;
  results: TmdbMultiResult[];
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;
const FETCH_TIMEOUT_MS = 12000;

const cache = new Map<string, { data: unknown; ts: number }>();
const inFlight = new Map<string, Promise<unknown>>();

function safeId(id: number): string {
  if (!Number.isFinite(id) || !Number.isInteger(id) || id <= 0) {
    throw new Error(`Identifiant invalide: ${id}`);
  }
  return String(id);
}

function cacheSet(url: string, data: unknown) {
  cache.set(url, { data, ts: Date.now() });
  if (cache.size > CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

export function invalidateMovie(id: number): void {
  const prefix = `${BASE}/movie/${id}?`;
  for (const key of [...cache.keys()]) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

function abortError(): Error {
  const e = new Error('Aborted');
  e.name = 'AbortError';
  return e;
}

async function tmdb<T>(path: string, params: Record<string, string | number> = {}, signal?: AbortSignal): Promise<T> {
  if (!TOKEN) throw new Error('Configuration manquante : EXPO_PUBLIC_TMDB_TOKEN');

  const qs = new URLSearchParams({
    language: 'fr-FR',
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  }).toString();
  const url = `${BASE}${path}?${qs}`;

  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    if (signal?.aborted) throw abortError();
    return cached.data as T;
  }

  let shared = inFlight.get(url) as Promise<T> | undefined;
  if (!shared) {
    shared = (async () => {
      const timeoutCtl = new AbortController();
      const timer = setTimeout(() => timeoutCtl.abort(), FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${TOKEN}`, accept: 'application/json' },
          signal: timeoutCtl.signal,
        });
        if (!res.ok) throw new Error(`Service indisponible (${res.status})`);
        const data = (await res.json()) as unknown;
        if (data === null || typeof data !== 'object') {
          throw new Error('Réponse invalide');
        }
        cacheSet(url, data);
        return data as T;
      } finally {
        clearTimeout(timer);
      }
    })();
    inFlight.set(url, shared);
    shared.finally(() => {
      if (inFlight.get(url) === shared) inFlight.delete(url);
    });
  }

  if (!signal) return shared;
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError());
      return;
    }
    const onAbort = () => {
      signal.removeEventListener('abort', onAbort);
      reject(abortError());
    };
    signal.addEventListener('abort', onAbort, { once: true });
    shared.then(
      (v) => {
        signal.removeEventListener('abort', onAbort);
        resolve(v);
      },
      (e) => {
        signal.removeEventListener('abort', onAbort);
        reject(e);
      },
    );
  });
}

export type DiscoverSort = 'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc';

export type DiscoverOpts = {
  withGenres?: string;
  yearFrom?: number;
  yearTo?: number;
  voteAverageGte?: number;
  voteCountGte?: number;
  sortBy?: DiscoverSort;
};

export const tmdbApi = {
  discover: (page: number, opts: DiscoverOpts = {}, signal?: AbortSignal) => {
    const params: Record<string, string | number> = {
      page,
      sort_by: opts.sortBy ?? 'popularity.desc',
    };
    if (opts.withGenres) params.with_genres = opts.withGenres;
    if (opts.yearFrom) params['primary_release_date.gte'] = `${opts.yearFrom}-01-01`;
    if (opts.yearTo) params['primary_release_date.lte'] = `${opts.yearTo}-12-31`;
    if (opts.voteAverageGte) params['vote_average.gte'] = opts.voteAverageGte;
    if (opts.voteCountGte) params['vote_count.gte'] = opts.voteCountGte;
    return tmdb<TmdbSearchPage>('/discover/movie', params, signal);
  },
  search: (query: string, page: number, signal?: AbortSignal) =>
    tmdb<TmdbSearchPage>('/search/movie', { query, page, include_adult: 'false' }, signal),
  searchMulti: (query: string, page: number, signal?: AbortSignal) =>
    tmdb<TmdbMultiSearchPage>('/search/multi', { query, page, include_adult: 'false' }, signal),
  popularPerson: (page: number, signal?: AbortSignal) =>
    tmdb<TmdbPersonSearchPage>('/person/popular', { page }, signal),
  movie: (id: number, signal?: AbortSignal) =>
    tmdb<TmdbMovieDetail>(`/movie/${safeId(id)}`, { append_to_response: 'credits,similar' }, signal),
  person: (id: number, signal?: AbortSignal) =>
    tmdb<TmdbPerson>(`/person/${safeId(id)}`, { append_to_response: 'movie_credits' }, signal),
};

export function posterUrl(path: string | null, size: 'w185' | 'w500' | 'w780' = 'w500'): string | null {
  if (!path) return null;
  const base = size === 'w185' ? IMG_W185 : size === 'w780' ? IMG_W780 : IMG_W500;
  return `${base}${path}`;
}
