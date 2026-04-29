import { Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing } from '@/theme/tokens';

export function SectionHeader({ children }: { children: string }) {
  return <Text style={styles.h}>{children}</Text>;
}

const styles = StyleSheet.create({
  h: {
    fontFamily: fonts.mono,
    color: colors.ink3,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginVertical: spacing.s,
  },
});
