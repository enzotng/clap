import { Tabs } from 'expo-router';
import { Clapperboard, Search, Library, User } from 'lucide-react-native';
import { colors, fonts } from '@/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.line,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.mono,
          fontSize: 9,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.ink3,
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Découvrir',
          tabBarIcon: ({ color }) => <Clapperboard size={20} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Recherche',
          tabBarIcon: ({ color }) => <Search size={20} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Bibliothèque',
          tabBarIcon: ({ color }) => <Library size={20} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <User size={20} color={color} strokeWidth={1.8} />,
        }}
      />
    </Tabs>
  );
}
