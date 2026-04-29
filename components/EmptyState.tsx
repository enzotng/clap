import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '@/theme/tokens';

type Props = { title: string; subtitle?: string };

export function EmptyState({ title, subtitle }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.sub}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.s },
  title: { fontFamily: fonts.serifBold, color: colors.ink, fontSize: 20, textAlign: 'center' },
  sub: { fontFamily: fonts.sans, color: colors.ink3, fontSize: 13, textAlign: 'center' },
});
