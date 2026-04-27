import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';

export default function DiscoverScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Découvrir</Text>
      <Link href={{ pathname: '/movie/[id]', params: { id: '550' } }} asChild>
        <Pressable style={styles.btn}>
          <Text style={styles.btnText}>Ouvrir un film de test (id 550)</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0908', alignItems: 'center', justifyContent: 'center', gap: 16 },
  title: { color: '#F4EFE6', fontSize: 28 },
  btn: { paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#D4A547', borderRadius: 14 },
  btnText: { color: '#D4A547', fontSize: 14 },
});
