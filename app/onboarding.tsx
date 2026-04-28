import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useLibrary } from '@/context/LibraryContext';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

export default function OnboardingStub() {
  const { setPrefs } = useLibrary();

  const skip = () => {
    setPrefs({ name: 'Cinéphile', preferredGenres: [], onboarded: true });
    router.replace('/(tabs)/discover');
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Onboarding (à venir)</Text>
      <Text style={styles.sub}>Stub temporaire. Le vrai onboarding arrive au jalon 6.5.</Text>
      <Pressable style={styles.btn} onPress={skip}>
        <Text style={styles.btnText}>Passer (dev)</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  title: { color: colors.ink, fontSize: 22, fontFamily: fonts.serifBold },
  sub: { color: colors.ink2, fontSize: 13, textAlign: 'center', fontFamily: fonts.sans },
  btn: { paddingHorizontal: spacing.md, paddingVertical: spacing.m, borderWidth: 1, borderColor: colors.gold, borderRadius: radius.m },
  btnText: { color: colors.gold, fontFamily: fonts.mono, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
});
