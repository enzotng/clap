import { memo, useMemo } from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { posterUrl } from '@/lib/tmdb';
import { colors, fonts, radius } from '@/theme/tokens';

type Props = {
  path: string | null;
  size?: 'w185' | 'w500' | 'w780';
  width?: number;
  title?: string;
  style?: ViewStyle;
};

function MoviePosterImpl({ path, size = 'w500', width = 120, title, style }: Props) {
  const url = posterUrl(path, size);
  const height = width * 1.5;
  const containerStyle = useMemo(() => [styles.container, { width, height }, style], [width, height, style]);
  const imageStyle = useMemo(() => ({ width, height }), [width, height]);
  return (
    <View style={containerStyle}>
      {url ? (
        <Image source={{ uri: url }} style={imageStyle} contentFit="cover" transition={200} recyclingKey={url} />
      ) : (
        <View style={styles.fallback}>
          <Text style={styles.fallbackText} numberOfLines={3}>{title ?? '?'}</Text>
        </View>
      )}
    </View>
  );
}

export const MoviePoster = memo(MoviePosterImpl);

const styles = StyleSheet.create({
  container: { backgroundColor: colors.bg3, borderRadius: radius.s, overflow: 'hidden' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 8 },
  fallbackText: { fontFamily: fonts.serifBold, fontSize: 14, color: colors.ink2, textAlign: 'center' },
});
