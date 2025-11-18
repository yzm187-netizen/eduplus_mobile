#!/usr/bin/env node
const fetch = require('node-fetch');
async function main(){
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const project = process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY || process.env.APPWRITE_KEY || process.env.EXPO_PUBLIC_APPWRITE_API_KEY;
  const db = process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
  const id = process.argv[2] || 'lessons';
  const url = `${endpoint.replace(/\/$/,'')}/databases/${db}/collections/${id}`;
  const res = await fetch(url, { headers: { 'X-Appwrite-Project': project, 'X-Appwrite-Key': key }});
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}
main().catch(e=>{console.error(e);process.exit(1);});
