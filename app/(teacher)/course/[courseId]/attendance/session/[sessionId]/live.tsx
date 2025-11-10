import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import Button from '@/components/ui/Button';
import { Services } from '@/services/providers';

export default function LiveSessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const sid = String(sessionId);
  const [token, setToken] = useState<{ code: string; expiresAt: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try { setToken(await Services.attendance.createToken?.(sid) || null); } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [sid]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black p-4">
      <Text className="text-2xl font-extrabold mb-4">Live Session</Text>
      {token ? (
        <View className="gap-4">
          <View className="rounded-2xl p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 items-center">
            <Text className="text-neutral-500 dark:text-neutral-400 mb-2">QR Token</Text>
            <Text className="text-3xl font-black tracking-wider">{token.code}</Text>
            <Text className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Expires {new Date(token.expiresAt).toLocaleTimeString()}</Text>
          </View>
          <Button title={loading ? 'Refreshing…' : 'Refresh Token'} onPress={refresh} loading={loading} />
        </View>
      ) : <Text className="text-neutral-500 dark:text-neutral-400">Generating token…</Text>}
    </SafeAreaView>
  );
}
