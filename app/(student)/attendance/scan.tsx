import React, { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import { Services } from '@/services/providers';

export default function AttendanceScanScreen() {
  const [code, setCode] = useState('');
  const [marking, setMarking] = useState(false);

  const onSubmit = async () => {
    if (!code) return;
    const user = await Services.auth.getSession();
    if (!user) { Alert.alert('Not signed in'); return; }
    // Expecting code format: QR-<sessionId>-<timestamp>
    const parts = code.split('-');
    if (parts.length < 3) { Alert.alert('Invalid code'); return; }
    const sessionId = parts[1];
    setMarking(true);
    try {
      await Services.attendance.mark(sessionId, user.id, 'present');
      Alert.alert('Marked present');
    } catch (e) {
      Alert.alert('Failed to mark attendance');
    } finally {
      setMarking(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-black p-4">
      <Text className="text-2xl font-extrabold mb-4">Attendance Scan</Text>
      <View className="gap-3">
        <View>
          <Text className="font-medium mb-1">Enter Code</Text>
          <TextInput value={code} onChangeText={setCode} placeholder="QR-..." className="bg-white dark:bg-neutral-900 rounded-2xl px-4 py-3" />
        </View>
        <Button title={marking ? 'Submitting…' : 'Submit'} onPress={onSubmit} loading={marking} disabled={!code} />
      </View>
    </SafeAreaView>
  );
}
