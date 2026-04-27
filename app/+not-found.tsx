import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function NotFound() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>404 - Coupé au montage</Text>
      <Link href="/(tabs)/discover" style={styles.link}>Retour à l'accueil</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0908', alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { color: '#F4EFE6', fontSize: 22 },
  link: { color: '#D4A547', fontSize: 14 },
});
