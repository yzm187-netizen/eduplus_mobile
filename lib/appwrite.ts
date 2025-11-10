import { Client, Account, Databases, Storage, Avatars, ID, Models } from 'react-native-appwrite';
import { CONFIG } from '@/utils/config';
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra || {}) as any;

export const appwriteClient = new Client()
  .setEndpoint(extra.APPWRITE_ENDPOINT || CONFIG.APPWRITE_ENDPOINT)
  .setProject(extra.APPWRITE_PROJECT_ID || CONFIG.APPWRITE_PROJECT_ID);

const platform = extra.APPWRITE_PLATFORM || CONFIG.APPWRITE_PLATFORM;
if (platform) {
  appwriteClient.setPlatform(platform);
}

export const account = new Account(appwriteClient);
export const databases = new Databases(appwriteClient);
export const storage = new Storage(appwriteClient);
export const avatars = new Avatars(appwriteClient);

export { ID };
export type { Models };

export const DB = {
  id: (extra.APPWRITE_DATABASE_ID || CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DATABASE_ID'),
  collections: {
    users: (CONFIG.APPWRITE_COLLECTIONS?.users || 'REPLACE_ME_USERS_COLLECTION_ID'),
    courses: (CONFIG.APPWRITE_COLLECTIONS?.courses || 'REPLACE_ME_COURSES_COLLECTION_ID'),
    assignments: (CONFIG.APPWRITE_COLLECTIONS?.assignments || 'REPLACE_ME_ASSIGNMENTS_COLLECTION_ID'),
    groups: (CONFIG.APPWRITE_COLLECTIONS?.groups || 'REPLACE_ME_GROUPS_COLLECTION_ID'),
    progressNodes: (CONFIG.APPWRITE_COLLECTIONS?.progressNodes || 'REPLACE_ME_PROGRESS_NODES_COLLECTION_ID'),
    messages: (CONFIG.APPWRITE_COLLECTIONS?.messages || 'REPLACE_ME_MESSAGES_COLLECTION_ID'),
  },
};
