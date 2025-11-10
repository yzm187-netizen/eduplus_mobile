import Constants from 'expo-constants';

export type AppConfig = {
  USE_MOCK?: boolean;
  API_BASE_URL: string;
  IMAGE_CDN_BASE_URL?: string;
  APPWRITE_ENDPOINT: string;
  APPWRITE_PROJECT_ID: string;
  APPWRITE_PLATFORM?: string;
  APPWRITE_DATABASE_ID?: string;
  APPWRITE_BUCKET_ID?: string;
  APPWRITE_COLLECTIONS?: Record<string, string>;
  SENTRY_DSN?: string;
  PRIVACY_POLICY_URL?: string;
  TERMS_URL?: string;
  HELP_CENTER_URL?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppConfig> & Record<string, any>;
const env = typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>) : {};

export const CONFIG: AppConfig = {
  USE_MOCK: extra.USE_MOCK ?? false,
  API_BASE_URL: extra.API_BASE_URL || 'REPLACE_ME_API_BASE_URL',
  IMAGE_CDN_BASE_URL: extra.IMAGE_CDN_BASE_URL,
  // Prefer Expo public env vars if extra is not set
  APPWRITE_ENDPOINT: (extra as any).APPWRITE_ENDPOINT || env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  APPWRITE_PROJECT_ID: (extra as any).APPWRITE_PROJECT_ID || env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || 'REPLACE_ME_APPWRITE_PROJECT_ID',
  APPWRITE_PLATFORM: (extra as any).APPWRITE_PLATFORM || env.EXPO_PUBLIC_APPWRITE_PLATFORM,
  APPWRITE_DATABASE_ID: (extra as any).APPWRITE_DATABASE_ID || env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  APPWRITE_BUCKET_ID: (extra as any).APPWRITE_BUCKET_ID || env.EXPO_PUBLIC_APPWRITE_BUCKET_ID,
  APPWRITE_COLLECTIONS: (extra as any).APPWRITE_COLLECTIONS,
  SENTRY_DSN: extra.SENTRY_DSN,
  PRIVACY_POLICY_URL: extra.PRIVACY_POLICY_URL,
  TERMS_URL: extra.TERMS_URL,
  HELP_CENTER_URL: extra.HELP_CENTER_URL,
};

export function assertConfigured(key: keyof AppConfig) {
  if ((CONFIG as any)[key]?.toString().startsWith('REPLACE_ME')) {
    console.warn(`Config ${key} is not set. Update expo.extra.${String(key)} in app.json`);
  }
}
