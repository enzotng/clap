# Clap'

Application mobile de découverte et de tracking de films, type Letterboxd × Tinder.
Projet de fin de module React Native (ECV).

## Stack

- Expo SDK 54.0.33 / React 19.1.0 / React Native 0.81.5
- TypeScript strict (zéro `any`)
- expo-router 6 (typed routes activées)
- react-native-reanimated 4 + react-native-worklets/plugin
- react-native-gesture-handler 2
- @react-native-async-storage/async-storage
- expo-image, expo-blur, expo-haptics, expo-splash-screen
- lucide-react-native (icônes)
- Fonts : Fraunces, DM Sans, JetBrains Mono (via @expo-google-fonts)
- API : The Movie Database (TMDB) v3

## Installation

```bash
pnpm install
```

Créer un fichier `.env` à la racine avec ton token TMDB v4 :

```
EXPO_PUBLIC_TMDB_TOKEN=<ton-bearer-token-tmdb>
```

(Récupérable sur https://www.themoviedb.org/settings/api → "API Read Access Token")

## Lancer

```bash
pnpm start
```

Puis scanner le QR code avec Expo Go (iOS ou Android, SDK 54+).

## Structure

```
app/                                   # routes expo-router
├── _layout.tsx                        # Stack root + Provider + ClapSplash + redirect onboarding
├── onboarding.tsx                     # Premier lancement (3 pages welcome/pseudo/genres)
├── (tabs)/
│   ├── _layout.tsx                    # Tab bar floating glass custom
│   ├── discover.tsx                   # Stack swipe 4 directions + tutorial overlay
│   ├── search.tsx                     # TextInput + filters bottom sheet + popular grid
│   ├── library/
│   │   ├── _layout.tsx
│   │   ├── index.tsx                  # 4 sections Netflix-style par statut
│   │   └── [status].tsx               # Liste filtrée + tri + layout animations
│   └── profile.tsx                    # Avatar + stats + habitudes + paramètres
├── movie/
│   ├── [id].tsx                       # Détail film (modal slide-up, parallax)
│   └── [id]/more/
│       └── [...segments].tsx          # Catch-all : cast/[personId] et similar
└── +not-found.tsx

components/                            # 14 composants partagés (memo + tokens)
context/LibraryContext.tsx             # useReducer encapsulé dans Provider (bonus)
hooks/                                 # useTmdbDiscover/Search/Movie/Person/Popular,
                                       # useMoviesById, useAdvancedStats
lib/
├── tmdb.ts                            # Client TMDB + cache 5min + dedup in-flight
├── storage.ts                         # AsyncStorage wrappers + sanitizers
├── genres.ts                          # 12 genres TMDB
└── format.ts                          # formatDateFr (Intl)
theme/tokens.ts                        # colors, fonts, spacing, radius, status maps
```

## Mapping cahier des charges

| Critère | Pts | Implémentation |
|---|---|---|
| Layouts expo-router | 1 | `app/_layout.tsx` (Stack root + modal), `app/(tabs)/_layout.tsx` (Tabs custom), `app/(tabs)/library/_layout.tsx` |
| Link, router, params | 1 | `<Link href={pathname,params}>`, `router.push/replace/back`, `useLocalSearchParams<>()` |
| Pages dynamiques `[param]` et `[...params]` | 1 | `app/movie/[id].tsx`, `app/(tabs)/library/[status].tsx`, `app/movie/[id]/more/[...segments].tsx` |
| Cohérence/fluidité navigation | 1 | Tabs floating + Stack modal slide-up + onboarding redirect + bottom sheet filtres |
| TextInput | 0.5 | `search.tsx`, `movie/[id].tsx` (notes), `onboarding.tsx` (pseudo) |
| FlatList | 1 | `search.tsx` (scroll infini), `library/[status].tsx` (Animated.FlatList + LinearTransition), `movie/[id].tsx` (casting/similaires) |
| Composants réutilisables | 0.5 | 14 composants dans `components/` (MoviePoster, MovieRow, MovieTicket, RatingStars, StatusButton, StatusBadge, GenreChip, ClapSplash, etc.) |
| Mémoïsation (memo, useCallback, useRef) | 1 | `memo()` sur tous les composants de listes, `useCallback` pour tous les handlers, `useRef` pour SharedValues + AbortControllers + queues |
| Reanimated SharedValue | 2 | Swipe stack 4 directions (`discover.tsx`), hero parallax (`movie/[id].tsx`), étoiles (`RatingStars`), tab pill expansion, splash anim (`ClapSplash`), stats bars (`profile.tsx`), bottom sheet (`search.tsx`) |
| Animation de Layout | 1 | `LinearTransition.springify()` dans `library/[status].tsx`, `LinearTransition` sur tab pill, `FadeIn`/`FadeOut`/`SlideInDown`/`SlideOutDown` |
| Reanimated performant | 1 | 100% UI thread sur swipe (Gesture.Pan + useAnimatedStyle), `runOnJS` uniquement au commit, hero parallax via `useAnimatedScrollHandler` |
| Provider Context + hook custom | 1 | `LibraryContext` + `useLibrary()` (jette si hors Provider) |
| **Bonus dépendance non vue** | +2 | `@react-native-async-storage/async-storage` (cité explicitement par le prof) |
| **Bonus react-native-gesture-handler** | +2 | `Gesture.Pan()` sur le stack Découvrir |
| **Bonus reducer DANS Context** | +2 | `LibraryContext` utilise `useReducer` avec 7 actions typées |

**Total visé : 12 + 6 = 18/18 (oral non applicable)**

## Features additionnelles (au-delà du barème)

- Onboarding paginé 3 écrans (welcome / pseudo / genres préférés)
- Splash screen custom avec clap animé en boot
- Tutorial overlay au premier swipe (carte fantôme animée 4 directions en boucle)
- Tab bar floating glass iOS 26-style avec pill expansion + label
- Modal détail avec hero parallax + casting horizontal + similaires
- Filtres recherche en bottom sheet (genre / décennie / note / tri)
- Recherches récentes persistées (5 dernières)
- Tri Bibliothèque (date / titre / note)
- Undo dernier swipe sur Découvrir
- Bouton Partager (Share API native)
- Stats avancées Profil (top genres / décennie favorite / réalisateur récurrent)
- Layout animations sur ajout/retrait dans Bibliothèque
- Cache TMDB 5min + dedup in-flight pour limiter les requêtes
- Hydration gate AsyncStorage pour éviter race au démarrage
- TypeScript strict, zéro `any`, sanitizers défensifs sur AsyncStorage corrompu

## Auteur

Enzo Tang - projet ECV 2026
