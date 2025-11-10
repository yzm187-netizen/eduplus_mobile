import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUpInfo() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center px-6 bg-neutral-50 dark:bg-black">
      <View className="w-full max-w-sm rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <Text className="text-xl font-bold mb-2">Accounts are provisioned</Text>
        <Text className="text-neutral-600 dark:text-neutral-300">
          Student and teacher accounts are created by your school administrator. If you don't have an account yet,
          please contact your institution to request access.
        </Text>
      </View>
    </SafeAreaView>
  );
}