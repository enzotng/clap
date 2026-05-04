import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { radius } from '@/theme/tokens';

type Props = { width?: number };

export function MoviePosterSkeleton({ width = 100 }: Props) {
  const height = width * 1.5;
  return (
    <View style={[styles.card, { width }]}>
      <Skeleton width={width} height={height} borderRadius={radius.s} />
      <Skeleton width={width - 16} height={11} />
      <Skeleton width={width - 32} height={11} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 6 },
});
