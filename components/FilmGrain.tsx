import { View, StyleSheet } from 'react-native';

// Stub: SVG fractalNoise overlay non-trivial in RN. Real implementation deferred
// to jalon 12 polish if time allows (could use a precomputed PNG repeat).
export function FilmGrain() {
  return <View style={styles.overlay} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
