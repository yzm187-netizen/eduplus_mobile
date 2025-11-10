import React from 'react';
import { View, Text } from 'react-native';

type Props = { title: string; subtitle?: string; right?: React.ReactNode };

export default function SectionHeader({ title, subtitle, right }: Props) {
  return (
    <View className="flex-row items-center justify-between px-1 mb-2">
      <View className="flex-1 pr-3">
        <Text className="font-semibold text-lg" numberOfLines={1}>{title}</Text>
        {subtitle ? <Text className="text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}
