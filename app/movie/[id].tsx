import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, Link, router } from 'expo-router';

export default function MovieDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Détail film #{id}</Text>
      <Link
        href={{ pathname: '/movie/[id]/more/[...segments]', params: { id, segments: ['cast', '1'] } }}
        asChild
      >
        <Pressable style={styles.btn}>
          <Text style={styles.btnText}>Voir un membre du casting (test [...params])</Text>
        </Pressable>
      </Link>
      <Pressable style={styles.btn} onPress={() => router.back()}>
        <Text style={styles.btnText}>Fermer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0908', alignItems: 'center', justifyContent: 'center', gap: 16 },
  title: { color: '#F4EFE6', fontSize: 24 },
  btn: { paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#D4A547', borderRadius: 14 },
  btnText: { color: '#D4A547', fontSize: 14 },
});
