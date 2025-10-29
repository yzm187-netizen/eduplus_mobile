import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSignIn = async () => {
    if (!email || !password) return Alert.alert('Missing info', 'Enter email and password');
    // No backend wired yet: show a friendly placeholder
    Alert.alert('Not connected', 'Auth will be hooked up here once configured.');
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      {/* Top accent background */}
      <View className="absolute top-0 left-0 right-0 h-56 bg-emerald-600 dark:bg-emerald-700 rounded-b-3xl" />

      <View className="flex-1 items-center justify-center px-6">
        {/* Card */}
        <View className="w-full max-w-sm rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 pt-8 shadow-xl">
          {/* Overlapping logo bubble */}
          <View className="absolute -top-8 self-center h-16 w-16 rounded-2xl bg-white dark:bg-neutral-900 items-center justify-center shadow-lg border border-neutral-200 dark:border-neutral-800">
            <Text className="text-emerald-600 font-extrabold text-xl">E+</Text>
          </View>

          <Text className="text-center text-3xl font-extrabold tracking-tight mt-2 mb-1">Welcome back</Text>
          <Text className="text-center text-neutral-500 dark:text-neutral-400 mb-6">Sign in to your account</Text>

          {/* Email */}
          <View className="mb-4">
            <Text className="mb-2 text-sm text-neutral-600 dark:text-neutral-300">Email</Text>
            <TextInput
              className="border border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-3 bg-white dark:bg-neutral-800"
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
            <Text className="mb-2 text-sm text-neutral-600 dark:text-neutral-300">Password</Text>
            <TextInput
              className="border border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-3 bg-white dark:bg-neutral-800"
              placeholder="Your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Show password toggle */}
          <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
            <Text className="text-right text-xs text-neutral-500 mb-3">{showPassword ? 'Hide password' : 'Show password'}</Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            className="bg-emerald-600 dark:bg-emerald-500 rounded-lg py-3 items-center mb-2 disabled:opacity-60"
            disabled={loading}
            onPress={onSignIn}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold">Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Secondary link placeholders */}
          <View className="flex-row justify-between mt-2">
            <TouchableOpacity onPress={() => Alert.alert('Forgot password', 'Not implemented yet')}>
              <Text className="text-sm text-neutral-600 dark:text-neutral-300">Forgot password?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert('Sign up', 'Sign up flow coming soon')}>
              <Text className="text-sm text-emerald-600">Create account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
