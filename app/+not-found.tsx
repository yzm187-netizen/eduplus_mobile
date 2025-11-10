import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Card>
          <Text style={styles.title}>This screen doesn't exist.</Text>
          <View style={{ height: 12 }} />
          <Link href="/" asChild>
            <Button title="Go to home" variant="secondary" />
          </Link>
        </Card>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
});
