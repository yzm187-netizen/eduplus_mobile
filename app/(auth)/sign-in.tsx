import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { BrandBanner } from '@/components/Brand';
import { useAuthStore } from '@/store/useAuthStore';
// Removed avatarUrl placeholder usage; rely on colored initials until user uploads an avatar.
import { Services } from '@/services/providers';
import { useRouter } from 'expo-router';
import { BannerHeader } from '@/components/BannerHeader';
import { getSavedAccounts, saveAccount, type SavedAccount } from '@/lib/credentials';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [emailFocused, setEmailFocused] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();

  // Load saved accounts on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const list = await getSavedAccounts();
      if (mounted) setAccounts(list);
    })();
    return () => { mounted = false; };
  }, []);

  const onSignIn = useCallback(async () => {
    if (loading) return; // guard against double taps
    if (!email || !password) return Alert.alert('Missing info', 'Enter email and password');
    setLoading(true);
    try {
  const user = await Services.auth.signIn(email.trim(), password.trim());
      setUser({ id: user.id, name: user.name, email: user.email, role: user.role });
      // Save credentials securely after successful sign-in (always)
      try { await saveAccount(email.trim(), password.trim()); setAccounts(await getSavedAccounts()); } catch {}
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
      <KeyboardAwareScrollView
        enableOnAndroid
        extraScrollHeight={90}
        enableAutomaticScroll
        style={{ position: 'relative', zIndex: 1 }}
        contentContainerStyle={{ paddingBottom: 80, flexGrow: 1, justifyContent: 'flex-start' }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner inside the scrollable content */}
        <BannerHeader
          height={224}
          backgroundMode="cover"
          backgroundAnchorY="top"
          rounded
          showText
          floating
          allowTouchesThrough
        />
        {/* Padded container for form content */}
        <View style={{ paddingHorizontal: 24 }}>
        {/* Card overlapping banner slightly */}
        <View className="w-full max-w-sm self-center -mt-12 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 pt-8 shadow-xl" style={{ position: 'relative', zIndex: 10 }}>

          <Text className="text-center text-3xl font-extrabold tracking-tight mt-2 mb-1 text-neutral-900 dark:text-white">Welcome back</Text>
          <Text className="text-center text-neutral-500 dark:text-neutral-400 mb-6">Sign in to your account</Text>

          {/* Email */}
          <View className="mb-2">
            <Text className="mb-2 text-sm text-neutral-700 dark:text-neutral-300">Email</Text>
            <TextInput
              className="border border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              ref={emailRef}
              autoCapitalize="none"
              autoComplete="email"
              textContentType={Platform.OS === 'ios' ? 'username' as any : undefined}
              importantForAutofill="yes"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={(t) => { setEmail(t); }}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
            {/* Inline dropdown suggestions on focus */}
            {emailFocused && accounts.length > 0 ? (
              <View style={{ position: 'absolute', left: 0, right: 0, top: 78, zIndex: 100 }} pointerEvents="box-none">
                <View
                  style={{
                    marginTop: 4,
                    borderRadius: 12,
                    backgroundColor: '#111827',
                    maxHeight: 200,
                    overflow: 'hidden',
                    position: 'relative',
                    borderWidth: 1,
                    borderColor: '#1f2937',
                    shadowColor: '#000',
                    shadowOpacity: 0.35,
                    shadowOffset: { width: 0, height: 8 },
                    shadowRadius: 16,
                    elevation: 12,
                  }}
                  pointerEvents="auto"
                >
                  {/* Pointer caret */}
                  <View
                    style={{
                      position: 'absolute',
                      top: -6,
                      left: 28,
                      width: 12,
                      height: 12,
                      backgroundColor: '#111827',
                      transform: [{ rotate: '45deg' }],
                      borderLeftWidth: 1,
                      borderTopWidth: 1,
                      borderColor: '#1f2937',
                    }}
                  />
                  <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
                    {accounts.map((a) => (
                      <TouchableOpacity key={a.email} onPress={() => { setEmail(a.email); setPassword(a.password); setEmailFocused(false); emailRef.current?.blur(); }}>
                        <Text style={{ color: 'white', paddingHorizontal: 16, paddingVertical: 12 }}>{a.email}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            ) : null}
          </View>

          {/* Password */}
          <View className="mb-2">
            <Text className="mb-2 text-sm text-neutral-700 dark:text-neutral-300">Password</Text>
            <TextInput
              className="border border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              placeholder="Your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType={Platform.OS === 'ios' ? 'password' as any : undefined}
              importantForAutofill="yes"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Show/Hide password only */}
          <View className="flex-row justify-end items-center mb-3">
            <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
              <Text className="text-xs text-neutral-600 dark:text-neutral-400">{showPassword ? 'Hide password' : 'Show password'}</Text>
            </TouchableOpacity>
          </View>

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
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
