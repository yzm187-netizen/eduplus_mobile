import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useRouter } from 'expo-router';

export default function ModalScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.title}>Quick actions</Text>
        <Text style={styles.subtitle}>This modal is a placeholder you can repurpose for app-wide shortcuts or settings.</Text>
        <View style={{ height: 16 }} />
        <Button title="Close" onPress={() => router.back()} />
      </Card>

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 8,
    color: '#6b7280',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
