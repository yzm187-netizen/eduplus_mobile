// Fix enrollment.userId to match Appwrite auth user id instead of profile id
// Usage:
//  node -r dotenv/config scripts/appwrite/fix-enrollment-user-ids.js --email jamie.lee@student.edu.my
//  node -r dotenv/config scripts/appwrite/fix-enrollment-user-ids.js --all  (repairs all mismatches it can resolve by email)

const { Client, Users, Databases, ID, Query } = require('node-appwrite');

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

const args = process.argv.slice(2);
function getArg(flag) { const i = args.indexOf(flag); return i >= 0 ? args[i+1] : undefined; }
const emailArg = getArg('--email');
const fixAll = args.includes('--all');

(async () => {
  const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey);
  const users = new Users(client);
  const db = new Databases(client);

  const repairs = [];

  async function repairByEmail(email) {
    // Find auth user by email
    const ulist = await users.list(undefined, 100);
    const user = ulist.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    if (!user) { console.warn('No auth user for', email); return; }
    // Find profile by email (may have different id)
    const pres = await db.listDocuments(DB_ID, COL_PROFILES, [Query.equal('email', [email])]);
    if (!pres.total) { console.warn('No profile for', email); return; }
    const profile = pres.documents[0];

    if (profile.$id === user.$id) {
      console.log('Profile id already matches auth user id for', email); return;
    }

    // Find enrollments with profile id and move to auth user id
    const enr = await db.listDocuments(DB_ID, COL_ENROLLMENTS, [Query.equal('userId', [profile.$id])]);
    if (!enr.total) { console.log('No enrollments bound to profile id for', email); return; }
    for (const e of enr.documents) {
      await db.updateDocument(DB_ID, COL_ENROLLMENTS, e.$id, { userId: user.$id, status: 'active' });
      repairs.push({ enrollmentId: e.$id, from: profile.$id, to: user.$id });
      console.log('Rebound enrollment', e.$id, 'to userId', user.$id);
    }
  }

  if (fixAll) {
    // Iterate profiles and try to reconcile by email
    const pres = await db.listDocuments(DB_ID, COL_PROFILES, [], 100);
    for (const p of pres.documents) {
      await repairByEmail(p.email);
    }
  } else if (emailArg) {
    await repairByEmail(emailArg);
  } else {
    console.error('Provide --email <email> or --all');
    process.exit(1);
  }

  console.log('Done. Repairs:', repairs.length);
})();
