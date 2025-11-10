import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

export default function PublicPersonProfileScreen() {
  const { pid } = useLocalSearchParams<{ pid: string }>();
  const id = String(pid);
  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      <View className="px-4 pt-4">
        <Text className="text-2xl font-extrabold mb-1">Profile</Text>
        <Text className="text-neutral-500 dark:text-neutral-400 mb-4">User: {id}</Text>

        <View className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 mb-4">
          <Text className="font-semibold mb-1">Public stats</Text>
          <Text className="text-neutral-500 dark:text-neutral-400">This mirrors the public portion of the user's profile. Detailed metrics are omitted in mock mode.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
