// Updates a profile document's name and preferredName by user id
// Usage: USER_ID=<id> NAME="Dr. Adrian Tan" PREFERRED_NAME="Adrian" node -r dotenv/config scripts/appwrite/fix-profile-name.js
const sdk = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY;
  const DB_ID = process.env.DB_ID || process.env.APPWRITE_DATABASE_ID;
  const USER_ID = process.env.USER_ID;
  const NAME = process.env.NAME;
  const PREFERRED_NAME = process.env.PREFERRED_NAME;
  if (!endpoint || !project || !key || !DB_ID || !USER_ID || !NAME) {
    console.error('[fix-profile-name] Missing required env vars (need USER_ID, NAME + base Appwrite env).');
    process.exit(1);
  }
  const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const db = new sdk.Databases(client);
  try {
    const doc = await db.getDocument(DB_ID, 'profiles', USER_ID);
    await db.updateDocument(DB_ID, 'profiles', USER_ID, { name: NAME, preferredName: PREFERRED_NAME || doc.preferredName });
    console.log('[fix-profile-name] updated', USER_ID, '->', NAME, PREFERRED_NAME || doc.preferredName);
  } catch (e) {
    console.error('[fix-profile-name] failed', e.message || e);
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
