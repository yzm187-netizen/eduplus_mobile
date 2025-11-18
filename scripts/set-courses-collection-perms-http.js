#!/usr/bin/env node
/**
 * Set collection-level CRUD permissions for courses so authenticated users can create courses.
 * Keeps documentSecurity=true to allow per-document tighter update/delete (creator only).
 */
const fetch = require('node-fetch');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const project = process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY || process.env.APPWRITE_KEY || process.env.EXPO_PUBLIC_APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
  if (!project || !key || !databaseId) {
    console.error('Missing APPWRITE env vars');
    process.exit(1);
  }
  const collId = 'courses';
  const url = `${endpoint.replace(/\/$/, '')}/databases/${databaseId}/collections/${collId}`;
  const body = {
    name: 'courses',
    permissions: [
      'read("users")',
      'create("users")',
      'update("users")',
      'delete("users")'
    ],
    documentSecurity: true, // keep per-document security (creator-specific perms still enforced)
    enabled: true
  };
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': project,
      'X-Appwrite-Key': key
    },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (!res.ok) {
    console.error('Failed update', res.status, json);
    process.exit(1);
  }
  console.log('[set-courses-collection-perms-http] updated permissions:', json.permissions);
}

main().catch(e => { console.error(e); process.exit(1); });
