// Normalize Appwrite user emails to role-based domains and optionally reset passwords
// - Teacher domain: @teacher.edu.my
// - Student domain: @student.edu.my
// Also writes a local credentials file with known/updated passwords.
// Usage:
//   node -r dotenv/config scripts/appwrite/normalize-email-domains.js
// Env: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID

const fs = require('fs');
const path = require('path');
const sdk = require('node-appwrite');

function req(name, v) { if (!v) throw new Error(`Missing env ${name}`); return v; }

const endpoint = req('APPWRITE_ENDPOINT', process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT);
const project = req('APPWRITE_PROJECT_ID', process.env.APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT);
const apiKey = req('APPWRITE_API_KEY', process.env.APPWRITE_API_KEY);
const DB_ID = req('APPWRITE_DATABASE_ID', process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID);

const client = new sdk.Client().setEndpoint(endpoint).setProject(project).setKey(apiKey);
const users = new sdk.Users(client);
const db = new sdk.Databases(client);

const COL_PROFILES = 'profiles';

function desiredDomainForRole(role) {
  return role === 'teacher' ? 'teacher.edu.my' : 'student.edu.my';
}

function toLocalPart(email, fallbackName) {
  if (email && email.includes('@')) return email.split('@')[0];
  if (!fallbackName) return 'user';
  return String(fallbackName).toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || 'user';
}

async function listAllProfiles() {
  let cursor; const batch = 100; const out = [];
  while (true) {
    const q = [sdk.Query.limit(batch)];
    if (cursor) q.push(sdk.Query.cursorAfter(cursor));
    const res = await db.listDocuments(DB_ID, COL_PROFILES, q);
    out.push(...res.documents);
    if (!res.documents.length) break;
    cursor = res.documents[res.documents.length - 1].$id;
    if (res.documents.length < batch) break;
  }
  return out;
}

async function updateUserEmail(userId, newEmail) {
  // Try modern signature first
  try { return await users.updateEmail(userId, newEmail); } catch (e1) {}
  try { return await users.updateEmail({ userId, email: newEmail }); } catch (e2) {}
  // Some older SDKs require password to update email; skip in that case
  throw new Error('updateEmail not supported by this SDK without password. Skipping.');
}

async function updateUserPassword(userId, newPassword) {
  try { return await users.updatePassword(userId, newPassword); } catch (e1) {}
  try { return await users.updatePassword({ userId, password: newPassword }); } catch (e2) {}
  throw new Error('updatePassword not supported by this SDK');
}

async function main() {
  const profiles = await listAllProfiles();
  const credentials = [];

  for (const p of profiles) {
    const id = p.$id;
    const role = p.role === 'teacher' ? 'teacher' : 'student';
    const domain = desiredDomainForRole(role);
    const local = toLocalPart(p.email, p.name || p.preferredName);
    const desiredEmail = `${local}@${domain}`;
    const currentEmail = p.email || '';
    let changed = false;
    let emailUpdated = false;
    if (currentEmail.toLowerCase() !== desiredEmail.toLowerCase()) {
      try {
        await updateUserEmail(id, desiredEmail);
        await db.updateDocument(DB_ID, COL_PROFILES, id, { email: desiredEmail });
        changed = true; emailUpdated = true;
        console.log(`[email] ${currentEmail} -> ${desiredEmail}`);
      } catch (e) {
        console.warn(`[email] Failed to update for ${id}:`, e.message || e);
      }
    }

    // Password policy: if we created the user or want consistent demo creds, set known defaults
    let password = null;
    if (role === 'teacher') {
      // Use a standard teacher demo password
      password = 'EduPlus!Teacher123';
    } else {
      // Student-specific defaults: use first name when available
      const first = (p.name || local).split(/\s|\./)[0];
      const cap = first ? (first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()) : 'Student';
      password = `EduPlus!${cap}123`;
      // If this looks like Jamie Lee we keep the known password used during creation
      if (local.startsWith('jamie.lee')) password = 'EduPlus#2025!JamieL';
    }
    let pwdSet = false; let pwdNote = '';
    try { await updateUserPassword(id, password); pwdSet = true; }
    catch (e) { pwdNote = String(e?.message || e); console.warn(`[password] Failed to set for ${desiredEmail}:`, pwdNote); }
    credentials.push({
      name: p.name || p.preferredName || local,
      role,
      currentEmail,
      desiredEmail,
      emailUpdated,
      password: pwdSet ? password : '(unchanged)',
    });
  }

  // Write local credentials file
  const outPath = path.join(process.cwd(), 'docs', 'eduplus', 'credentials.local.md');
  const lines = [];
  lines.push('# Demo Credentials (Local)');
  lines.push('');
  lines.push('Note: Do not commit this file. Contains sensitive data.');
  lines.push('');
  for (const c of credentials) {
    const roleLabel = c.role === 'teacher' ? 'Teacher' : 'Student';
    const emailLine = c.emailUpdated ? c.desiredEmail : `${c.desiredEmail} (login currently ${c.currentEmail})`;
    lines.push(`- ${roleLabel}: ${c.name} — ${emailLine} — ${c.password}`);
  }
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log('Credentials written to', outPath);
}

main().catch(e => { console.error(e); process.exit(1); });
