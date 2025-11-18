// Inspect the assessments collection details using server SDK
const sdk = require('node-appwrite');

function req(name, v) { if (!v) throw new Error(`Missing env ${name}`); return v; }

const endpoint = req('APPWRITE_ENDPOINT', process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT);
const project = req('APPWRITE_PROJECT_ID', process.env.APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT);
const apiKey = req('APPWRITE_API_KEY', process.env.APPWRITE_API_KEY);
const DB_ID = req('APPWRITE_DATABASE_ID', process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID);

const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(apiKey);
const db = new sdk.Databases(client);

(async () => {
  const col = await db.getCollection(DB_ID, 'assessments');
  console.log(JSON.stringify({
    $id: col.$id,
    name: col.name,
    permissions: col.permissions || col.$permissions || null,
    documentSecurity: col.documentSecurity,
    enabled: col.enabled,
  }, null, 2));
})();
