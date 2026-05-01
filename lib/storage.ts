import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Status } from '@/theme/tokens';

export type UserMovieData = {
  status?: Status;
  rating?: number;
  note?: string;
  addedAt: number;
};

export type UserPrefs = {
  name: string;
  preferredGenres: number[];
  onboarded: boolean;
  tutorialSeen: boolean;
};

export type Persisted = {
  byId: Record<number, UserMovieData>;
  prefs: UserPrefs;
};

export const DEFAULT_PREFS: UserPrefs = {
  name: '',
  preferredGenres: [],
  onboarded: false,
  tutorialSeen: false,
};

const KEY = 'clap:library:v1';

function sanitizeById(raw: unknown): Record<number, UserMovieData> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<number, UserMovieData> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const id = Number(k);
    if (!Number.isFinite(id)) continue;
    if (!v || typeof v !== 'object') continue;
    out[id] = v as UserMovieData;
  }
  return out;
}

function sanitizePrefs(raw: unknown): UserPrefs {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return DEFAULT_PREFS;
  const r = raw as Record<string, unknown>;
  const name = typeof r.name === 'string' ? r.name.trim().slice(0, 50) : DEFAULT_PREFS.name;
  const preferredGenres = Array.isArray(r.preferredGenres)
    ? r.preferredGenres.filter((g): g is number => typeof g === 'number' && Number.isFinite(g)).slice(0, 3)
    : DEFAULT_PREFS.preferredGenres;
  const onboarded = r.onboarded === true;
  const tutorialSeen = r.tutorialSeen === true;
  return { name, preferredGenres, onboarded, tutorialSeen };
}

export async function loadLibrary(): Promise<Persisted> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { byId: {}, prefs: DEFAULT_PREFS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { byId: {}, prefs: DEFAULT_PREFS };
    return {
      byId: sanitizeById((parsed as Record<string, unknown>).byId),
      prefs: sanitizePrefs((parsed as Record<string, unknown>).prefs),
    };
  } catch {
    return { byId: {}, prefs: DEFAULT_PREFS };
  }
}

export async function saveLibrary(data: Persisted): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // intentionally swallowed: best-effort persistence, retried on next change
  }
}
