/**
 * Grant bucket create(users) and ensure read(any) for public viewing.
 * Usage: node scripts/appwrite/grant-bucket-users-create-simple.js
 */
const endpoint = (process.env.APPWRITE_ENDPOINT || '').replace(/\/$/, '') || 'https://cloud.appwrite.io/v1';
const project = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY; // server-only
const bucketId = process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID || process.env.APPWRITE_BUCKET_ID;

if (!project || !apiKey || !bucketId) {
  console.error('[grant-bucket-users-create-simple] Missing envs: APPWRITE_PROJECT_ID / APPWRITE_API_KEY / bucket id');
  process.exit(1);
}

async function run() {
  const getRes = await fetch(`${endpoint}/storage/buckets/${bucketId}`, {
    method: 'GET',
    headers: { 'X-Appwrite-Project': project, 'X-Appwrite-Key': apiKey },
  });
  if (!getRes.ok) {
    const body = await getRes.text();
    throw new Error(`Fetch bucket failed: ${getRes.status} ${body}`);
  }
  const bucket = await getRes.json();
  const existing = Array.isArray(bucket.permissions) ? bucket.permissions : [];
  const needed = [
    'read("any")',      // view in external browser
    'create("users")',  // allow authenticated users to upload
  ];
  const merged = Array.from(new Set([...existing, ...needed]));

  // Appwrite bucket update uses PUT and requires name + other flags; reuse existing bucket props.
  const updatePayload = {
    name: bucket.name || 'eduplus-bucket',
    permissions: merged,
    fileSecurity: bucket.fileSecurity !== undefined ? bucket.fileSecurity : true,
    enabled: bucket.enabled !== undefined ? bucket.enabled : true,
  };
  const putRes = await fetch(`${endpoint}/storage/buckets/${bucketId}`, {
    method: 'PUT',
    headers: {
      'X-Appwrite-Project': project,
      'X-Appwrite-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatePayload),
  });
  if (!putRes.ok) {
    const body = await putRes.text();
    throw new Error(`Update bucket failed: ${putRes.status} ${body}`);
  }
  const updated = await putRes.json();
  console.log('[grant-bucket-users-create-simple] Updated permissions:', updated.permissions);
}

run().catch(err => { console.error('[grant-bucket-users-create-simple] Error', err); process.exit(1); });
