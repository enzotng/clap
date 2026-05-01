import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Modal } from 'react-native';
const { absoluteFillObject } = StyleSheet;
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTmdbDiscover } from '@/hooks/useTmdbDiscover';
import { useLibrary } from '@/context/LibraryContext';
import { MovieTicket } from '@/components/MovieTicket';
import { EmptyState } from '@/components/EmptyState';
import { colors, fonts, spacing, type Status } from '@/theme/tokens';

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;
const THRESHOLD = 120;
const VELOCITY_THRESHOLD = 500;
const SWIPE_EASING = Easing.bezier(0.32, 0.72, 0, 1);

const MASTHEAD_H = 44;
const TICKET_W = SCREEN_W - 32;

type Direction = 'left' | 'right' | 'up' | 'down';

const DIRECTION_TO_STATUS: Record<Direction, Status> = {
  left: 'pass',
  right: 'watch',
  up: 'fav',
  down: 'seen',
};

const STAMP_LABEL: Record<Direction, string> = {
  left: 'COUPÉ',
  right: 'PROJETÉ',
  up: 'PALMÉ',
  down: 'ARCHIVÉ',
};

const STAMP_COLOR: Record<Direction, string> = {
  left: colors.pass,
  right: colors.watch,
  up: colors.fav,
  down: colors.seen,
};

