import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from './Skeleton';
import { colors, radius, spacing } from '@/theme/tokens';

const SCREEN_W = Dimensions.get('window').width;
const HERO_H = 280;

export function MovieDetailSkeleton() {
  return (
    <View style={styles.root}>
      <Skeleton width={SCREEN_W} height={HERO_H} borderRadius={0} />
      <View style={styles.headRow}>
        <Skeleton width={120} height={180} borderRadius={radius.s} />
        <View style={styles.headCol}>
          <Skeleton width="80%" height={26} />
          <Skeleton width="60%" height={12} />
          <View style={styles.chipsRow}>
            <Skeleton width={70} height={24} borderRadius={999} />
            <Skeleton width={70} height={24} borderRadius={999} />
          </View>
        </View>
      </View>
      <View style={styles.section}>
        <Skeleton width="20%" height={11} />
        <View style={styles.statusRow}>
          <Skeleton width={84} height={36} borderRadius={radius.m} />
          <Skeleton width={84} height={36} borderRadius={radius.m} />
          <Skeleton width={84} height={36} borderRadius={radius.m} />
          <Skeleton width={84} height={36} borderRadius={radius.m} />
        </View>
      </View>
      <View style={styles.section}>
        <Skeleton width="20%" height={11} />
        <Skeleton width="100%" height={15} />
        <Skeleton width="100%" height={15} />
        <Skeleton width="80%" height={15} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: -40,
    paddingHorizontal: spacing.md,
  },
  headCol: { flex: 1, gap: spacing.s, paddingTop: 30 },
  chipsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.lg, gap: spacing.s },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s },
});
