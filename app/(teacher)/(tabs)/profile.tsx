import { View, Text, Pressable } from 'react-native'
import React from 'react'
import { Services } from '@/services/providers'
import { useRouter } from 'expo-router'

const profile = () => {
  const router = useRouter();
  return (
    <View className="flex-1 bg-[#0E021F] p-4">
      <Text className="text-white text-2xl font-bold mb-4">Profile</Text>
      <Pressable
        onPress={async () => { try { await Services.auth.signOut(); } finally { router.replace('/(auth)/sign-in' as any); } }}
        className="w-full rounded-2xl p-4 bg-red-600 items-center"
      >
        <Text className="text-white font-semibold">Sign Out</Text>
      </Pressable>
    </View>
  )
}

export default profile
