import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Asset } from 'expo-asset';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// Using a simple View fallback gradient (replace with expo-linear-gradient if installed)
import { View, LogBox } from 'react-native';
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
  // Attempt normal vector icon font load; fallback to explicit require if needed
  const [loaded, error] = useFonts(
    FontAwesome?.font && Object.keys(FontAwesome.font).length
      ? { ...FontAwesome.font }
      : {
          FontAwesome: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf'),
        }
  );

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Silence noisy third-party warnings while we migrate away from legacy Swipeable
  useEffect(() => {
    LogBox.ignoreLogs([
      'Animated: `useNativeDriver` was not specified',
      'Move code with side effects to componentDidMount',
      'componentWillMount has been renamed',
    ]);
  }, []);

  // Preload key banner images in the background (do not block splash)
  useEffect(() => {
    (async () => {
      try {
        const imgs = [
          require('@/assets/images/EduPlus_Banner_background.png'),
          require('@/assets/images/EduPlus_Banner_background_red.png'),
          require('@/assets/images/EduPlus_Banner_background_green.png'),
          require('@/assets/images/EduPlus_Banner_background_purple.png'),
        ];
        await Promise.all(imgs.map((m) => Asset.fromModule(m).downloadAsync()));
      } catch {}
    })();
  }, []);

  if (!loaded) return null; // keep splash until fonts ready

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
