/**
 * Restrict bucket to teacher team for create/update/delete, grant read to teacher + student teams.
 * Usage: node scripts/appwrite/grant-bucket-users-create.js
 * Required envs: APPWRITE_API_KEY, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, EXPO_PUBLIC_APPWRITE_BUCKET_ID
 * Team envs (IDs, not names): APPWRITE_TEACHER_TEAM_ID (or EXPO_PUBLIC_APPWRITE_TEACHER_TEAM_ID), optional APPWRITE_STUDENT_TEAM_ID / EXPO_PUBLIC_APPWRITE_STUDENT_TEAM_ID.
 */
const endpoint = (process.env.APPWRITE_ENDPOINT || '').replace(/\/$/, '') || 'https://cloud.appwrite.io/v1';
const project = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const bucketId = process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID || process.env.APPWRITE_BUCKET_ID;
const teacherTeam = (process.env.APPWRITE_TEACHER_TEAM_ID || process.env.EXPO_PUBLIC_APPWRITE_TEACHER_TEAM_ID || '').trim();
const studentTeam = (process.env.APPWRITE_STUDENT_TEAM_ID || process.env.EXPO_PUBLIC_APPWRITE_STUDENT_TEAM_ID || '').trim();

if (!project || !apiKey || !bucketId || !teacherTeam) {
  console.error('[grant-bucket-teacher-team] Missing required envs (project/apiKey/bucket/teacherTeam).');
  process.exit(1);
}

async function run() {
  const getRes = await fetch(`${endpoint}/storage/buckets/${bucketId}`, {
    method: 'GET',
    headers: {
      'X-Appwrite-Project': project,
      'X-Appwrite-Key': apiKey,
    },
  });
  if (!getRes.ok) {
    const body = await getRes.text();
    throw new Error(`Failed to fetch bucket: ${getRes.status} ${body}`);
  }
  const bucket = await getRes.json();
  const existing = Array.isArray(bucket.permissions) ? bucket.permissions : [];

  const needed = [
    `read("team:${teacherTeam}")`,
    ...(studentTeam ? [`read("team:${studentTeam}")`] : []),
    `create("team:${teacherTeam}")`,
    `update("team:${teacherTeam}")`,
    `delete("team:${teacherTeam}")`,
  ];

  const merged = Array.from(new Set([...existing, ...needed]));

  const patchRes = await fetch(`${endpoint}/storage/buckets/${bucketId}`, {
    method: 'PATCH',
    headers: {
      'X-Appwrite-Project': project,
      'X-Appwrite-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ permissions: merged }),
  });
  if (!patchRes.ok) {
    const body = await patchRes.text();
    throw new Error(`Failed to patch bucket permissions: ${patchRes.status} ${body}`);
  }
  const updated = await patchRes.json();
  console.log('[grant-bucket-teacher-team] Updated permissions:', updated.permissions);
  const hasCreate = updated.permissions.some((p) => p.includes(`create("team:${teacherTeam}`));
  if (!hasCreate) {
    console.warn('[grant-bucket-teacher-team] WARNING: create permission for teacher team not present');
  } else {
    console.log('[grant-bucket-teacher-team] SUCCESS: teacher team can create files');
  }
}

run().catch(err => {
  console.error('[grant-bucket-teacher-team] Error', err);
  process.exit(1);
});
