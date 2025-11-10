import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { BrandBanner } from '@/components/Brand';
import { useAuthStore } from '@/store/useAuthStore';
import { avatarUrl } from '@/utils/imagePlaceholders';
import { Services } from '@/services/providers';
import { useRouter } from 'expo-router';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  const onSignIn = useCallback(async () => {
    if (loading) return; // guard against double taps
    if (!email || !password) return Alert.alert('Missing info', 'Enter email and password');
    setLoading(true);
    try {
  const user = await Services.auth.signIn(email.trim(), password.trim());
      setUser({ id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: avatarUrl(user.id, 128) });
      if (user.role === 'teacher' || user.role === 'admin') {
        router.replace('/(teacher)/(tabs)/home' as any);
      } else {
        router.replace('/(student)/(tabs)/home' as any);
      }
    } catch (e: any) {
      const msg = e?.message || '';
      if (/session is active/i.test(msg)) {
        Alert.alert('Already signed in', 'You already have an active session. Proceeding.');
        try {
          const user = useAuthStore.getState().user;
          if (user) {
            if (user.role === 'teacher' || user.role === 'admin') {
              router.replace('/(teacher)/(tabs)/home' as any);
            } else {
              router.replace('/(student)/(tabs)/home' as any);
            }
          }
        } catch {}
      } else if (/invalid credentials/i.test(msg)) {
        console.warn('Invalid credentials during sign-in');
        Alert.alert(
          'Invalid credentials',
          'Please double-check your email and password. If this persists, confirm the app is pointed to the right Appwrite project.'
        );
      } else {
        console.error('Sign-in failed', e);
        Alert.alert('Sign-in failed', msg || 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, loading, router, setUser]);

  // Live-only: remove mock sign-in path

  return (
  <SafeAreaView className="flex-1 bg-white dark:bg-[#0E021F]">
      {/* Header banner fills rounded rectangle */}
      <View className="absolute top-0 left-0 right-0 h-56 rounded-b-3xl overflow-hidden">
        {/* Background layer (fills entirely) */}
        {(() => {
          let bg: any;
          try { bg = require('../../assets/images/EduPlus_Banner_background.png'); } catch { bg = null; }
          return bg ? (
            <Image source={bg} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
          ) : null;
        })()}
        {/* Text/logo layer (contained with horizontal margins) */}
        {(() => {
          let textImg: any;
          try { textImg = require('../../assets/images/EduPlus_Banner_text.png'); } catch { textImg = null; }
          return textImg ? (
            <View className="absolute inset-0 px-6">
              <Image source={textImg} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
            </View>
          ) : null;
        })()}
      </View>

      <View className="flex-1 items-center justify-center px-6">
        {/* Card */}
  <View className="w-full max-w-sm rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 pt-8 shadow-xl">

          <Text className="text-center text-3xl font-extrabold tracking-tight mt-2 mb-1 text-neutral-900 dark:text-white">Welcome back</Text>
          <Text className="text-center text-neutral-500 dark:text-neutral-400 mb-6">Sign in to your account</Text>

          {/* Email */}
          <View className="mb-4">
            <Text className="mb-2 text-sm text-neutral-700 dark:text-neutral-300">Email</Text>
            <TextInput
              className="border border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <View className="mb-2">
            <Text className="mb-2 text-sm text-neutral-700 dark:text-neutral-300">Password</Text>
            <TextInput
              className="border border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              placeholder="Your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Show password toggle */}
          <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
            <Text className="text-right text-xs text-neutral-600 dark:text-neutral-400 mb-3">{showPassword ? 'Hide password' : 'Show password'}</Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            className="rounded-lg py-3 items-center mb-2 disabled:opacity-60"
            disabled={loading}
            onPress={onSignIn}
            style={{ backgroundColor: '#00AFC8' }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold">Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Secondary action: forgot password only (accounts provisioned by institution) */}
          <View className="flex-row justify-end mt-2">
            <TouchableOpacity onPress={() => Alert.alert('Forgot password', 'Contact your school administrator to reset your password.') }>
              <Text className="text-sm text-neutral-300">Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Live only: no mock sign-in */}
        </View>
      </View>
    </SafeAreaView>
  );
}
