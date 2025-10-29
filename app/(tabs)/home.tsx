import { Text, View, FlatList } from 'react-native';
import sample from '@/data/home-sample.json';

export default function HomeScreen() {
  return (
    <View className="flex-1 p-4">
      <Text className="text-2xl font-bold mb-4">Overview</Text>
      <View className="flex-row gap-3 mb-6">
        <StatCard label="Study hrs" value={String(sample.overview.weeklyStudyHours)} />
        <StatCard label="Notes" value={String(sample.overview.notesReviewed)} />
        <StatCard label="Done" value={String(sample.overview.assignmentsCompleted)} />
        <StatCard label="Streak" value={`${sample.overview.streakDays}d`} />
      </View>

      <Text className="text-xl font-semibold mb-2">Upcoming deadlines</Text>
      <FlatList
        data={sample.deadlines}
        keyExtractor={(item, idx) => `${item.title}-${idx}`}
        ItemSeparatorComponent={() => <View className="h-px bg-gray-200 my-2" />}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="font-semibold">{item.title}</Text>
              <Text className="text-gray-500 text-sm">{item.course} • {new Date(item.dueAt).toLocaleString()}</Text>
            </View>
            <Text className="text-gray-700 font-medium">{item.progress}%</Text>
          </View>
        )}
      />
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 items-center">
      <Text className="text-xs text-gray-500">{label}</Text>
      <Text className="text-lg font-bold">{value}</Text>
    </View>
  );
}
