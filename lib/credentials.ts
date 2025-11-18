import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type SavedAccount = { email: string; password: string };

// Use a SecureStore-compatible key (alphanumeric, '.', '-', '_').
const KEY_PRIMARY = 'eduplus_saved_accounts_v1';
// Legacy keys to attempt migration from (e.g., older invalid key formats)
const LEGACY_KEYS = ['eduplus:saved-accounts:v1'];

async function getRaw(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      const v = await AsyncStorage.getItem(KEY_PRIMARY);
      if (v != null) return v;
      // try legacy
      for (const k of LEGACY_KEYS) {
        const legacy = await AsyncStorage.getItem(k);
        if (legacy != null) {
          // migrate
          await AsyncStorage.setItem(KEY_PRIMARY, legacy);
          return legacy;
        }
      }
      return null;
    }
    const available = await SecureStore.isAvailableAsync();
    if (!available) {
      const v = await AsyncStorage.getItem(KEY_PRIMARY);
      if (v != null) return v;
      for (const k of LEGACY_KEYS) {
        const legacy = await AsyncStorage.getItem(k);
        if (legacy != null) {
          await AsyncStorage.setItem(KEY_PRIMARY, legacy);
          return legacy;
        }
      }
      return null;
    }
    const v = await SecureStore.getItemAsync(KEY_PRIMARY);
    if (v != null) return v;
    // Try legacy secure keys and migrate forward if found
    for (const k of LEGACY_KEYS) {
      try {
        const legacy = await SecureStore.getItemAsync(k);
        if (legacy != null) {
          await setRaw(legacy);
          return legacy;
        }
      } catch {}
    }
    return null;
  } catch {
    return null;
  }
}

async function setRaw(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(KEY_PRIMARY, value);
    return;
  }
  const available = await SecureStore.isAvailableAsync();
  if (!available) {
    await AsyncStorage.setItem(KEY_PRIMARY, value);
    return;
  }
  await SecureStore.setItemAsync(KEY_PRIMARY, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
}

export async function getSavedAccounts(): Promise<SavedAccount[]> {
  const raw = await getRaw();
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return arr.filter((x) => x && typeof x.email === 'string' && typeof x.password === 'string');
    }
  } catch {}
  return [];
}

export async function saveAccount(email: string, password: string): Promise<void> {
  const accounts = await getSavedAccounts();
  const idx = accounts.findIndex((a) => a.email.toLowerCase() === email.toLowerCase());
  if (idx >= 0) accounts[idx] = { email, password };
  else accounts.push({ email, password });
  await setRaw(JSON.stringify(accounts));
}

export async function removeAccount(email: string): Promise<void> {
  const accounts = await getSavedAccounts();
  const next = accounts.filter((a) => a.email.toLowerCase() !== email.toLowerCase());
  await setRaw(JSON.stringify(next));
}
