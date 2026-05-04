import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { colors, radius, spacing } from '@/theme/tokens';

export function MovieRowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={64} height={96} borderRadius={radius.s} />
      <View style={styles.col}>
        <Skeleton width="78%" height={16} />
        <Skeleton width="40%" height={11} />
        <Skeleton width="100%" height={12} />
        <Skeleton width="90%" height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.m,
    backgroundColor: colors.bg2,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'flex-start',
  },
  col: { flex: 1, gap: spacing.s },
});
