import { useEffect, useRef, useState, type ReactNode } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, router, usePathname } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Fraunces_400Regular, Fraunces_500Medium, Fraunces_600SemiBold, Fraunces_400Regular_Italic } from '@expo-google-fonts/fraunces';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { LibraryProvider, useLibraryHydrated, useUserPrefs } from '@/context/LibraryContext';
import { ClapSplash } from '@/components/ClapSplash';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

function HydrationGate({ children }: { children: ReactNode }) {
  const hydrated = useLibraryHydrated();
  const prefs = useUserPrefs();
  const pathname = usePathname();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!hydrated) return;
    if (prefs.onboarded) return;
    if (pathname === '/onboarding') return;
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    router.replace('/onboarding');
  }, [hydrated, prefs.onboarded, pathname]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_400Regular_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    JetBrainsMono_500Medium,
  });
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <LibraryProvider>
        <HydrationGate>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
            <Stack.Screen
              name="movie/[id]"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen name="person/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </HydrationGate>
      </LibraryProvider>
      {!splashDone && <ClapSplash onDone={() => setSplashDone(true)} />}
    </GestureHandlerRootView>
  );
}
