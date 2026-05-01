import { Tabs } from 'expo-router';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { LinearTransition, FadeIn, FadeOut, Easing } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Clapperboard, Search, Library, User } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, fonts } from '@/theme/tokens';

type TabBarRoute = { key: string; name: string; params?: object };
type TabBarProps = {
  state: { index: number; routes: TabBarRoute[] };
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
};

const TAB_HEIGHT = 64;

const META: Record<string, { label: string; Icon: LucideIcon }> = {
  discover: { label: 'Découvrir', Icon: Clapperboard },
  search: { label: 'Recherche', Icon: Search },
  library: { label: 'Bibliothèque', Icon: Library },
  profile: { label: 'Profil', Icon: User },
};

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

function FloatingTabBar({ state, navigation }: TabBarProps) {
  return (
    <View style={styles.tabBar}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={70} tint="dark" style={styles.bg} />
      ) : (
        <View style={[styles.bg, { backgroundColor: 'rgba(18,17,16,0.96)' }]} />
      )}
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const meta = META[route.name];
          if (!meta) return null;
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };
          return (
            <Animated.View
              key={route.key}
              layout={LinearTransition.duration(320).easing(Easing.bezier(0.16, 1, 0.3, 1))}
              style={focused ? styles.itemActive : styles.itemInactive}
            >
              <Pressable onPress={onPress} style={styles.itemInner} hitSlop={8}>
                <meta.Icon size={20} color={focused ? colors.gold : colors.ink3} strokeWidth={1.8} />
                {focused && (
                  <Animated.Text
                    entering={FadeIn.duration(180).delay(80)}
                    exiting={FadeOut.duration(120)}
                    style={styles.label}
                    numberOfLines={1}
                  >
                    {meta.label}
                  </Animated.Text>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    height: TAB_HEIGHT,
    borderRadius: TAB_HEIGHT / 2,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  bg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(18,17,16,0.55)' },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 4 },
  itemInactive: { width: 44, height: 44 },
  itemActive: { flex: 1, height: 44, backgroundColor: 'rgba(212,165,71,0.16)', borderRadius: 22 },
  itemInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0.8,
    color: colors.gold,
    textTransform: 'uppercase',
  },
});
