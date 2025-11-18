#!/usr/bin/env node
/**
 * Ensure the lessons collection allows create("users") so clients can add lessons.
 * Optionally keeps existing permissions and adds the needed one.
 */
const { Client, Databases } = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const project = process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY || process.env.APPWRITE_KEY || process.env.EXPO_PUBLIC_APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
  if (!project || !key || !databaseId) {
    console.error('Missing APPWRITE env vars (PROJECT_ID, API_KEY, DATABASE_ID).');
    process.exit(1);
  }
  const client = new Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const databases = new Databases(client);
  const collectionId = 'lessons';

  const coll = await databases.getCollection(databaseId, collectionId);
  const current = coll.permissions || [];
  const needed = [
    'create("users")',
    'read("users")',
    'update("users")',
    'delete("users")',
  ];
  const perms = Array.from(new Set([...(current||[]), ...needed]));
  if (current && perms.length === current.length) {
    console.log('[set-lessons-collection-perms] create("users") already present');
    return;
  }
  // updateCollection signature varies by SDK version; supply name and new permissions only
  // If permissions are undefined (legacy), attempt update then re-get.
  const updated = await databases.updateCollection(databaseId, collectionId, coll.name, perms, coll.documentSecurity, coll.enabled);
  const fresh = await databases.getCollection(databaseId, collectionId);
  console.log('[set-lessons-collection-perms] updated permissions:', fresh.permissions);
}

main().catch(err => { console.error(err); process.exit(1); });
