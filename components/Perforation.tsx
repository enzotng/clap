import { View, StyleSheet } from 'react-native';

type Props = { color?: string; height?: number };

export function Perforation({ color = '#0A0908', height = 14 }: Props) {
  return (
    <View style={[styles.row, { height }]}>
      <View style={[styles.line, { borderTopColor: color }]} />
      <View style={[styles.notch, { backgroundColor: color, left: -8 }]} />
      <View style={[styles.notch, { backgroundColor: color, right: -8 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { justifyContent: 'center' },
  line: {
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  notch: {
    position: 'absolute',
    top: -1,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
