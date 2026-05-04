import { useSyncExternalStore } from 'react';
import { DEFAULT_PREFS, loadLibrary, saveLibrary, type Persisted, type UserMovieData, type UserPrefs } from '@/lib/storage';
import type { Status } from '@/theme/tokens';

export type LibraryState = {
  byId: Record<number, UserMovieData>;
  prefs: UserPrefs;
  hydrated: boolean;
};

type Derived = {
  idsByStatus: Record<Status, number[]>;
  counts: Record<Status, number>;
  averageRating: number;
};

type Action =
  | { type: 'HYDRATE'; payload: Persisted }
  | { type: 'SET_STATUS'; movieId: number; status: Status }
  | { type: 'SET_RATING'; movieId: number; rating: number }
  | { type: 'SET_NOTE'; movieId: number; note: string }
  | { type: 'REMOVE'; movieId: number }
  | { type: 'CLEAR' }
  | { type: 'SET_PREFS'; prefs: Partial<UserPrefs> };

const EMPTY_IDS: Record<Status, number[]> = { watch: [], seen: [], fav: [], pass: [] };
const EMPTY_COUNTS: Record<Status, number> = { watch: 0, seen: 0, fav: 0, pass: 0 };

function reducer(state: LibraryState, action: Action): LibraryState {
  switch (action.type) {
    case 'HYDRATE':
      return { byId: action.payload.byId, prefs: action.payload.prefs, hydrated: true };
    case 'SET_PREFS':
      return { ...state, prefs: { ...state.prefs, ...action.prefs } };
    case 'SET_STATUS': {
      const prev = state.byId[action.movieId];
      return {
        ...state,
        byId: { ...state.byId, [action.movieId]: { ...prev, status: action.status, addedAt: prev?.addedAt ?? Date.now() } },
      };
    }
    case 'SET_RATING': {
      const prev = state.byId[action.movieId];
      return {
        ...state,
        byId: { ...state.byId, [action.movieId]: { ...prev, rating: action.rating, addedAt: prev?.addedAt ?? Date.now() } },
      };
    }
    case 'SET_NOTE': {
      const prev = state.byId[action.movieId];
      return {
        ...state,
        byId: { ...state.byId, [action.movieId]: { ...prev, note: action.note, addedAt: prev?.addedAt ?? Date.now() } },
      };
    }
    case 'REMOVE': {
      const next = { ...state.byId };
      delete next[action.movieId];
      return { ...state, byId: next };
    }
    case 'CLEAR':
      return { ...state, byId: {} };
    default:
      return state;
  }
}

function computeDerived(byId: Record<number, UserMovieData>): Derived {
  const idsByStatus: Record<Status, number[]> = { watch: [], seen: [], fav: [], pass: [] };
  const counts: Record<Status, number> = { watch: 0, seen: 0, fav: 0, pass: 0 };
  let ratingSum = 0;
  let ratingCount = 0;
  for (const [idStr, d] of Object.entries(byId)) {
    if (d.status) {
      idsByStatus[d.status].push(Number(idStr));
      counts[d.status] += 1;
    }
    if (typeof d.rating === 'number') {
      ratingSum += d.rating;
      ratingCount += 1;
    }
  }
  for (const s of ['watch', 'seen', 'fav', 'pass'] as Status[]) {
    idsByStatus[s].sort((a, b) => (byId[b]?.addedAt ?? 0) - (byId[a]?.addedAt ?? 0));
  }
  const averageRating = ratingCount === 0 ? 0 : ratingSum / ratingCount;
  return { idsByStatus, counts, averageRating };
}

let state: LibraryState = { byId: {}, prefs: DEFAULT_PREFS, hydrated: false };
let derived: Derived = computeDerived(state.byId);
let combinedSnapshot: { state: LibraryState; derived: Derived } = { state, derived };
const listeners = new Set<() => void>();

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let persistEnabled = false;

function schedulePersist() {
  if (!persistEnabled) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveLibrary({ byId: state.byId, prefs: state.prefs }).catch(() => {});
  }, 500);
}

function dispatch(action: Action) {
  const next = reducer(state, action);
  if (next === state) return;
  const byIdChanged = next.byId !== state.byId;
  state = next;
  if (byIdChanged) derived = computeDerived(state.byId);
  combinedSnapshot = { state, derived };
  listeners.forEach((l) => l());
  if (action.type !== 'HYDRATE') schedulePersist();
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export async function hydrateStore(): Promise<void> {
  if (state.hydrated) return;
  const payload = await loadLibrary();
  dispatch({ type: 'HYDRATE', payload });
  persistEnabled = true;
}

export function teardownStore(): void {
  persistEnabled = false;
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
}

export type LibraryActions = {
  setStatus: (movieId: number, status: Status) => void;
  setRating: (movieId: number, rating: number) => void;
  setNote: (movieId: number, note: string) => void;
  remove: (movieId: number) => void;
  clear: () => void;
  setPrefs: (prefs: Partial<UserPrefs>) => void;
};

const ACTIONS: LibraryActions = {
  setStatus: (movieId, status) => dispatch({ type: 'SET_STATUS', movieId, status }),
  setRating: (movieId, rating) => dispatch({ type: 'SET_RATING', movieId, rating }),
  setNote: (movieId, note) => dispatch({ type: 'SET_NOTE', movieId, note }),
  remove: (movieId) => dispatch({ type: 'REMOVE', movieId }),
  clear: () => dispatch({ type: 'CLEAR' }),
  setPrefs: (prefs) => dispatch({ type: 'SET_PREFS', prefs }),
};

export function useLibraryActions(): LibraryActions {
  return ACTIONS;
}

export function useLibraryHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => state.hydrated);
}

export function useUserPrefs(): UserPrefs {
  return useSyncExternalStore(subscribe, () => state.prefs);
}

export function useMovieStatus(movieId: number): Status | undefined {
  return useSyncExternalStore(subscribe, () => state.byId[movieId]?.status);
}

export function useMovieRating(movieId: number): number | undefined {
  return useSyncExternalStore(subscribe, () => state.byId[movieId]?.rating);
}

export function useMovieNote(movieId: number): string | undefined {
  return useSyncExternalStore(subscribe, () => state.byId[movieId]?.note);
}

export function useIdsByStatus(status: Status): number[] {
  return useSyncExternalStore(subscribe, () => derived.idsByStatus[status] ?? EMPTY_IDS[status]);
}

export function useCounts(): Record<Status, number> {
  return useSyncExternalStore(subscribe, () => derived.counts ?? EMPTY_COUNTS);
}

export function useAverageRating(): number {
  return useSyncExternalStore(subscribe, () => derived.averageRating);
}

export type LibraryStateValue = {
  state: LibraryState;
  counts: Record<Status, number>;
  averageRating: number;
  getStatus: (movieId: number) => Status | undefined;
  getRating: (movieId: number) => number | undefined;
  getNote: (movieId: number) => string | undefined;
  getByStatus: (status: Status) => number[];
};

function getCombinedSnapshot(): { state: LibraryState; derived: Derived } {
  return combinedSnapshot;
}

export function useLibraryState(): LibraryStateValue {
  const snap = useSyncExternalStore(subscribe, getCombinedSnapshot);
  return {
    state: snap.state,
    counts: snap.derived.counts,
    averageRating: snap.derived.averageRating,
    getStatus: (movieId) => snap.state.byId[movieId]?.status,
    getRating: (movieId) => snap.state.byId[movieId]?.rating,
    getNote: (movieId) => snap.state.byId[movieId]?.note,
    getByStatus: (status) => snap.derived.idsByStatus[status] ?? EMPTY_IDS[status],
  };
}
