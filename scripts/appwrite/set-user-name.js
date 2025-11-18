// Set Appwrite auth user's display name by email and sync profile name
// Usage: node -r dotenv/config scripts/appwrite/set-user-name.js --email user@example.com --name "New Name"

const sdk = require('node-appwrite');

function arg(flag) { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i+1] : undefined; }
function req(name, v) { if (!v) throw new Error(`Missing env ${name}`); return v; }

const email = arg('--email');
const name = arg('--name');
if (!email || !name) {
  console.error('Provide --email and --name');
  process.exit(1);
}

const endpoint = req('APPWRITE_ENDPOINT', process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT);
const project = req('APPWRITE_PROJECT_ID', process.env.APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT);
const apiKey = req('APPWRITE_API_KEY', process.env.APPWRITE_API_KEY);
const DB_ID = req('APPWRITE_DATABASE_ID', process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID);

const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(apiKey);
const users = new sdk.Users(client);
const db = new sdk.Databases(client);

async function findUserByEmail(em) {
  try { const r = await users.list({ search: em }); if (r.total) return r.users.find(u => (u.email||'').toLowerCase()===em.toLowerCase()) || r.users[0]; } catch {}
  try { const r2 = await users.list([], em); if (r2.total) return r2.users.find(u => (u.email||'').toLowerCase()===em.toLowerCase()) || r2.users[0]; } catch {}
  return null;
}

async function updateUserName(userId, newName) {
  try { return await users.updateName(userId, newName); } catch(e1) {}
  try { return await users.updateName({ userId, name: newName }); } catch(e2) { throw e2; }
}

(async () => {
  console.log('[set-user-name] target', { email, name });
  const user = await findUserByEmail(email);
  if (!user) { console.error('User not found for email:', email); process.exit(1); }
  await updateUserName(user.$id || user.id, name);
  console.log('Updated auth name for', email, '->', name);

  // Sync profile name if profile exists
  try {
    await db.updateDocument(DB_ID, 'profiles', user.$id || user.id, { name, preferredName: name, email });
    console.log('Synced profile for', user.$id || user.id);
  } catch (e) {
    console.warn('Profile sync skipped:', e.message || e);
  }
})();