export default function DiscoverScreen() {
  const { queue, loading, error, next, refill } = useTmdbDiscover();
  const { state, setStatus, setPrefs } = useLibrary();
  const [sessionCount, setSessionCount] = useState(0);
  const showHint = !state.prefs.tutorialSeen;

  const dismissHint = useCallback(() => {
    setPrefs({ tutorialSeen: true });
  }, [setPrefs]);

  const top = queue[0];
  const second = queue[1];
  const third = queue[2];

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  useEffect(() => {
    tx.value = 0;
    ty.value = 0;
  }, [top?.id, tx, ty]);

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, []);

  const handleCommit = useCallback(
    (movieId: number, direction: Direction) => {
      setStatus(movieId, DIRECTION_TO_STATUS[direction]);
      setSessionCount((c) => c + 1);
      if (!state.prefs.tutorialSeen) setPrefs({ tutorialSeen: true });
      next();
    },
    [setStatus, next, state.prefs.tutorialSeen, setPrefs],
  );

  const eject = useCallback(
    (movieId: number, direction: Direction) => {
      const targetX = direction === 'left' ? -SCREEN_W * 1.5 : direction === 'right' ? SCREEN_W * 1.5 : 0;
      const targetY = direction === 'up' ? -SCREEN_H : direction === 'down' ? SCREEN_H : 0;
      tx.value = withTiming(targetX, { duration: 280, easing: SWIPE_EASING }, (finished) => {
        'worklet';
        if (finished) {
          runOnJS(triggerHaptic)();
          runOnJS(handleCommit)(movieId, direction);
        }
      });
      ty.value = withTiming(targetY, { duration: 280, easing: SWIPE_EASING });
    },
    [handleCommit, triggerHaptic, tx, ty],
  );

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
    })
    .onEnd((e) => {
      const ax = Math.abs(e.translationX);
      const ay = Math.abs(e.translationY);
      const vx = Math.abs(e.velocityX);
      const vy = Math.abs(e.velocityY);
      const movieId = top?.id;
      if (!movieId) return;

      if (ax > THRESHOLD || vx > VELOCITY_THRESHOLD) {
        const direction: Direction = e.translationX > 0 ? 'right' : 'left';
        runOnJS(eject)(movieId, direction);
        return;
      }
      if (ay > THRESHOLD || vy > VELOCITY_THRESHOLD) {
        const direction: Direction = e.translationY > 0 ? 'down' : 'up';
        runOnJS(eject)(movieId, direction);
        return;
      }
      tx.value = withSpring(0, { damping: 18, stiffness: 200 });
      ty.value = withSpring(0, { damping: 18, stiffness: 200 });
    });

  const topCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${tx.value * 0.06}deg` },
    ],
    opacity: interpolate(Math.max(Math.abs(tx.value), Math.abs(ty.value)), [0, 200], [1, 0.6], Extrapolation.CLAMP),
  }));

  const secondCardStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.max(Math.abs(tx.value), Math.abs(ty.value)) / 200);
    return {
      transform: [
        { scale: interpolate(progress, [0, 1], [0.94, 1], Extrapolation.CLAMP) },
        { translateY: interpolate(progress, [0, 1], [-8, 0], Extrapolation.CLAMP) },
      ],
    };
  });

  const thirdCardStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, Math.max(Math.abs(tx.value), Math.abs(ty.value)) / 200);
    return {
      transform: [
        { scale: interpolate(progress, [0, 1], [0.88, 0.94], Extrapolation.CLAMP) },
        { translateY: interpolate(progress, [0, 1], [-16, -8], Extrapolation.CLAMP) },
      ],
    };
  });

  const stampRightStyle = useAnimatedStyle(() => ({
    opacity: tx.value > 0 ? interpolate(tx.value, [60, 160], [0, 1], Extrapolation.CLAMP) : 0,
  }));
  const stampLeftStyle = useAnimatedStyle(() => ({
    opacity: tx.value < 0 ? interpolate(-tx.value, [60, 160], [0, 1], Extrapolation.CLAMP) : 0,
  }));
  const stampUpStyle = useAnimatedStyle(() => ({
    opacity:
      ty.value < 0 && Math.abs(ty.value) > Math.abs(tx.value)
        ? interpolate(-ty.value, [60, 160], [0, 1], Extrapolation.CLAMP)
        : 0,
  }));
  const stampDownStyle = useAnimatedStyle(() => ({
    opacity:
      ty.value > 0 && Math.abs(ty.value) > Math.abs(tx.value)
        ? interpolate(ty.value, [60, 160], [0, 1], Extrapolation.CLAMP)
        : 0,
  }));

  if (error) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <EmptyState title="Erreur" subtitle={error} />
        <Pressable style={styles.refill} onPress={refill}>
          <Text style={styles.refillText}>RECHARGER</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (queue.length === 0) {
    if (loading) {
      return (
        <SafeAreaView style={styles.root} edges={['top']}>
          <EmptyState title="Chargement…" />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <EmptyState title="FIN" subtitle="Générique de fin — Une production Clap', Réalisée par toi." />
        <Pressable style={styles.refill} onPress={refill}>
          <Text style={styles.refillText}>RECHARGER LA BOBINE</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.masthead}>
        <Text style={styles.mastheadSide} numberOfLines={1}>N° {String(127 + sessionCount).padStart(4, '0')}</Text>
        <Text style={styles.mastheadCenter}>Clap'</Text>
        <Text style={[styles.mastheadSide, styles.mastheadRight]} numberOfLines={1}>{sessionCount} TICKETS</Text>
      </View>

      <View style={styles.stack}>
        {third && (
          <Animated.View key={`third-${third.id}`} style={[styles.cardLayer, thirdCardStyle]}>
            <MovieTicket movie={third} width={TICKET_W} index={3} onTap={false} />
          </Animated.View>
        )}
        {second && (
          <Animated.View key={`second-${second.id}`} style={[styles.cardLayer, secondCardStyle]}>
            <MovieTicket movie={second} width={TICKET_W} index={2} onTap={false} />
          </Animated.View>
        )}
        {top && (
          <GestureDetector gesture={pan}>
            <Animated.View key={`top-${top.id}`} style={[styles.cardLayer, topCardStyle]}>
              <MovieTicket movie={top} width={TICKET_W} index={1} onTap={false} />
            </Animated.View>
          </GestureDetector>
        )}

        <Animated.View pointerEvents="none" style={[styles.stampOverlay, stampRightStyle]}>
          <Text style={[styles.stampText, { color: STAMP_COLOR.right }]}>{STAMP_LABEL.right}</Text>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.stampOverlay, stampLeftStyle]}>
          <Text style={[styles.stampText, { color: STAMP_COLOR.left }]}>{STAMP_LABEL.left}</Text>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.stampOverlay, stampUpStyle]}>
          <Text style={[styles.stampText, { color: STAMP_COLOR.up }]}>{STAMP_LABEL.up}</Text>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.stampOverlay, stampDownStyle]}>
          <Text style={[styles.stampText, { color: STAMP_COLOR.down }]}>{STAMP_LABEL.down}</Text>
        </Animated.View>
      </View>

      {showHint && top && <HintOverlay onDismiss={dismissHint} sampleMovie={top} />}
    </SafeAreaView>
  );
}

const AUTO_DISMISS_MS = 14000;

function HintOverlay({ onDismiss, sampleMovie }: { onDismiss: () => void; sampleMovie: import('@/lib/tmdb').TmdbMovie }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onDismiss} statusBarTranslucent>
      <Pressable style={styles.hintBackdrop} onPress={onDismiss}>
        <View style={styles.hintLayout}>
          <View style={styles.hintTopBlock} pointerEvents="none">
            <Text style={styles.hintEyebrow}>BIENVENUE</Text>
            <Text style={styles.hintTitle}>Quatre gestes</Text>
            <Text style={styles.hintBody}>Regarde la carte se faire swiper. À ton tour ensuite.</Text>
          </View>
          <View style={styles.hintDemoBlock} pointerEvents="none">
            <TutorialDemo movie={sampleMovie} />
          </View>
          <View style={styles.hintBottomBlock} pointerEvents="none">
            <Text style={styles.hintDismiss}>Appuie n'importe où pour commencer</Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const DEMO_SEQUENCE = [
  { x: 110, y: 0, label: 'EN SALLE', color: colors.watch },
  { x: -110, y: 0, label: 'COUPÉ', color: colors.pass },
  { x: 0, y: -110, label: 'PALME', color: colors.fav },
  { x: 0, y: 110, label: 'ARCHIVES', color: colors.seen },
] as const;

function TutorialDemo({ movie }: { movie: import('@/lib/tmdb').TmdbMovie }) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const stampOpacity = useSharedValue(0);
  const [stamp, setStamp] = useState<{ label: string; color: string }>({ label: '', color: colors.watch });

  useEffect(() => {
    let i = 0;
    let cancelled = false;
    const easing = Easing.bezier(0.32, 0.72, 0, 1);
    const tick = () => {
      if (cancelled) return;
      const s = DEMO_SEQUENCE[i % DEMO_SEQUENCE.length];
      setStamp({ label: s.label, color: s.color });
      tx.value = withSequence(
        withTiming(s.x, { duration: 700, easing }),
        withDelay(200, withTiming(0, { duration: 400, easing })),
      );
      ty.value = withSequence(
        withTiming(s.y, { duration: 700, easing }),
        withDelay(200, withTiming(0, { duration: 400, easing })),
      );
      stampOpacity.value = withSequence(
        withTiming(1, { duration: 350 }),
        withDelay(300, withTiming(0, { duration: 350 })),
      );
      i += 1;
    };
    tick();
    const interval = setInterval(tick, 1700);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [tx, ty, stampOpacity]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${tx.value * 0.06}deg` },
    ],
  }));

  const stampStyle = useAnimatedStyle(() => ({ opacity: stampOpacity.value }));

  return (
    <View style={styles.demoWrap}>
      <Animated.View style={cardStyle}>
        <MovieTicket movie={movie} width={200} index={1} onTap={false} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.demoStamp, stampStyle]}>
        <Text style={[styles.demoStampText, { color: stamp.color }]}>{stamp.label}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  masthead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: MASTHEAD_H,
  },
  mastheadSide: { fontFamily: fonts.mono, fontSize: 9, color: colors.ink3, letterSpacing: 1, textTransform: 'uppercase', flex: 1 },
  mastheadRight: { textAlign: 'right' },
  mastheadCenter: { fontFamily: fonts.serifItalic, fontSize: 22, color: colors.gold, textAlign: 'center', flex: 1 },
  stack: { flex: 1, overflow: 'hidden' },
  cardLayer: { ...absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  stampOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  stampText: {
    fontFamily: fonts.serifBold,
    fontSize: 56,
    letterSpacing: 4,
    textShadowColor: '#000',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 0,
  },
  hintBackdrop: { flex: 1, backgroundColor: 'rgba(10,9,8,0.96)' },
  hintLayout: { flex: 1, paddingTop: 80, paddingBottom: 60, paddingHorizontal: spacing.xl },
  hintTopBlock: { alignItems: 'center', gap: spacing.s + 2 },
  hintEyebrow: { fontFamily: fonts.mono, fontSize: 11, color: colors.gold, letterSpacing: 4, textAlign: 'center' },
  hintTitle: { fontFamily: fonts.serifBold, fontSize: 38, color: colors.ink, textAlign: 'center', lineHeight: 44 },
  hintBody: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink2, textAlign: 'center', lineHeight: 22, marginTop: spacing.s, maxWidth: 300 },
  hintDemoBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', marginVertical: spacing.lg },
  hintBottomBlock: { alignItems: 'center' },
  hintDismiss: { fontFamily: fonts.mono, fontSize: 10, color: colors.ink3, letterSpacing: 2.4, textAlign: 'center', textTransform: 'uppercase' },
  demoWrap: { alignItems: 'center', justifyContent: 'center' },
  demoStamp: { position: 'absolute', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  demoStampText: { fontFamily: fonts.serifBold, fontSize: 40, letterSpacing: 3, textShadowColor: '#000', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 0 },
  refill: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.m,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 14,
  },
  refillText: { fontFamily: fonts.mono, color: colors.gold, fontSize: 11, letterSpacing: 1 },
});
