import { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, STATUS_COLORS, STATUS_LABELS, type Status } from '@/theme/tokens';

function StatusBadgeImpl({ status }: { status: Status }) {
  const c = STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { borderColor: c }]}>
      <Text style={[styles.text, { color: c }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

export const StatusBadge = memo(StatusBadgeImpl);

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderRadius: 999, backgroundColor: colors.bg },
  text: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 0.6, textTransform: 'uppercase' },
});
