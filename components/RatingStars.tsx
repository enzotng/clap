import { useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { Star } from 'lucide-react-native';
import { colors, spacing } from '@/theme/tokens';

type Props = {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  interactive?: boolean;
};

const POP_EASING = Easing.bezier(0.34, 1.56, 0.64, 1);

export function RatingStars({ value, onChange, size = 24, interactive = false }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarItem key={i} index={i} value={value} size={size} interactive={interactive} onChange={onChange} />
      ))}
    </View>
  );
}

function StarItem({
  index,
  value,
  size,
  interactive,
  onChange,
}: {
  index: number;
  value: number;
  size: number;
  interactive: boolean;
  onChange?: (v: number) => void;
}) {
  const scale = useSharedValue(1);
  const filled = index <= value;
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPress = useCallback(() => {
    if (!interactive) return;
    scale.value = withSequence(
      withTiming(1.3, { duration: 100, easing: POP_EASING }),
      withTiming(1, { duration: 100, easing: POP_EASING }),
    );
    onChange?.(index);
  }, [interactive, index, onChange, scale]);

  return (
    <Pressable onPress={onPress} disabled={!interactive} hitSlop={4}>
      <Animated.View style={animatedStyle}>
        <Star size={size} color={filled ? colors.gold : colors.ink4} fill={filled ? colors.gold : 'transparent'} strokeWidth={1.6} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
});
