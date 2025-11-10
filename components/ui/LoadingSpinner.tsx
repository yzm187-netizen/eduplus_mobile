import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';

export default function LoadingSpinner({ label }: { label?: string }) {
  return (
    <View className="items-center justify-center py-10">
      <ActivityIndicator size="small" />
      {label ? <Text className="mt-2 text-neutral-500 dark:text-neutral-400">{label}</Text> : null}
    </View>
  );
}
