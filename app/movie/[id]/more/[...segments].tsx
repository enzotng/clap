import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

export default function MovieMore() {
  const { id, segments } = useLocalSearchParams<{ id: string; segments: string[] }>();
  return (
    <View style={styles.root}>
      <Text style={styles.title}>movie/{id}/more</Text>
      <Text style={styles.body}>segments : {JSON.stringify(segments)}</Text>
      <Pressable style={styles.btn} onPress={() => router.back()}>
        <Text style={styles.btnText}>Retour</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0908', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { color: '#F4EFE6', fontSize: 22 },
  body: { color: '#B8AFA1', fontSize: 14, textAlign: 'center' },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#D4A547', borderRadius: 14 },
  btnText: { color: '#D4A547' },
});
