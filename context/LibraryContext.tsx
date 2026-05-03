import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type PropsWithChildren } from 'react';
import { loadLibrary, saveLibrary, DEFAULT_PREFS, type UserMovieData, type UserPrefs, type Persisted } from '@/lib/storage';
import type { Status } from '@/theme/tokens';

export type LibraryState = {
  byId: Record<number, UserMovieData>;
  prefs: UserPrefs;
  hydrated: boolean;
};

type Action =
  | { type: 'HYDRATE'; payload: Persisted }
  | { type: 'SET_STATUS'; movieId: number; status: Status }
  | { type: 'SET_RATING'; movieId: number; rating: number }
  | { type: 'SET_NOTE'; movieId: number; note: string }
  | { type: 'REMOVE'; movieId: number }
  | { type: 'CLEAR' }
  | { type: 'SET_PREFS'; prefs: Partial<UserPrefs> };

function libraryReducer(state: LibraryState, action: Action): LibraryState {
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

export type LibraryActions = {
  setStatus: (movieId: number, status: Status) => void;
  setRating: (movieId: number, rating: number) => void;
  setNote: (movieId: number, note: string) => void;
  remove: (movieId: number) => void;
  clear: () => void;
  setPrefs: (prefs: Partial<UserPrefs>) => void;
};

export type LibraryStateValue = {
  state: LibraryState;
  counts: Record<Status, number>;
  averageRating: number;
  getStatus: (movieId: number) => Status | undefined;
  getRating: (movieId: number) => number | undefined;
  getNote: (movieId: number) => string | undefined;
  getByStatus: (status: Status) => number[];
};

const ActionsContext = createContext<LibraryActions | null>(null);
const StateContext = createContext<LibraryStateValue | null>(null);

const EMPTY_IDS: Record<Status, number[]> = { watch: [], seen: [], fav: [], pass: [] };

export function LibraryProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(libraryReducer, { byId: {}, prefs: DEFAULT_PREFS, hydrated: false });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadLibrary().then((payload) => dispatch({ type: 'HYDRATE', payload }));
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveLibrary({ byId: state.byId, prefs: state.prefs });
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state.byId, state.prefs, state.hydrated]);

  const actions = useMemo<LibraryActions>(
    () => ({
      setStatus: (movieId, status) => dispatch({ type: 'SET_STATUS', movieId, status }),
      setRating: (movieId, rating) => dispatch({ type: 'SET_RATING', movieId, rating }),
      setNote: (movieId, note) => dispatch({ type: 'SET_NOTE', movieId, note }),
      remove: (movieId) => dispatch({ type: 'REMOVE', movieId }),
      clear: () => dispatch({ type: 'CLEAR' }),
      setPrefs: (prefs) => dispatch({ type: 'SET_PREFS', prefs }),
    }),
    [],
  );

  const { idsByStatus, counts, averageRating } = useMemo(() => {
    const ids: Record<Status, number[]> = { watch: [], seen: [], fav: [], pass: [] };
    const cnt: Record<Status, number> = { watch: 0, seen: 0, fav: 0, pass: 0 };
    let ratingSum = 0;
    let ratingCount = 0;
    for (const [idStr, d] of Object.entries(state.byId)) {
      if (d.status) {
        ids[d.status].push(Number(idStr));
        cnt[d.status] += 1;
      }
      if (typeof d.rating === 'number') {
        ratingSum += d.rating;
        ratingCount += 1;
      }
    }
    for (const s of ['watch', 'seen', 'fav', 'pass'] as Status[]) {
      ids[s].sort((a, b) => (state.byId[b]?.addedAt ?? 0) - (state.byId[a]?.addedAt ?? 0));
    }
    const avg = ratingCount === 0 ? 0 : ratingSum / ratingCount;
    return { idsByStatus: ids, counts: cnt, averageRating: avg };
  }, [state.byId]);

  const getStatus = useCallback((movieId: number) => state.byId[movieId]?.status, [state.byId]);
  const getRating = useCallback((movieId: number) => state.byId[movieId]?.rating, [state.byId]);
  const getNote = useCallback((movieId: number) => state.byId[movieId]?.note, [state.byId]);
  const getByStatus = useCallback((status: Status) => idsByStatus[status] ?? EMPTY_IDS[status], [idsByStatus]);

  const stateValue = useMemo<LibraryStateValue>(
    () => ({ state, counts, averageRating, getStatus, getRating, getNote, getByStatus }),
    [state, counts, averageRating, getStatus, getRating, getNote, getByStatus],
  );

  return (
    <ActionsContext.Provider value={actions}>
      <StateContext.Provider value={stateValue}>{children}</StateContext.Provider>
    </ActionsContext.Provider>
  );
}

export function useLibraryActions(): LibraryActions {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error('useLibraryActions must be used within LibraryProvider');
  return ctx;
}

export function useLibraryState(): LibraryStateValue {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error('useLibraryState must be used within LibraryProvider');
  return ctx;
}
