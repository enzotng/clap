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

## Auteur

Enzo Tang - projet ECV 2026
