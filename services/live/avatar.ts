import { account, storage } from '@/lib/appwrite';
import { CONFIG } from '@/utils/config';
import { ID, Permission, Role, InputFile } from 'react-native-appwrite';

const BUCKET = (process.env.EXPO_PUBLIC_APPWRITE_AVATAR_BUCKET_ID || (CONFIG as any).APPWRITE_AVATAR_BUCKET_ID || 'profile_avatars');

async function ensureBucketExists(): Promise<void> {
  const base = (CONFIG.APPWRITE_ENDPOINT || '').replace(/\/$/, '') || 'https://cloud.appwrite.io/v1';
  const project = CONFIG.APPWRITE_PROJECT_ID;
  if (!project) return; // Can't verify without project id
  let jwt: string | undefined;
  try { const j = await (account as any).createJWT?.(); jwt = j?.jwt; } catch {}
  const headers: Record<string,string> = { 'X-Appwrite-Project': project };
  if (jwt) headers['X-Appwrite-JWT'] = jwt;
  try {
    const r = await fetch(`${base}/storage/buckets/${BUCKET}`, { headers });
    if (!r.ok) {
      const status = r.status;
      if (status === 404) throw new Error(`Storage bucket "${BUCKET}" not found. Run provisioning script to create it.`);
    }
  } catch (e) {
    // Non-fatal, caller will surface if upload fails
    console.warn('[avatar] bucket check', (e as any)?.message || e);
  }
}

// Upload avatar using SDK first (simpler in RN), fallback to REST if needed.
export async function uploadAvatar(file: { uri: string; name?: string; type?: string }) {
  await ensureBucketExists();
  let upload: any | undefined;
  // Primary: SDK createFile
  try {
    // Prefer explicit InputFile if available (some versions require this wrapper)
    const input = (InputFile && (InputFile as any).fromURI)
      ? (InputFile as any).fromURI(file.uri, file.type || 'image/jpeg', file.name || 'avatar.jpg')
      : { uri: file.uri, type: file.type || 'image/jpeg', name: file.name || 'avatar.jpg' };
    upload = await (storage as any).createFile(
      BUCKET,
      ID.unique(),
      input,
      [Permission.read(Role.any())]
    );
  } catch (sdkErr) {
    console.warn('[avatar] SDK upload failed, attempting REST fallback', (sdkErr as any)?.message || sdkErr);
    // REST fallback
    try {
      const base = (CONFIG.APPWRITE_ENDPOINT || '').replace(/\/$/, '') || 'https://cloud.appwrite.io/v1';
      const project = CONFIG.APPWRITE_PROJECT_ID;
      const url = `${base}/storage/buckets/${BUCKET}/files`;
      const form = new FormData();
      form.append('fileId', 'unique()');
      form.append('file', { uri: file.uri, name: file.name || 'avatar.jpg', type: file.type || 'image/jpeg' } as any);
      try { (form as any).append('permissions[]', 'read("any")'); } catch {}
      let jwt: string | undefined;
      try { const j = await (account as any).createJWT?.(); jwt = j?.jwt; } catch {}
      const headers: Record<string,string> = { 'X-Appwrite-Project': project || '' };
      if (jwt) headers['X-Appwrite-JWT'] = jwt;
      const res = await fetch(url, { method: 'POST', headers, body: form as any });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`REST upload failed (${res.status}): ${txt}`);
      }
      upload = await res.json();
    } catch (restErr) {
      throw new Error('Avatar upload failed: ' + ((restErr as any)?.message || restErr));
    }
  }
  const fileId = upload?.$id || upload?.id || upload?.fileId || upload?.$fileId;
  if (!fileId) {
    console.warn('[avatar] upload object shape (no id found):', upload);
    throw new Error('Upload returned no file id (bucket missing, permission issue, or SDK response shape changed)');
  }
  let preview: string | undefined;
  try {
    const direct = (storage as any).getFileView?.(BUCKET, fileId) as any;
    if (typeof direct === 'string' && direct.length) preview = direct;
  } catch {}
  if (!preview) {
    const base = (CONFIG.APPWRITE_ENDPOINT || '').replace(/\/$/, '') || 'https://cloud.appwrite.io/v1';
    const project = CONFIG.APPWRITE_PROJECT_ID;
    if (project) preview = `${base}/storage/buckets/${BUCKET}/files/${fileId}/view?project=${project}`;
  }
  return { fileId, url: preview || '' };
}

export async function deleteAvatarFile(fileId?: string) {
  if (!fileId) return;
  try { await (storage as any).deleteFile(BUCKET, fileId); } catch (e) { console.warn('[avatar] delete failed', (e as any)?.message || e); }
}