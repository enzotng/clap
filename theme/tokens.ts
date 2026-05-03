export const colors = {
  bg: '#0A0908',
  bg2: '#121110',
  bg3: '#1C1A18',
  line: '#2A2724',
  line2: '#3A3530',
  ink: '#F4EFE6',
  ink2: '#B8AFA1',
  ink3: '#948B7E',
  ink4: '#4A453E',
  gold: '#D4A547',
  goldDeep: '#A8801D',
  goldGlow: 'rgba(212, 165, 71, 0.2)',
  watch: '#7BB661',
  watchBg: 'rgba(123, 182, 97, 0.18)',
  pass: '#D9534F',
  passBg: 'rgba(217, 83, 79, 0.18)',
  fav: '#E8B931',
  favBg: 'rgba(232, 185, 49, 0.18)',
  seen: '#5B9BD5',
  seenBg: 'rgba(91, 155, 213, 0.18)',
} as const;

export const fonts = {
  serif: 'Fraunces_400Regular',
  serifMed: 'Fraunces_500Medium',
  serifBold: 'Fraunces_600SemiBold',
  serifItalic: 'Fraunces_400Regular_Italic',
  sans: 'DMSans_400Regular',
  sansMed: 'DMSans_500Medium',
  sansBold: 'DMSans_700Bold',
  mono: 'JetBrainsMono_500Medium',
} as const;

export const spacing = {
  xs: 4,
  s: 8,
  m: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 64,
} as const;

export const radius = {
  s: 8,
  m: 14,
  l: 22,
  xl: 28,
} as const;

export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_BOTTOM_INSET = 16;

export type Status = 'watch' | 'seen' | 'fav' | 'pass';

export const STATUS_LABELS: Record<Status, string> = {
  watch: 'À voir',
  seen: 'Vu',
  fav: 'Favori',
  pass: 'Pas intéressé',
};

export const STATUS_COLORS: Record<Status, string> = {
  watch: colors.watch,
  seen: colors.seen,
  fav: colors.fav,
  pass: colors.pass,
};

export const STATUS_BG: Record<Status, string> = {
  watch: colors.watchBg,
  seen: colors.seenBg,
  fav: colors.favBg,
  pass: colors.passBg,
};
