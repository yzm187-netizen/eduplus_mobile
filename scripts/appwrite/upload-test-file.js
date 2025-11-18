// Quick health check: upload a tiny file to Appwrite Storage and print the view URL
// Usage:
//   node -r dotenv/config scripts/appwrite/upload-test-file.js
// Requires env:
//   APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID (or APPWRITE_PROJECT), APPWRITE_API_KEY, APPWRITE_BUCKET_ID

const path = require('path');
const fs = require('fs');
const os = require('os');
const { createRequire } = require('module');
const requireFromEduplus = createRequire(path.join(__dirname, '..', '..', 'package.json'));
const { Client, Storage, ID, Permission, Role, InputFile } = requireFromEduplus('node-appwrite');

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_PROJECT, // allow alias
  APPWRITE_API_KEY,
  APPWRITE_BUCKET_ID,
  // Expo-style envs often used in the app runtime
  EXPO_PUBLIC_APPWRITE_ENDPOINT,
  EXPO_PUBLIC_APPWRITE_PROJECT,
  EXPO_PUBLIC_APPWRITE_BUCKET,
  EXPO_PUBLIC_APPWRITE_BUCKET_ID,
} = process.env;

const ENDPOINT = APPWRITE_ENDPOINT || EXPO_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT = APPWRITE_PROJECT_ID || APPWRITE_PROJECT || EXPO_PUBLIC_APPWRITE_PROJECT;
const BUCKET = APPWRITE_BUCKET_ID || EXPO_PUBLIC_APPWRITE_BUCKET_ID || EXPO_PUBLIC_APPWRITE_BUCKET;
if (!ENDPOINT || !PROJECT || !APPWRITE_API_KEY || !BUCKET) {
  console.error('Missing required env. Provide: (APPWRITE_ENDPOINT|EXPO_PUBLIC_APPWRITE_ENDPOINT), (APPWRITE_PROJECT_ID|APPWRITE_PROJECT|EXPO_PUBLIC_APPWRITE_PROJECT), APPWRITE_API_KEY, (APPWRITE_BUCKET_ID|EXPO_PUBLIC_APPWRITE_BUCKET_ID|EXPO_PUBLIC_APPWRITE_BUCKET)');
  process.exit(1);
}

async function main() {
  const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT).setKey(APPWRITE_API_KEY);
  const storage = new Storage(client);
  console.log('[upload-test] SDK InputFile availability', {
    hasInputFile: !!InputFile,
    fromPath: InputFile && typeof InputFile.fromPath,
    fromBuffer: InputFile && typeof InputFile.fromBuffer,
  });

  const content = `eduplus test file\n${new Date().toISOString()}\n`;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eduplus-'));
  const tmpPath = path.join(tmpDir, 'eduplus-test.txt');
  fs.writeFileSync(tmpPath, content, 'utf8');
  const trySdk = async () => {
    let file;
    if (InputFile && typeof InputFile.fromPath === 'function') {
      file = InputFile.fromPath(tmpPath, 'eduplus-test.txt');
    } else if (InputFile && typeof InputFile.fromBuffer === 'function') {
      file = InputFile.fromBuffer(Buffer.from(content, 'utf8'), 'eduplus-test.txt');
    }
    if (!file) throw new Error('SDK InputFile unavailable');
    const perms = [Permission.read(Role.any())];
    return storage.createFile(BUCKET, ID.unique(), file, perms);
  };

  const tryRest = async () => {
    const base = ENDPOINT.replace(/\/$/, '');
    const url = `${base}/storage/buckets/${BUCKET}/files`;
    const form = new FormData();
    const blob = new Blob([content], { type: 'text/plain' });
    form.append('fileId', 'unique()');
    form.append('file', blob, 'eduplus-test.txt');
    form.append('permissions[]', 'read("any")');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Appwrite-Project': PROJECT,
        'X-Appwrite-Key': APPWRITE_API_KEY,
      },
      body: form,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`REST upload failed: ${res.status} ${res.statusText} ${txt}`);
    }
    return res.json();
  };

  console.log('[upload-test] uploading to bucket', BUCKET);
  let created;
  try {
    created = await trySdk();
    console.log('[upload-test] uploaded via SDK');
  } catch (e) {
    console.warn('[upload-test] SDK path failed, falling back to REST:', e.message || e);
    created = await tryRest();
    console.log('[upload-test] uploaded via REST');
  }

  const fileId = created.$id;
  const base = ENDPOINT.replace(/\/$/, '');
  const viewUrl = `${base}/storage/buckets/${BUCKET}/files/${fileId}/view?project=${PROJECT}`;
  console.log('[upload-test] created file:', { id: fileId, name: created.name, size: created.sizeOriginal });
  console.log('[upload-test] view URL:', viewUrl);
  console.log('[upload-test] Open this URL in a browser. You should also see the file in the bucket.');
}

main().catch((e) => { console.error('[upload-test] failed:', e?.message || e); process.exit(1); });
