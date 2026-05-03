import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { ChevronLeft } from 'lucide-react-native';
import { useLibraryActions } from '@/context/LibraryContext';
import { GENRES, MAX_PREFERRED_GENRES } from '@/lib/genres';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

const { width: SCREEN_W } = Dimensions.get('window');

export default function OnboardingScreen() {
  const { setPrefs } = useLibraryActions();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const [name, setName] = useState('');
  const [genres, setGenres] = useState<number[]>([]);

  const goPage = useCallback((p: number) => {
    scrollRef.current?.scrollTo({ x: p * SCREEN_W, y: 0, animated: true });
    setPage(p);
  }, []);

  const finish = useCallback(() => {
    setPrefs({
      name: name.trim() || 'Cinéphile',
      preferredGenres: genres,
      onboarded: true,
    });
    router.replace('/(tabs)/discover');
  }, [name, genres, setPrefs]);

  const toggleGenre = useCallback((id: number) => {
    setGenres((prev) => {
      if (prev.includes(id)) return prev.filter((g) => g !== id);
      if (prev.length >= MAX_PREFERRED_GENRES) return prev;
      return [...prev, id];
    });
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          {page > 0 ? (
            <Pressable
              onPress={() => goPage(page - 1)}
              style={styles.backBtn}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Étape précédente"
            >
              <ChevronLeft color={colors.ink2} size={22} strokeWidth={1.8} />
            </Pressable>
          ) : (
            <View style={styles.backBtn} />
          )}
          <View style={styles.dots}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
            ))}
          </View>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          keyboardShouldPersistTaps="handled"
        >
          <PageWelcome onNext={() => goPage(1)} width={SCREEN_W} />
          <PageName name={name} setName={setName} onNext={() => goPage(2)} width={SCREEN_W} active={page === 1} />
          <PageGenres genres={genres} toggleGenre={toggleGenre} onFinish={finish} width={SCREEN_W} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PageWelcome({ onNext, width }: { onNext: () => void; width: number }) {
  return (
    <View style={[styles.page, { width }]}>
      <Animated.Text entering={ZoomIn.duration(600)} style={styles.logo}>Clap'</Animated.Text>
      <Text style={styles.tagline}>Le tri des films, à coups de ticket.</Text>
      <Text style={styles.subtitle}>
        Une carte = un film. Quatre gestes pour qualifier ce qui te tente, ce que tu as vu, ce que tu adores ou ce qui ne t'inspire pas.
      </Text>
      <Pressable
        style={styles.cta}
        onPress={onNext}
        accessibilityRole="button"
        accessibilityLabel="Commencer l'onboarding"
      >
        <Text style={styles.ctaText}>Commencer</Text>
      </Pressable>
    </View>
  );
}

function PageName({
  name,
  setName,
  onNext,
  width,
  active,
}: {
  name: string;
  setName: (s: string) => void;
  onNext: () => void;
  width: number;
  active: boolean;
}) {
  const inputRef = useRef<TextInput>(null);
  const canProceed = name.trim().length > 0;

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <View style={[styles.page, { width }]}>
      <Text style={styles.eyebrow}>FAISONS CONNAISSANCE</Text>
      <Text style={styles.h1}>Comment t'appelle-t-on ?</Text>
      <TextInput
        ref={inputRef}
        value={name}
        onChangeText={setName}
        placeholder="Cinéphile..."
        placeholderTextColor={colors.ink3}
        style={styles.input}
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={32}
        returnKeyType="next"
        onSubmitEditing={() => canProceed && onNext()}
        accessibilityLabel="Ton pseudo"
        textContentType="nickname"
      />
      <Pressable
        style={[styles.cta, !canProceed && styles.ctaDisabled]}
        onPress={canProceed ? onNext : undefined}
        disabled={!canProceed}
        accessibilityRole="button"
        accessibilityLabel="Étape suivante"
        accessibilityState={{ disabled: !canProceed }}
      >
        <Text style={styles.ctaText}>Suivant</Text>
      </Pressable>
    </View>
  );
}

function PageGenres({
  genres,
  toggleGenre,
  onFinish,
  width,
}: {
  genres: number[];
  toggleGenre: (id: number) => void;
  onFinish: () => void;
  width: number;
}) {
  return (
    <View style={[styles.page, { width }]}>
      <Text style={styles.eyebrow}>TES PRÉFÉRENCES</Text>
      <Text style={styles.h1}>Tes genres préférés</Text>
      <Text style={styles.subtitle}>Optionnel · 3 max · sert à filtrer Découvrir</Text>
      <View style={styles.chipsWrap}>
        {GENRES.map((g) => (
          <GenreToggle
            key={g.id}
            label={g.label}
            selected={genres.includes(g.id)}
            disabled={!genres.includes(g.id) && genres.length >= MAX_PREFERRED_GENRES}
            onPress={() => toggleGenre(g.id)}
          />
        ))}
      </View>
      <Pressable
        style={styles.cta}
        onPress={onFinish}
        accessibilityRole="button"
        accessibilityLabel="Terminer et entrer dans l'app"
      >
        <Text style={styles.ctaText}>C'est parti</Text>
      </Pressable>
    </View>
  );
}

function GenreToggle({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    if (disabled) return;
    scale.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 200 }),
    );
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
    >
      <Animated.View
        style={[
          styles.chip,
          selected && styles.chipSelected,
          disabled && styles.chipDisabled,
          animatedStyle,
        ]}
      >
        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: spacing.s },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.line2 },
  dotActive: { width: 28, backgroundColor: colors.gold },
  page: { padding: spacing.xl, alignItems: 'center', justifyContent: 'center', gap: spacing.md, flex: 1 },
  logo: { fontFamily: fonts.serifItalic, fontSize: 80, color: colors.gold, textAlign: 'center' },
  tagline: { fontFamily: fonts.serif, fontSize: 18, color: colors.ink, textAlign: 'center', marginTop: spacing.s },
  subtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink2, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing.md },
  eyebrow: { fontFamily: fonts.mono, fontSize: 11, color: colors.gold, letterSpacing: 4, textAlign: 'center' },
  h1: { fontFamily: fonts.serifBold, fontSize: 30, color: colors.ink, textAlign: 'center', marginBottom: spacing.s, lineHeight: 36 },
  input: {
    width: '100%',
    backgroundColor: colors.bg2,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.m,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.m,
    fontFamily: fonts.sans,
    color: colors.ink,
    fontSize: 18,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s + 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line2,
    backgroundColor: colors.bg2,
  },
  chipSelected: { backgroundColor: colors.gold, borderColor: colors.gold },
  chipDisabled: { opacity: 0.3 },
  chipText: { fontFamily: fonts.sansMed, color: colors.ink2, fontSize: 13 },
  chipTextSelected: { color: colors.bg },
  cta: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.m,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.m,
    backgroundColor: colors.bg,
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { fontFamily: fonts.mono, color: colors.gold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
});
