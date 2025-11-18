declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_MODE?: 'mock' | 'live';
    EXPO_PUBLIC_CHAT_MODE?: 'mock' | 'live';
    APPWRITE_ENDPOINT?: string;
    APPWRITE_PROJECT_ID?: string;
    APPWRITE_API_KEY?: string;
    APPWRITE_DATABASE_ID?: string;
    TEAM_TEACHERS_GLOBAL?: string;
  }
}
