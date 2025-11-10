import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, Image } from 'react-native';
import { courseBanner } from '@/utils/imagePlaceholders';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentScannerScreen() {
  const [code, setCode] = useState('');

  const onFakeScan = () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    Alert.alert('Scanned', `Code: ${trimmed}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      <View className="px-4 pt-4">
        <Text className="text-2xl font-extrabold mb-2">Scanner</Text>
  <Text className="text-neutral-500 dark:text-neutral-400 mb-4">Mock scan: paste or type a code to simulate scanning.</Text>

        {/* Illustration */}
        <View className="mb-4 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 items-center">
          <Image source={{ uri: courseBanner('Scan QR', 1200, 360) }} style={{ width: '100%', height: 120 }} resizeMode="cover" />
        </View>

        <View className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <Text className="font-semibold mb-2">Enter sample code</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="e.g. EDU-ABC-123"
            placeholderTextColor="#9CA3AF"
            className="rounded-xl px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 mb-3"
          />
          <Pressable onPress={onFakeScan} className="px-4 py-2 rounded-xl bg-[#00AFC8] self-start">
            <Text className="text-white font-semibold">Simulate scan</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}