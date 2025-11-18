// Ensure profile document id matches auth user id for a given email.
// Also migrate enrollments referencing the old profile id.
// Usage:
//   node -r dotenv/config scripts/appwrite/fix-profile-id.js --email jamie.lee@student.edu.my --delete-old
// Flags:
//   --email <email> (required)
//   --delete-old (optional) delete old profile doc after migration
// Env: APPWRITE_ENDPOINT, APPWRITE_PROJECT (or PROJECT_ID), APPWRITE_API_KEY, APPWRITE_DATABASE_ID

const { Client, Users, Databases, ID, Query } = require('node-appwrite');

const args = process.argv.slice(2);
function getArg(flag) { const i = args.indexOf(flag); return i >= 0 ? args[i+1] : undefined; }
const email = getArg('--email');
const deleteOld = args.includes('--delete-old');
if (!email) { console.error('Missing --email'); process.exit(1); }

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID,
  EXPO_PUBLIC_APPWRITE_ENDPOINT,
  EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  EXPO_PUBLIC_APPWRITE_DATABASE_ID,
} = process.env;

function req(k, v) { if (!v) throw new Error(`Missing env ${k}`); return v; }
const endpoint = req('APPWRITE_ENDPOINT', APPWRITE_ENDPOINT || EXPO_PUBLIC_APPWRITE_ENDPOINT);
const project = req('APPWRITE_PROJECT', APPWRITE_PROJECT || APPWRITE_PROJECT_ID || EXPO_PUBLIC_APPWRITE_PROJECT_ID);
const apiKey = req('APPWRITE_API_KEY', APPWRITE_API_KEY);
const DB_ID = req('APPWRITE_DATABASE_ID', APPWRITE_DATABASE_ID || EXPO_PUBLIC_APPWRITE_DATABASE_ID);

const COL_PROFILES = 'profiles';
const COL_ENROLLMENTS = 'enrollments';

(async () => {
  const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey);
  const users = new Users(client);
  const db = new Databases(client);

  // Find auth user
  const userList = await users.list(undefined, 200);
  const authUser = userList.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
  if (!authUser) throw new Error('Auth user not found for email ' + email);

  // Find profile(s)
  const profileRes = await db.listDocuments(DB_ID, COL_PROFILES, [Query.equal('email', [email])]);
  if (!profileRes.total) {
    console.log('No existing profile; creating new with id = auth user id');
    await db.createDocument(DB_ID, COL_PROFILES, authUser.$id, {
      role: 'student',
      name: authUser.name || email.split('@')[0],
      preferredName: authUser.name || email.split('@')[0],
      email,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    });
    console.log('Created profile', authUser.$id);
    return;
  }
  const profiles = profileRes.documents;
  const primary = profiles[0];
  // If first profile already matches auth id, ensure any others removed or ignored.
  if (primary.$id === authUser.$id) {
    console.log('Profile already correctly linked to auth id:', authUser.$id);
    // Optionally remove duplicates
    for (let i = 1; i < profiles.length; i++) {
      const dup = profiles[i];
      if (deleteOld) {
        await db.deleteDocument(DB_ID, COL_PROFILES, dup.$id);
        console.log('Deleted duplicate profile', dup.$id);
      } else {
        console.log('Duplicate profile exists (not deleted):', dup.$id);
      }
    }
    return;
  }

  // If primary doesn't match, check if a correct profile already exists under auth id
  let correctExists = false;
  try {
    await db.getDocument(DB_ID, COL_PROFILES, authUser.$id);
    correctExists = true;
  } catch {}

  if (!correctExists) {
    // Create new profile doc with correct id copying fields
    await db.createDocument(DB_ID, COL_PROFILES, authUser.$id, {
      role: primary.role || 'student',
      name: primary.name || authUser.name || email.split('@')[0],
      preferredName: primary.preferredName || primary.name || authUser.name || email.split('@')[0],
      email,
      avatarUrl: primary.avatarUrl || null,
      createdAt: primary.createdAt || new Date().toISOString(),
    });
    console.log('Created new profile with auth id', authUser.$id);
  } else {
    // Update existing correct profile fields (id already matches)
    await db.updateDocument(DB_ID, COL_PROFILES, authUser.$id, {
      role: primary.role || 'student',
      name: primary.name || authUser.name || email.split('@')[0],
      preferredName: primary.preferredName || primary.name || authUser.name || email.split('@')[0],
      email,
      avatarUrl: primary.avatarUrl || null,
    });
    console.log('Updated existing correct profile fields for', authUser.$id);
  }

  // Migrate enrollments from old profile id(s) to auth user id
  for (const p of profiles) {
    if (p.$id === authUser.$id) continue;
    const enr = await db.listDocuments(DB_ID, COL_ENROLLMENTS, [Query.equal('userId', [p.$id])]);
    if (!enr.total) continue;
    for (const e of enr.documents) {
      await db.updateDocument(DB_ID, COL_ENROLLMENTS, e.$id, { userId: authUser.$id });
      console.log('Updated enrollment', e.$id, 'userId', p.$id, '->', authUser.$id);
    }
    if (deleteOld) {
      try { await db.deleteDocument(DB_ID, COL_PROFILES, p.$id); console.log('Deleted old profile', p.$id); } catch (e) { console.warn('Failed deleting old profile', p.$id, e.message || e); }
    }
  }

  console.log('Repair complete for', email);
})();
