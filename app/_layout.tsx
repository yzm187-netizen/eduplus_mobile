import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// Using a simple View fallback gradient (replace with expo-linear-gradient if installed)
import { View } from 'react-native';
import { Logo } from '@/components/Brand';
import 'react-native-reanimated';
// Ensure NativeWind runtime is initialized early
import 'nativewind';
// Import Tailwind CSS for NativeWind (safe under app/; not treated as a route)
import './globals.css';

import { useColorScheme } from '@/components/useColorScheme';
import { useSettingsStore } from '@/store/useSettingsStore';
import { QueryProvider } from '@/providers/QueryProvider';
import { useAuthInit } from '@/hooks/useAuthInit';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const system = useColorScheme();
  const theme = useSettingsStore((s) => s.theme);
  useAuthInit();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Global brand gradient background (CSS-like fallback) */}
      <View style={{ position:'absolute', inset:0, backgroundColor:'#2B0D52' }} />
      <View style={{ position:'absolute', left:-80, top:80, width:240, height:240, borderRadius:120, backgroundColor:'rgba(0,175,200,0.35)' }} />
      <QueryProvider>
        <ThemeProvider value={(theme === 'dark' || (theme === 'system' && system === 'dark')) ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
