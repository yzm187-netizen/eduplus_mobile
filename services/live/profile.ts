import { databases } from '@/lib/appwrite';
import { Permission, Role } from 'react-native-appwrite';
import { CONFIG } from '@/utils/config';
import type { UserProfile } from '@/services/profile';

const COLLECTION = 'profiles'; // collection id matches name per provisioning
const DB_ID = CONFIG.APPWRITE_DATABASE_ID || 'REPLACE_ME_DB_ID';

export async function getProfile(userId: string): Promise<UserProfile | null> {
  try {
    const doc = await databases.getDocument(DB_ID, COLLECTION, userId);
    return { id: doc.$id, name: doc.name, email: doc.email, role: doc.role };
  } catch {
    return null;
  }
}

export async function createProfile(params: { id: string; name: string; email: string; role?: UserProfile['role'] }): Promise<UserProfile> {
  const doc = await databases.createDocument(
    DB_ID,
    COLLECTION,
    params.id,
    {
      name: params.name,
      email: params.email,
      role: params.role || 'student',
      createdAt: new Date().toISOString(),
    },
    [
      Permission.read(Role.user(params.id)),
      Permission.update(Role.user(params.id)),
      Permission.delete(Role.user(params.id)),
    ]
  );
  return { id: doc.$id, name: doc.name, email: doc.email, role: doc.role };
}

export async function getOrCreateProfile(user: { $id: string; name: string; email: string }): Promise<UserProfile> {
  const existing = await getProfile(user.$id);
  if (existing) return existing;
  return createProfile({ id: user.$id, name: user.name, email: user.email, role: 'student' });
}
