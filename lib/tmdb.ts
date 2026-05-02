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
  credits: { cast: TmdbCast[]; crew: TmdbCrew[] };
  similar: { results: TmdbMovie[] };
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

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; ts: number }>();
const inFlight = new Map<string, Promise<unknown>>();

function safeId(id: number): string {
  if (!Number.isFinite(id) || !Number.isInteger(id) || id <= 0) {
    throw new Error(`TMDB id invalide: ${id}`);
  }
  return String(id);
}

async function tmdb<T>(path: string, params: Record<string, string | number> = {}, signal?: AbortSignal): Promise<T> {
  if (!TOKEN) throw new Error('EXPO_PUBLIC_TMDB_TOKEN manquant - configurez .env');

  const qs = new URLSearchParams({
    language: 'fr-FR',
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  }).toString();
  const url = `${BASE}${path}?${qs}`;

  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data as T;
  }

  const pending = inFlight.get(url);
  if (pending) return pending as Promise<T>;

  const promise = (async () => {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}`, accept: 'application/json' },
      signal,
    });
    if (!res.ok) throw new Error(`TMDB ${res.status} sur ${path}`);
    const data = (await res.json()) as T;
    cache.set(url, { data, ts: Date.now() });
    return data;
  })();

  inFlight.set(url, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(url);
  }
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
