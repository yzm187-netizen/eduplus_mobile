import React from 'react';
import { Pressable, Text, ActivityIndicator, ViewStyle } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  size?: Size;
  style?: ViewStyle;
};

const base = 'rounded-2xl items-center justify-center';
const sizes: Record<Size, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-5 py-4',
};
const variants: Record<Variant, { enabled: string; disabled: string; text: string; textDisabled: string }> = {
  primary: {
    enabled: 'bg-[#00AFC8]',
    disabled: 'bg-neutral-400',
    text: 'text-white',
    textDisabled: 'text-white',
  },
  secondary: {
    enabled: 'bg-neutral-100 dark:bg-neutral-800',
    disabled: 'bg-neutral-200 dark:bg-neutral-800/60',
    text: 'text-neutral-800 dark:text-neutral-100',
    textDisabled: 'text-neutral-500 dark:text-neutral-400',
  },
  ghost: {
    enabled: 'bg-transparent',
    disabled: 'bg-transparent',
    text: 'text-[#00AFC8]',
    textDisabled: 'text-neutral-400',
  },
  danger: {
    enabled: 'bg-rose-600',
    disabled: 'bg-neutral-400',
    text: 'text-white',
    textDisabled: 'text-white',
  },
};

export default function Button({ title, onPress, disabled, loading, variant = 'primary', size = 'md' }: Props) {
  const v = variants[variant];
  const stateCls = disabled || loading ? v.disabled : v.enabled;
  const textCls = disabled || loading ? v.textDisabled : v.text;
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} className={`${base} ${sizes[size]} ${stateCls}`}>
      {loading ? <ActivityIndicator color={textCls.includes('white') ? '#fff' : undefined} /> : <Text className={`font-semibold ${textCls}`}>{title}</Text>}
    </Pressable>
  );
}
