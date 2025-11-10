import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { WebView } from 'react-native-webview';

export default function PdfViewerScreen() {
  const { url, title } = useLocalSearchParams<{ url?: string; title?: string }>();
  const src = typeof url === 'string' ? url : undefined;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: (title as string) || 'Document' }} />
      {src ? (
        <WebView source={{ uri: src }} startInLoadingState renderLoading={() => (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator />
          </View>
        )} />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {/* Minimal empty state to keep this screen self-contained */}
        </View>
      )}
    </View>
  );
}
