import React from 'react';
import { Text as RNText, TextProps } from 'react-native';

// Reverted to a simple passthrough Text to avoid font overrides.
export default function AppText(props: TextProps) {
  return <RNText {...props} />;
}
