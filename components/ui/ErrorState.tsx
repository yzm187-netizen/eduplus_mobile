import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ErrorState({ title = 'Something went wrong', subtitle = 'Please try again or pull to refresh.' }: { title?: string; subtitle?: string }) {
  return (
    <View className="items-center justify-center py-10">
      <Ionicons name="alert-circle-outline" size={36} color="#ef4444" />
      <Text className="mt-3 text-neutral-700 dark:text-neutral-100 font-medium">{title}</Text>
      <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 text-center px-6">{subtitle}</Text>
    </View>
  );
}
