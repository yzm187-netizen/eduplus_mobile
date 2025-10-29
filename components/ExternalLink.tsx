import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Platform, Pressable, PressableProps } from 'react-native';

type Props = PressableProps & { href: string; children?: React.ReactNode };

export function ExternalLink({ href, onPress, children, ...rest }: Props) {
  const handlePress: NonNullable<PressableProps['onPress']> = async (e) => {
    onPress?.(e);
    if (e.defaultPrevented) return;
    if (Platform.OS !== 'web') {
      await WebBrowser.openBrowserAsync(href);
    } else {
      window.open(href, '_blank');
    }
  };

  return (
    <Pressable accessibilityRole="link" onPress={handlePress} {...rest}>
      {children}
    </Pressable>
  );
}
