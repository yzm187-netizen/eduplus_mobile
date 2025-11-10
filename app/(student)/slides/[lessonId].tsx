import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Services } from '@/services/providers';
import Slides from '@/components/Slides';

export default function SlidesViewerScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const [deck, setDeck] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      setDeck(await Services.content.getDeck(String(lessonId)));
    })();
  }, [lessonId]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      {!deck ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-neutral-500">Loading slides…</Text>
        </View>
      ) : (
        <Slides deck={deck} />
      )}
    </SafeAreaView>
  );
}
