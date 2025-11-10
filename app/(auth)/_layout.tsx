import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  // Provide a proper Stack for auth routes so the sign-in screen renders
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false }} />
    </Stack>
  );
}
