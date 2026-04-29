import { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

type Props = { width?: number; height?: number; count?: number; color?: string };

function BarcodeBarsImpl({ width = 200, height = 24, count = 30, color = '#0A0908' }: Props) {
  const bars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const seed = (i * 9301 + 49297) % 233280;
      return 0.4 + (seed / 233280) * 0.6;
    });
  }, [count]);

  return (
    <View style={[styles.row, { width, height }]}>
      {bars.map((r, i) => (
        <View
          key={i}
          style={{ width: width / count - 1, height: height * r, backgroundColor: color, marginRight: 1 }}
        />
      ))}
    </View>
  );
}

export const BarcodeBars = memo(BarcodeBarsImpl);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
});
