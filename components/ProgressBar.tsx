import React from 'react';
import { View } from 'react-native';

type Props = {
  value: number;
  variant?: 'default' | 'onDark';
};

export default function ProgressBar({ value, variant = 'default' }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const containerClass =
    variant === 'onDark'
      ? 'h-2 w-full bg-white/30 rounded-full overflow-hidden'
      : 'h-2 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden';
  // Unified green progress fill to reduce confusion with white fill on dark backgrounds
  const fillClass = variant === 'onDark' ? 'h-full bg-green-500' : 'h-full bg-green-500';

  return (
    <View className={containerClass}>
      <View style={{ width: `${pct}%` }} className={fillClass} />
    </View>
  );
}
