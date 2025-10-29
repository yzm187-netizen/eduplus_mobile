import { Text, View, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { signOut } from '@/services/auth';
import { CONFIG } from '@/utils/config';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center p-4 gap-3">
        <Text className="text-2xl font-bold mb-2">Profile</Text>
        <Text className="text-center text-gray-500">
          {CONFIG.USE_MOCK
            ? 'Demo mode is enabled. Sign-in is disabled.'
            : "You're not signed in."}
        </Text>
        {!CONFIG.USE_MOCK && (
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity className="bg-black dark:bg-white rounded-md py-3 px-6 mt-2">
              <Text className="text-white dark:text-black font-semibold">Sign In</Text>
            </TouchableOpacity>
          </Link>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center p-4 gap-2">
      <Text className="text-2xl font-bold mb-2">{user.name || 'User'}</Text>
      <Text className="text-gray-500">{user.email}</Text>
      <TouchableOpacity className="bg-gray-100 dark:bg-gray-800 rounded-md py-3 px-6 mt-4" onPress={signOut}>
        <Text className="font-semibold">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
