import { memo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { posterUrl } from '@/lib/tmdb';
import { colors, fonts } from '@/theme/tokens';
import type { TmdbPersonSearchResult } from '@/lib/tmdb';

const AVATAR_SIZE = 80;

function PersonCardImpl({ person }: { person: TmdbPersonSearchResult }) {
  const profile = posterUrl(person.profile_path, 'w185');
  const onPress = useCallback(() => {
    router.push({ pathname: '/person/[id]', params: { id: String(person.id) } });
  }, [person.id]);

  return (
    <Pressable
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={person.name}
    >
      {profile ? (
        <Image source={{ uri: profile }} style={styles.avatar} contentFit="cover" transition={200} recyclingKey={profile} />
      ) : (
        <View style={[styles.avatar, styles.fallback]}>
          <Text style={styles.fallbackText}>{person.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <Text style={styles.name} numberOfLines={2}>{person.name}</Text>
    </Pressable>
  );
}

export const PersonCard = memo(PersonCardImpl);

const styles = StyleSheet.create({
  card: { width: AVATAR_SIZE, gap: 6, alignItems: 'center' },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, backgroundColor: colors.bg3 },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  fallbackText: { fontFamily: fonts.serifBold, color: colors.gold, fontSize: 28 },
  name: { fontFamily: fonts.sansMed, color: colors.ink2, fontSize: 11, textAlign: 'center' },
});
