import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Clapperboard } from 'lucide-react-native';
import { colors, fonts } from '@/theme/tokens';

const SPRING = { damping: 8, stiffness: 90 };

export function ClapSplash({ onDone }: { onDone?: () => void }) {
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const clapRotation = useSharedValue(-30);
  const clapScale = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 380 });
    logoScale.value = withSpring(1, SPRING);
    clapScale.value = withDelay(120, withSpring(1, SPRING));
    clapRotation.value = withDelay(
      300,
      withSequence(
        withTiming(0, { duration: 180, easing: Easing.bezier(0.32, 0, 0.2, 1) }),
        withTiming(-6, { duration: 80 }),
        withTiming(0, { duration: 100 }),
      ),
    );
    const t = setTimeout(() => onDone?.(), 1200);
    return () => clearTimeout(t);
  }, [logoOpacity, logoScale, clapScale, clapRotation, onDone]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const clapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: clapScale.value }, { rotate: `${clapRotation.value}deg` }],
  }));

  return (
    <Animated.View exiting={FadeOut.duration(280)} style={styles.root}>
      <Animated.Text style={[styles.logo, logoStyle]}>Clap'</Animated.Text>
      <Animated.View style={clapStyle}>
        <Clapperboard size={48} color={colors.gold} strokeWidth={1.8} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    zIndex: 1000,
  },
  logo: { fontFamily: fonts.serifItalic, fontSize: 96, color: colors.gold },
});
