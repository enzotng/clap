import { useEffect, type PropsWithChildren } from 'react';
import { hydrateStore, teardownStore } from '@/context/libraryStore';

export {
  useLibraryActions,
  useLibraryState,
  useLibraryHydrated,
  useUserPrefs,
  useMovieStatus,
  useMovieRating,
  useMovieNote,
  useIdsByStatus,
  useCounts,
  useAverageRating,
} from '@/context/libraryStore';
export type { LibraryActions, LibraryState, LibraryStateValue } from '@/context/libraryStore';

export function LibraryProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    void hydrateStore();
    return teardownStore;
  }, []);

  return <>{children}</>;
}
