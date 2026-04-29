import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '@/theme/tokens';

function GenreChipImpl({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export const GenreChip = memo(GenreChipImpl);

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line2,
    backgroundColor: colors.bg2,
  },
  text: { fontFamily: fonts.sansMed, color: colors.ink2, fontSize: 11, letterSpacing: 0.4 },
});
