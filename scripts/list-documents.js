#!/usr/bin/env node
// List documents for a collection via Appwrite REST
const fetch = require('node-fetch');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const project = process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY || process.env.APPWRITE_KEY || process.env.EXPO_PUBLIC_APPWRITE_API_KEY;
  const db = process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
  const coll = process.argv[2];
  if (!coll) { console.error('Usage: node scripts/list-documents.js <collectionId>'); process.exit(1); }
  const url = `${endpoint.replace(/\/$/, '')}/databases/${db}/collections/${coll}/documents`;
  const res = await fetch(url, { headers: { 'X-Appwrite-Project': project, 'X-Appwrite-Key': key } });
  if (!res.ok) {
    const text = await res.text().catch(()=> '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
