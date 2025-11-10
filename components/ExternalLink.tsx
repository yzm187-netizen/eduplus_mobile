import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Platform, Pressable, PressableProps } from 'react-native';

type Props = PressableProps & { href: string; children?: React.ReactNode };


// DEPRECATED: ExternalLink is not used; safe to delete. Kept as a no-op wrapper to avoid breaking imports.
export function ExternalLink({ children }: { href: string; children?: React.ReactNode }) {
  return <></>;
}
