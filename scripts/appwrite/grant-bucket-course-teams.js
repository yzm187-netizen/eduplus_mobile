// Apply course-staff / course-members style permissions to bucket files.
// Usage:
//   APPWRITE_ENDPOINT=... APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=... 
//   APPWRITE_BUCKET_ID=<bucket>
//   APPWRITE_TEAM_COURSE_STAFF_ID=<teamId>
//   APPWRITE_TEAM_COURSE_MEMBERS_ID=<teamId>
//   node scripts/appwrite/grant-bucket-course-teams.js
// Effect:
//   read(team:course-members), read(team:course-staff), create/update/delete(team:course-staff)
// NOTE: Bucket update via node-appwrite Storage.updateBucket.

const sdk = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY;
  const bucketId = process.env.APPWRITE_BUCKET_ID || process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID;
  const staffTeam = process.env.APPWRITE_TEAM_COURSE_STAFF_ID || process.env.APPWRITE_TEAM_TEACHERS_ID || process.env.EXPO_PUBLIC_APPWRITE_TEACHER_TEAM_ID;
  const membersTeam = process.env.APPWRITE_TEAM_COURSE_MEMBERS_ID || process.env.APPWRITE_TEAM_STUDENTS_ID || process.env.EXPO_PUBLIC_APPWRITE_STUDENT_TEAM_ID;

  if (!endpoint || !project || !key || !bucketId || !staffTeam) {
    console.error('[grant-bucket-course-teams] Missing required envs. Need endpoint, project, key, bucketId, staffTeam.');
    process.exit(1);
  }

  // Fetch via REST to avoid SDK updateBucket signature constraints
  let bucket;
  try {
    const res = await fetch(`${endpoint.replace(/\/$/, '')}/storage/buckets/${bucketId}`, {
      method: 'GET',
      headers: { 'X-Appwrite-Project': project, 'X-Appwrite-Key': key },
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    bucket = await res.json();
  } catch (e) {
    console.error('[grant-bucket-course-teams] getBucket failed', e.message);
    process.exit(1);
  }
  const existing = Array.isArray(bucket.permissions) ? bucket.permissions.slice() : [];
  // Allow FILE_SECURITY=0 to disable per-file security temporarily for debugging
  const ensureFileSecurity = process.env.FILE_SECURITY === '0' ? false : true;
  const want = [
    `read("team:${staffTeam}")`,
    ...(membersTeam ? [`read("team:${membersTeam}")`] : []),
    `create("team:${staffTeam}")`,
    `update("team:${staffTeam}")`,
    `delete("team:${staffTeam}")`,
    // Optional broader create for all authenticated users, when ALLOW_CREATE_USERS=1
    ...(process.env.ALLOW_CREATE_USERS === '1' ? ['create("users")'] : []),
  ];
  const next = Array.from(new Set([...existing, ...want]));
  if (next.length === existing.length) {
    console.log('[grant-bucket-course-teams] No changes needed (already present).');
    return;
  }
  try {
    const payload = {
      name: bucket.name || 'eduplus-bucket',
      permissions: next,
      fileSecurity: ensureFileSecurity,
      enabled: bucket.enabled !== undefined ? bucket.enabled : true,
    };
    const res = await fetch(`${endpoint.replace(/\/$/, '')}/storage/buckets/${bucketId}`, {
      method: 'PUT',
      headers: {
        'X-Appwrite-Project': project,
        'X-Appwrite-Key': key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    const updated = await res.json();
    console.log('[grant-bucket-course-teams] Updated permissions:', updated.permissions);
  } catch (e) {
    console.error('[grant-bucket-course-teams] updateBucket failed', e.message);
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
