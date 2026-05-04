import { memo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { posterUrl } from '@/lib/tmdb';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import type { TmdbPersonSearchResult } from '@/lib/tmdb';

const ROLE_LABELS: Record<string, string> = {
  Acting: 'Acteur·ice',
  Directing: 'Réalisation',
  Writing: 'Scénario',
  Production: 'Production',
  Sound: 'Son',
  Camera: 'Image',
  Editing: 'Montage',
  Art: 'Décors',
};

function PersonRowImpl({ person }: { person: TmdbPersonSearchResult }) {
  const profile = posterUrl(person.profile_path, 'w185');
  const role = ROLE_LABELS[person.known_for_department] ?? person.known_for_department;
  const knownTitles = person.known_for
    .map((m) => m.title)
    .filter(Boolean)
    .slice(0, 3)
    .join(' · ');

  const onPress = useCallback(() => {
    router.push({ pathname: '/person/[id]', params: { id: String(person.id) } });
  }, [person.id]);

  return (
    <Pressable
      onPress={onPress}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`${person.name}, ${role}`}
    >
      {profile ? (
        <Image source={{ uri: profile }} style={styles.avatar} contentFit="cover" transition={200} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarFallbackText}>{person.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.col}>
        <Text style={styles.name} numberOfLines={1}>{person.name}</Text>
        <Text style={styles.role}>{role}</Text>
        {knownTitles ? <Text style={styles.known} numberOfLines={2}>{knownTitles}</Text> : null}
      </View>
    </Pressable>
  );
}

export const PersonRow = memo(PersonRowImpl);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.m,
    backgroundColor: colors.bg2,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.bg3 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { fontFamily: fonts.serifBold, color: colors.gold, fontSize: 22 },
  col: { flex: 1, gap: 4 },
  name: { fontFamily: fonts.serifBold, color: colors.ink, fontSize: 16 },
  role: { fontFamily: fonts.mono, color: colors.gold, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  known: { fontFamily: fonts.sans, color: colors.ink2, fontSize: 12, lineHeight: 18 },
});
