import React from 'react';
import { View, ViewProps } from 'react-native';

type Props = ViewProps & { padded?: boolean; inset?: boolean };

export default function Card({ style, children, padded = true, inset = false, ...rest }: Props) {
  return (
    <View
      {...rest}
      className={`rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 ${padded ? 'p-4' : ''} ${inset ? 'mx-3' : ''}`}
      style={style}
    >
      {children}
    </View>
  );
}
