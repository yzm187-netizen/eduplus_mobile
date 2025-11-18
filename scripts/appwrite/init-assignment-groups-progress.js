#!/usr/bin/env node
require('dotenv').config();
const { Client, Databases, Permission, Role } = require('node-appwrite');

const endpoint = process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY || process.env.EXPO_PUBLIC_APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;

if (!endpoint || !project || !apiKey || !databaseId) {
  console.error('Missing env: endpoint/project/apiKey/databaseId');
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(project).setKey(apiKey);
const db = new Databases(client);

async function ensureCollection(id, name) {
  try { return await db.getCollection(databaseId, id); } catch {}
  const perms = [Permission.read(Role.users()), Permission.create(Role.users()), Permission.update(Role.users()), Permission.delete(Role.users())];
  const created = await db.createCollection(databaseId, id, name, perms, true, true);
  console.log('Created collection', id);
  return created;
}

async function ensureStringAttr(id, key, size, required=false, array=false) {
  try { await db.createStringAttribute(databaseId, id, key, size, required, undefined, array); console.log('  +', id, key); } catch (e) { if (!String(e).includes('already exists')) console.warn('  !', id, key, e.message||e); }
}

(async () => {
  const groupsId = 'assignment_groups';
  const progressId = 'assignment_progress';
  await ensureCollection(groupsId, 'assignment_groups');
  await ensureStringAttr(groupsId, 'assignmentId', 64, true);
  await ensureStringAttr(groupsId, 'name', 128, true);
  await ensureStringAttr(groupsId, 'memberIds', 128, false, true);

  await ensureCollection(progressId, 'assignment_progress');
  await ensureStringAttr(progressId, 'assignmentId', 64, true);
  await ensureStringAttr(progressId, 'groupId', 64, true);
  await ensureStringAttr(progressId, 'progressJson', 131072, false); // up to ~128 KB
  await ensureStringAttr(progressId, 'sectionsAttachmentsJson', 131072, false);
  await ensureStringAttr(progressId, 'tasksOverlayJson', 262144, false);
  console.log('Initialized assignment group/progress collections.');
})();
