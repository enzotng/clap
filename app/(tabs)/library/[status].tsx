import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function LibraryStatus() {
  const { status } = useLocalSearchParams<{ status: string }>();
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Statut : {status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0908', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#F4EFE6', fontSize: 22 },
});
