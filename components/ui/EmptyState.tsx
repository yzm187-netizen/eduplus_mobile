import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EmptyState({ title = 'Nothing here yet', subtitle = 'Check back later or adjust your filters.' }: { title?: string; subtitle?: string }) {
  return (
    <View className="items-center justify-center py-10">
      <Ionicons name="folder-open-outline" size={36} color="#9ca3af" />
      <Text className="mt-3 text-neutral-600 dark:text-neutral-300 font-medium">{title}</Text>
      <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 text-center px-6">{subtitle}</Text>
    </View>
  );
}
