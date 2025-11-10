import { storage, ID } from '@/lib/appwrite';
import { CONFIG } from '@/utils/config';

function getBucketId() {
  const id = CONFIG.APPWRITE_BUCKET_ID;
  if (!id || id.startsWith('REPLACE_ME')) throw new Error('APPWRITE_BUCKET_ID is not configured. Create one bucket (e.g., uploads) and set EXPO_PUBLIC_APPWRITE_BUCKET_ID.');
  return id;
}

export async function uploadPublic(input: { file: any; name?: string }) {
  const bucketId = getBucketId();
  // NOTE: In Expo/React Native, pass an InputFile from react-native-appwrite. The caller should create it.
  const created = await (storage as any).createFile(bucketId, ID.unique(), input.file, [
    // document-level permissions can be managed separately; keep default for now
  ]);
  return { id: created.$id, bucketId, name: input.name ?? created.name };
}

export async function uploadPrivate(input: { file: any; name?: string }) {
  const bucketId = getBucketId();
  const created = await (storage as any).createFile(bucketId, ID.unique(), input.file, [
    // TODO: add restrictive permissions here if desired
  ]);
  return { id: created.$id, bucketId, name: input.name ?? created.name };
}

export function fileViewUrl(fileId: string) {
  // For private files, you will need a logged-in session; for public resources, ensure appropriate permissions.
  return `${CONFIG.APPWRITE_ENDPOINT}/storage/buckets/${getBucketId()}/files/${encodeURIComponent(fileId)}/view?project=${CONFIG.APPWRITE_PROJECT_ID}`;
}
