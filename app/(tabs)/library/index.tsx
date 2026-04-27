import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';

const STATUSES = ['watch', 'seen', 'fav', 'pass'] as const;

export default function LibraryIndex() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Bibliothèque</Text>
      {STATUSES.map((s) => (
        <Link key={s} href={{ pathname: '/library/[status]', params: { status: s } }} asChild>
          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>{s}</Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0908', alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { color: '#F4EFE6', fontSize: 28, marginBottom: 16 },
  btn: { paddingHorizontal: 24, paddingVertical: 10, borderWidth: 1, borderColor: '#2A2724', borderRadius: 14, minWidth: 200, alignItems: 'center' },
  btnText: { color: '#F4EFE6', fontSize: 16 },
});
