import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0908',
          borderTopColor: '#2A2724',
        },
        tabBarActiveTintColor: '#D4A547',
        tabBarInactiveTintColor: '#7C7468',
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Découvrir',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>◧</Text>,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Recherche',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⌕</Text>,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Bibliothèque',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>▤</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>○</Text>,
        }}
      />
    </Tabs>
  );
}
