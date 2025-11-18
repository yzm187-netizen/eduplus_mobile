import { databases } from '@/lib/appwrite';
import { displayNameFromEmail } from '@/utils/displayName';
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

export async function createProfile(params: { id: string; name?: string; email: string; role?: UserProfile['role'] }): Promise<UserProfile> {
  try {
    const name = (params.name && params.name.trim()) || displayNameFromEmail(params.email) || 'Student';
    const doc = await databases.createDocument(
      DB_ID,
      COLLECTION,
      params.id,
      {
        name,
        email: params.email,
        role: params.role || 'student',
        createdAt: new Date().toISOString(),
      },
      [
        // Broaden read so subsequent sign-ins can fetch the profile before attempting create
        Permission.read(Role.users()),
        Permission.update(Role.user(params.id)),
        Permission.delete(Role.user(params.id)),
      ]
    );
    return { id: doc.$id, name: doc.name, email: doc.email, role: doc.role };
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (/already exists|409/i.test(msg)) {
      // Attempt to update existing doc to ensure fields and broadened read perms
      try {
        const updated = await databases.updateDocument(
          DB_ID,
          COLLECTION,
          params.id,
          { name: (params.name && params.name.trim()) || displayNameFromEmail(params.email) || 'Student', email: params.email },
          [
            Permission.read(Role.users()),
            Permission.update(Role.user(params.id)),
            Permission.delete(Role.user(params.id)),
          ]
        );
        return { id: updated.$id, name: updated.name, email: updated.email, role: updated.role };
      } catch {
        const existing = await getProfile(params.id);
        if (existing) return existing;
      }
    }
    throw e;
  }
}

export async function updateProfile(userId: string, patch: { name?: string; email?: string; avatarFileId?: string | null; role?: UserProfile['role'] }) {
  const data: any = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.email !== undefined) data.email = patch.email;
  if (patch.role !== undefined) data.role = patch.role;
  if (patch.avatarFileId !== undefined) data.avatarFileId = patch.avatarFileId;
  await databases.updateDocument(DB_ID, COLLECTION, userId, data);
}

export async function getOrCreateProfile(user: { $id: string; name: string; email: string }): Promise<UserProfile> {
  const existing = await getProfile(user.$id);
  if (existing) return existing;
  return await createProfile({ id: user.$id, name: user.name, email: user.email, role: 'student' });
}
