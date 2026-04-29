import { memo } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, radius, STATUS_COLORS, type Status } from '@/theme/tokens';

type Props = {
  status: Status;
  label: string;
  active?: boolean;
  onPress?: () => void;
};

function StatusButtonImpl({ status, label, active, onPress }: Props) {
  const c = STATUS_COLORS[status];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { borderColor: c, backgroundColor: active ? c : 'transparent', opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[styles.label, { color: active ? colors.bg : c }]}>{label}</Text>
    </Pressable>
  );
}

export const StatusButton = memo(StatusButtonImpl);

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s,
    borderWidth: 1,
    borderRadius: radius.m,
  },
  label: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' },
});
