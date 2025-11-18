#!/usr/bin/env node
const { Client, Databases } = require('node-appwrite');

async function main() {
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const project = process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  const key = process.env.APPWRITE_API_KEY || process.env.APPWRITE_KEY || process.env.EXPO_PUBLIC_APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
  const id = process.argv[2] || 'lessons';
  const client = new Client().setEndpoint(endpoint).setProject(project).setKey(key);
  const databases = new Databases(client);
  const coll = await databases.getCollection(databaseId, id);
  console.log('id:', coll.$id);
  console.log('name:', coll.name);
  console.log('documentSecurity:', coll.documentSecurity);
  console.log('enabled:', coll.enabled);
  console.log('permissions:', coll.permissions);
  console.log('attributes:', coll.attributes.map(a=>({key:a.key,type:a.type,required:a.required,default:a.default})));
}

main().catch(err=>{console.error(err);process.exit(1);});
