#!/usr/bin/env node
// Create a profile document (id generated) so we can enroll students by email
const { Client, Databases, ID } = require('node-appwrite');

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT,
  APPWRITE_PROJECT_ID,
  EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  EXPO_PUBLIC_APPWRITE_ENDPOINT,
  APPWRITE_API_KEY,
  EXPO_PUBLIC_APPWRITE_API_KEY,
  APPWRITE_DATABASE_ID,
  EXPO_PUBLIC_APPWRITE_DATABASE_ID,
} = process.env;

const endpoint = APPWRITE_ENDPOINT || EXPO_PUBLIC_APPWRITE_ENDPOINT;
const project = APPWRITE_PROJECT || APPWRITE_PROJECT_ID || EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = APPWRITE_API_KEY || EXPO_PUBLIC_APPWRITE_API_KEY;
const databaseId = APPWRITE_DATABASE_ID || EXPO_PUBLIC_APPWRITE_DATABASE_ID;

if (!endpoint || !project || !apiKey || !databaseId) {
  console.error('Missing env: endpoint/project/apiKey/databaseId');
  process.exit(1);
}

const args = process.argv.slice(2);
function getArg(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}
const name = getArg('--name');
const email = getArg('--email');
const role = getArg('--role') || 'student';
if (!name || !email) {
  console.error('Usage: node scripts/appwrite/create-profile.js --name "Full Name" --email name@example.com [--role student|teacher]');
  process.exit(1);
}

(async () => {
  const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey);
  const db = new Databases(client);
  const DB_ID = databaseId;
  const PROFILES = 'profiles';
  // Check existing by email
  try {
    const res = await db.listDocuments(DB_ID, PROFILES, [
      // node-appwrite Query import is cumbersome inline; use raw string form
      // For safety, rely on unique index on email if present
    ]);
    // Fallback: attempt to find by email client-side
    const hit = res.documents.find(d => (d.email || '').toLowerCase() === email.toLowerCase());
    if (hit) {
      console.log('Profile already exists:', hit.$id, hit.email);
      return;
    }
  } catch {}
  const doc = await db.createDocument(DB_ID, PROFILES, ID.unique(), { name, email, role, createdAt: new Date().toISOString() });
  console.log('Created profile:', doc.$id, doc.email);
})().catch(e => { console.error('Create profile failed:', e.message || e); process.exit(1); });
