import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Services } from '@/services/providers';
import type { Notification } from '@/data/sample';
import { formatRelativeShort } from '@/utils/date';
import { BannerHeader } from '@/components/BannerHeader';

export default function AllNotificationsScreen() {
  const [items, setItems] = useState<Notification[]>([]);

  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setItems(await Services.notifications.list());
  }

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black">
      <BannerHeader>
        <View>
          <Text className="text-3xl font-extrabold text-white">Notifications</Text>
          <Text className="text-white/80 mt-1">Your recent updates</Text>
        </View>
      </BannerHeader>
      <ScrollView
        className="px-4"
        contentContainerStyle={{ paddingBottom: 32, paddingTop: 200 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="-mt-24 mb-4" />
        <View className="gap-3">
          {items.map((n) => (
            <View key={n.id} className="rounded-2xl p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <View className="flex-row justify-between items-start">
                <Text className="font-semibold mr-2 flex-1">{n.title}</Text>
                {typeof n.badges === 'number' && n.badges > 0 ? (
                  <View className="px-2 py-1 rounded-full bg-[#00AFC8]">
                    <Text className="text-white text-xs">{n.badges}</Text>
                  </View>
                ) : null}
              </View>
              {n.subtitle ? (
                <Text className="mt-1 text-neutral-500 dark:text-neutral-400">{n.subtitle}</Text>
              ) : null}
              <Text className="mt-2 text-xs text-neutral-400">{formatRelativeShort(n.createdAt)}</Text>
            </View>
          ))}
          {items.length === 0 && (
            <View className="rounded-2xl p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <Text className="text-neutral-500 dark:text-neutral-400">No notifications.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
