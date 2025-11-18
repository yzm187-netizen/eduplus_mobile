#!/usr/bin/env node
// Ensure assessments collection allows read/list for users and create/update/delete by users (temp)
const { Client, Databases } = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
  const project = process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
  if (!endpoint || !project || !key || !databaseId) {
    console.error('Missing Appwrite envs for collection perms');
    process.exit(1);
  }
  const client = new Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const db = new Databases(client);
  const col = 'assessments';
  const coll = await db.getCollection(databaseId, col);
  const current = coll.permissions || [];
  const desired = Array.from(new Set([
    ...current,
    'read("users")',
    'create("users")',
    'update("users")',
    'delete("users")',
  ]));
  if (desired.length === current.length) {
    console.log('[set-assessments-collection-perms] No change needed.');
    return;
  }
  await db.updateCollection(databaseId, col, coll.name, desired, true, coll.enabled);
  const fresh = await db.getCollection(databaseId, col);
  console.log('[set-assessments-collection-perms] updated permissions:', fresh.permissions);
}

main().catch(e => { console.error(e); process.exit(1); });
